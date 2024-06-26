import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { Stream } from 'openai/streaming';

import { MessageCreateParamsStreaming, MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources';

import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList } from '../../types';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
  Model,
  EnrichedModel,
} from '../../types';

import { getUnixTimestamp } from '../../utils/getUnixTimestamp';
import { ChatCompletion } from 'openai/resources/chat/completions'
import { modelEnrichmentData } from './models';

import { convertToStandardStaticModelList } from '../../utils/modelsConversion';

class AnthropicWrapper implements IProviderWrapper {
  private client: Anthropic;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.anthropic.com';

    this.client = new Anthropic({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  private toAnthropicPrompt(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Anthropic.Messages.MessageParam[] {
    // Filter out messages that do not have roles of 'user' or 'assistant'
    const filteredMessages = messages.filter((message) => message.role === 'user' || message.role === 'assistant');
  
    // Now work with the pre-filtered messages
    return filteredMessages.map((message): Anthropic.Messages.MessageParam => {
      // Filter out messages with null content or transform them as needed
      if (message.content === null) {
        // If it's acceptable to convert null to an empty string, do so here
        message.content = '';
        // Or if you decided to omit messages with null content, they will be filtered out later
      }
  
      return {
        content: message.content as string, // Cast here assures the type matches
        role: message.role as 'user' | 'assistant', // Only 'user' or 'assistant' roles are included
      };
    }).filter((param) => param.content !== null); // In case we decided to filter out null contents
  }

  private extractSystemMessageContent(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): string | undefined {
    for (const message of messages) {
      if (message.role === 'system') {
        return message.content;
      }
    }
    return undefined; // This line is actually optional as the function would return undefined by default if no return statement is executed.
  }
  
  private convertFinishReasonStreaming(anthropicStopReason: Anthropic.RawMessageDeltaEvent.Delta['stop_reason']):OpenAI.ChatCompletionChunk.Choice['finish_reason'] {
    if (anthropicStopReason == 'max_tokens') {
      return 'length'
    } else if (anthropicStopReason == 'end_turn') {
      return 'stop'
    } else {
      return null
    }
  }

  private convertFinishReasonNoStreaming(anthropicStopReason: Anthropic.RawMessageDeltaEvent.Delta['stop_reason']):ChatCompletion.Choice['finish_reason'] {
    if (anthropicStopReason == 'max_tokens') {
      return 'length'
    } else if (anthropicStopReason == 'tool_use') {
      return 'tool_calls'
    } else {
      return 'stop'
    }
  }

  private toResponse(
    anthropicResponse: Anthropic.Message
  ): ChatCompletion {
    const basicChoice:ChatCompletion.Choice = {
      message: {
        content: null,
        role: 'assistant'
      },
      logprobs: null, // Assuming logprobs are not provided in the anthropic response
      finish_reason: this.convertFinishReasonNoStreaming(anthropicResponse.stop_reason),
      index: 0, // Index is set to 0 assuming only one completion is handled, otherwise this needs to be handled according to the data structure
    };
    const toolUse: ChatCompletion.Choice['message']['tool_calls'] = []
  
    for (const contentItem of anthropicResponse.content) {
      if (contentItem.type === 'text') {
        basicChoice.message.content = contentItem.text
      } else if (contentItem.type === 'tool_use') {
        toolUse.push({
          id: contentItem.id,
          type: 'function',
          function: {
            name: contentItem.name,
            arguments: JSON.stringify(contentItem.input)
          }
        })
      }
    }
    if (toolUse.length > 0) {
      basicChoice.message.tool_calls = toolUse;
    }
    return {
      id: anthropicResponse.id,
      model: anthropicResponse.model,
      object: 'chat.completion',
      created: getUnixTimestamp(),
      usage: {
        prompt_tokens: anthropicResponse.usage.input_tokens,
        completion_tokens: anthropicResponse.usage.output_tokens,
        total_tokens: (anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens)
      },
      choices: [
        basicChoice
      ],
    };
  }

  private convertOpenAIToolToAnthropicTool(tool: OpenAI.ChatCompletionTool): Anthropic.Tool {
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: this.mapParametersToInputSchema(tool.function.parameters)
    }
  }

  private mapParametersToInputSchema(parameters: OpenAI.ChatCompletionTool['function']['parameters']): Anthropic.Tool.InputSchema {
    const properties: unknown = parameters?.properties
    const required: unknown = parameters?.required
    return {
      type: 'object',
      ...(properties !== undefined && { properties }),
      ...(required !== undefined && { required })
    };
  }

  private convertStreamEventToOpenAIChunk(event:Anthropic.Messages.MessageStreamEvent, model:string, messageId: string):OpenAI.Chat.Completions.ChatCompletionChunk {
    const chunk: OpenAI.Chat.Completions.ChatCompletionChunk = {
      id: messageId, // We need to populate this from the input event
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000), // Assuming current time for lack of a better reference
      model: model, // We will populate this from the input event
      system_fingerprint: undefined,
      choices: [], // We will create this from the input event content
    };
    //console.log(event);
    if (
      event.type === 'message_start'
    ) {
      chunk.choices = [
        {
          index: 0,
          delta: { role: 'assistant', content: ''},
          logprobs: null,
          finish_reason: null
        }
      ]
    }
    if (
      event.type === 'content_block_delta'
    ) {
      chunk.choices = [
        {
          index: 0,
          delta: { content: event.delta.type === 'text_delta' ? event.delta.text : '' },
          logprobs: null,
          finish_reason: null
        }
      ]
    }
    if (
      event.type === 'message_delta'
    ) {
      chunk.choices = [
        {
          index: 0,
          delta: {},
          logprobs: null,
          finish_reason: this.convertFinishReasonStreaming(event.delta.stop_reason)
        }
      ]
    }
    return chunk
  }

  private async* internalIterator(stream: AsyncIterable<Anthropic.Messages.MessageStreamEvent>, model: string): AsyncIterator<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const validEventTypes = new Set(['message_start', 'content_block_delta', 'message_delta']);
    let messageId: string | undefined;
    messageId = '';
    for await (const item of stream) {
      // Capture the message ID from the first message_start event
      if (item.type === 'message_start') {
        messageId = item.message.id;
      }
      if (validEventTypes.has(item.type)) {
        yield this.convertStreamEventToOpenAIChunk(item, model, messageId);
      }
    }
  }
  
  private convertAnthropicStreamtoOpenAI(stream: AsyncIterable<Anthropic.Messages.MessageStreamEvent>, model: string): Stream<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const controller = new AbortController;
    const iterator = () => this.internalIterator(stream,model);
    return new Stream(iterator, controller);
  }

  private enrichModels(standardModelList: StandardModelList): EnrichedModelList {
    const enrichedData = standardModelList.data
      .filter((model: Model) => Object.prototype.hasOwnProperty.call(modelEnrichmentData, model.id))
      .map((model: Model): EnrichedModel => {
        const enrichmentData = modelEnrichmentData[model.id];
        return {
          ...model,
          ...enrichmentData,
        };
      });

    return {
      object: standardModelList.object,
      data: enrichedData,
    };
  }

  private convertToolChoiceToAnthropic(
    openAIToolChoice: OpenAI.ChatCompletionToolChoiceOption | undefined
  ): Anthropic.MessageCreateParams.ToolChoiceAuto | Anthropic.MessageCreateParams.ToolChoiceAny | Anthropic.MessageCreateParams.ToolChoiceTool | undefined {
    if (!openAIToolChoice) {
      return undefined;
    }
  
    if (openAIToolChoice === 'none' || openAIToolChoice === 'auto') {
      return { type: 'auto' };
    }
  
    if (openAIToolChoice === 'required') {
      return { type: 'any' };
    }
  
    if (typeof openAIToolChoice === 'object' && openAIToolChoice.type === 'function') {
      return {
        type: 'tool',
        name: openAIToolChoice.function.name
      };
    }
  
    throw new Error('Invalid tool_choice value');
  }

  private validateMaxTokens(maxTokens?: number | null): number {
    if (typeof maxTokens !== 'number' || maxTokens <= 0 || maxTokens === undefined || maxTokens === null) {
      return 1024; // default value
    }
    if (maxTokens > 4096) {
      console.warn('max_tokens exceeds the maximum value of 4096. It has been capped to 4096.');
      return 4096; // capped value
    }
    return maxTokens;
  }
  
  private validateTemperature(temperature?: number | null): number | undefined {
    if (temperature === undefined || temperature === null) return undefined;
    if (temperature < 0 || temperature > 1) {
      throw new Error('Temperature must be between 0 and 1.');
    }
    return temperature;
  }
  
  private validateTools(tools?: OpenAI.ChatCompletionTool[]): Anthropic.Tool[] | undefined {
    if (tools === null) {
      return undefined;
    } else if (tools) {
      return tools.map((tool) => this.convertOpenAIToolToAnthropicTool(tool));
    } else {
      return undefined; // undefined if not specified
    }
  }
  
  private validateAndGenerateNonStreamingParamsArray(params: HandlerParams): MessageCreateParamsNonStreaming {
    // Validate individual parameters using helper functions
    const maxTokens = this.validateMaxTokens(params.max_tokens);
    const temperature = this.validateTemperature(params.temperature);
    const tools = this.validateTools(params.tools);
    const system = this.extractSystemMessageContent(params.messages);
    const tool_choice = this.convertToolChoiceToAnthropic(params.tool_choice);

    // Build the validatedParams object without mutating the input object
    const validatedParams: MessageCreateParamsNonStreaming = {
      messages: this.toAnthropicPrompt(params.messages),
      model: params.model,
      max_tokens: maxTokens,
      stream: false,
      ...(tools !== undefined && { tools }), // only add tools if it's defined
      ...(temperature !== undefined && { temperature }), // only add temperature if it's defined
      ...(system !== undefined && { system }), // only add system prompt if it's defined
      ...(tool_choice !== undefined && { tool_choice }), // only add tool_choice if it's defined
    };
  
    // Copy other optional parameters if they are defined
    /*['metadata', 'stop_sequences', 'system', 'tools', 'top_k', 'top_p'].forEach(key => {
      if (params[key] !== undefined) {
        validatedParams[key] = params[key];
      }
    });*/
  
    return validatedParams;
  }

  private validateAndGenerateStreamingParamsArray(params: HandlerParams): MessageCreateParamsStreaming {

    // Validate individual parameters using helper functions
    const maxTokens = this.validateMaxTokens(params.max_tokens);
    const temperature = this.validateTemperature(params.temperature);
    //const stream = this.validateStreamUsage(params.stream, params.tools);
    const system = this.extractSystemMessageContent(params.messages);
  
    // Build the validatedParams object without mutating the input object
    const validatedParams: MessageCreateParamsStreaming = {
      messages: this.toAnthropicPrompt(params.messages),
      model: params.model,
      max_tokens: maxTokens,
      stream: true,
      ...(temperature !== undefined && { temperature }), // only add temperature if it's defined
      ...(system !== undefined && { system }), // only add system prompt if it's defined
    };
  
    // Copy other optional parameters if they are defined
    /*['metadata', 'stop_sequences', 'system', 'tools', 'top_k', 'top_p'].forEach(key => {
      if (params[key] !== undefined) {
        validatedParams[key] = params[key];
      }
    });*/
  
    return validatedParams;
  }

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    const data = {
      object: "string",
      data: modelEnrichmentData,
    } as EnrichedModelList;
    // Check if the 'enrich' parameter is true
    if (params.enrich) {
      return data;
    } else {
      return convertToStandardStaticModelList(data);
    }
  }

  public async completions(params: HandlerParams & { stream: true }): Promise<ResultStreaming>;

  public async completions(params: HandlerParams & { stream?: false }): Promise<ResultNotStreaming>;
  
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    if (params.stream) {
      // Process streaming responses
      const validatedAnthropicParams = this.validateAndGenerateStreamingParamsArray(params);
      const response = await this.client.messages.create({
        ...validatedAnthropicParams
      });
      return this.convertAnthropicStreamtoOpenAI(response, params.model);
    } else {
      // Process non-streaming responses
      const validatedAnthropicParams = this.validateAndGenerateNonStreamingParamsArray(params);
      const response = await this.client.messages.create({
        ...validatedAnthropicParams
      });
      return this.toResponse(response);
    }
  }
}

export default AnthropicWrapper;
