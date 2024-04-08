import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { Stream } from 'openai/streaming';

import { Tool } from '@anthropic-ai/sdk/resources/beta/tools/messages';

import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList } from '../types';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
  Model,
  EnrichedModel,
} from '../types';

import { getUnixTimestamp } from '../utils/getUnixTimestamp';

import { ChatCompletion } from 'openai/resources/chat/completions'

const modelEnrichmentData: { [key: string]: { name: string; description: string; context_length: number; tokenizer: string; } } = {
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    description: 'Most powerful model for highly complex tasks',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-3-sonnet-20240229': {
    name: 'Claude 3 Sonnet',
    description: 'Ideal balance of intelligence and speed for enterprise workloads',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    description: 'Fastest and most compact model for near-instant responsiveness',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-2.1': {
    name: 'Claude 2.1',
    description: 'Updated version of Claude 2 with improved accuracy',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-2.0': {
    name: 'Claude 2',
    description: 'Predecessor to Claude 3, offering strong all-round performance',
    context_length: 100000,
    tokenizer: 'openai'
  },
  'claude-instant-1.2': {
    name: 'Claude Instant 1.2',
    description: 'Our cheapest small and fast model, a predecessor of Claude Haiku.',
    context_length: 100000,
    tokenizer: 'openai'
  },
};

const modelStandardData: Model[] = [
  {
    id: 'claude-3-opus-20240229',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
  {
    id: 'claude-3-sonnet-20240229',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
  {
    id: 'claude-3-haiku-20240307',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
  {
    id: 'claude-2.1',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
  {
    id: 'claude-2.0',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
  {
    id: 'claude-instant-1.2',
    object: 'model',
    created: 1698959748,
    owned_by: 'system'
  },
];

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
    return messages.map((message): Anthropic.Messages.MessageParam => {
      // Filter out messages with null content or transform them as needed
      if (message.content === null) {
        // If it's acceptable to convert null to an empty string, do so here
        message.content = '';
        // Or if it's acceptable to omit messages with null content, return a placeholder 
        // that should be filtered out in a subsequent step (not shown here).
      }
    
      return {
        content: message.content as string, // Cast here assures the type matches
        role: message.role as 'user' | 'assistant', // Assuming all message roles are 'user' or 'assistant'
      };
    }).filter((param) => param.content !== null); // In case we decided to filter out null contents
  }
  
  private convertFinishReasonStreaming(anthropicStopReason: Anthropic.MessageDeltaEvent.Delta['stop_reason']):OpenAI.ChatCompletionChunk.Choice['finish_reason'] {
    if (anthropicStopReason == 'max_tokens') {
      return 'length'
    } else if (anthropicStopReason == 'end_turn') {
      return 'stop'
    } else {
      return null
    }
  }

  private convertFinishReasonNoStreaming(anthropicStopReason: Anthropic.Beta.Tools.ToolsBetaMessage['stop_reason']):ChatCompletion.Choice['finish_reason'] {
    if (anthropicStopReason == 'max_tokens') {
      return 'length'
    } else if (anthropicStopReason == 'tool_use') {
      return 'tool_calls'
    } else {
      return 'stop'
    }
  }

  private toResponse(
    anthropicResponse: Anthropic.Beta.Tools.ToolsBetaMessage
  ): ChatCompletion {
    const toolUse: ChatCompletion.Choice['message']['tool_calls'] = []
  
    for (const contentItem of anthropicResponse.content) {
      const basicChoice = {
        message: {},
        logprobs: null, // Assuming logprobs are not provided in the anthropic response
        finish_reason: this.convertFinishReasonNoStreaming(anthropicResponse.stop_reason),
        index: 0, // Index is set to 0 assuming only one completion is handled, otherwise this needs to be handled according to the data structure
      };

      if (contentItem.type === 'text') {
        const choice: ChatCompletion.Choice = {
          message: {
            content: contentItem.text,
            role: 'assistant',
          },
          logprobs: null, // Assuming logprobs are not provided in the anthropic response
          finish_reason: this.convertFinishReasonNoStreaming(anthropicResponse.stop_reason),
          index: 0, // Index is set to 0 assuming only one completion is handled, otherwise this needs to be handled according to the data structure
        }
      } else if (contentItem.type === 'tool_use') {
        toolUse.push({
          type: 'function',
          id: contentItem.id,
          function: contentItem.input as Anthropic.Beta.Tools.ToolUseBlock['input']
        })

        const choice: ChatCompletion.Choice = {
          message: {
            content: null,
            role: 'assistant',
          },
          logprobs: null, // Assuming logprobs are not provided in the anthropic response
          finish_reason: this.convertFinishReasonNoStreaming(anthropicResponse.stop_reason),
          index: 0, // Index is set to 0 assuming only one completion is handled, otherwise this needs to be handled according to the data structure
        }
      }
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
        {
          message: {
            content: anthropicResponse.content[0].text as string,
            role: 'assistant',
          },
          logprobs: null,
          finish_reason: this.convertFinishReasonNoStreaming(anthropicResponse.stop_reason),
          index: 0,
        },
      ],
    };
  }

  private convertAnthropicToolToChatCompletionTool(tool: Tool): OpenAI.ChatCompletionTool {
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: this.mapInputSchemaToParameters(tool.input_schema)
        }
    };
  }

  private mapInputSchemaToParameters(inputSchema: Tool.InputSchema): OpenAI.ChatCompletionTool['function']['parameters'] {
      return {
        type: 'object',
        properties: inputSchema.properties
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
          delta: { content: event.delta.text},
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
      .filter((model: Model) => modelEnrichmentData.hasOwnProperty(model.id))
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

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    const data = {
      object: "string",
      data: modelStandardData,
    } as ModelList;
    // Check if the 'enrich' parameter is true
    if (params.enrich) {
      return this.enrichModels(data);
    } else {
      return data;
    }
  }

  public async completions(params: HandlerParams & { stream: true }): Promise<ResultStreaming>;

  public async completions(params: HandlerParams & { stream?: false }): Promise<ResultNotStreaming>;
  
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    const temperature = params.temperature ?? 0.5;
    const prompt = this.toAnthropicPrompt(params.messages);
    if (params.stream) {
      // Process streaming responses
      const response = await this.client.messages.create({
        max_tokens: 4096,
        temperature: temperature,
        messages: this.toAnthropicPrompt(params.messages),
        model: params.model,
        stream: true,
      });
      return this.convertAnthropicStreamtoOpenAI(response, params.model);
    } else {
      // Process non-streaming responses
      const response = await this.client.beta.tools.messages.create({
        max_tokens: 4096,
        temperature: temperature,
        messages: this.toAnthropicPrompt(params.messages),
        model: params.model,
        stream: false
      });
      return this.toResponse(response);
    }
  }
}

export default AnthropicWrapper;
