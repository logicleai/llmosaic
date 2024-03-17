import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList } from '../types';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
  Model,
  EnrichedModel,
  FinishReason,
  Message,
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
  
  private toFinishReson(string: string | null): FinishReason {
    if (string === 'max_tokens') {
      return 'length';
    }
  
    return 'stop';
  }
  
  private toResponse(
    anthropicResponse: Anthropic.Message
  ): ChatCompletion {
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
            content: anthropicResponse.content[0].text,
            role: 'assistant',
          },
          logprobs: null,
          finish_reason: this.toFinishReson(anthropicResponse.stop_reason),
          index: 0,
        },
      ],
    };
  }
  
  /*private toStreamingChunk(
    anthropicResponse: Anthropic.Completion,
  ): StreamingChunk {
    return {
      model: anthropicResponse.model,
      created: getUnixTimestamp(),
      choices: [
        {
          delta: { content: anthropicResponse.completion, role: 'assistant' },
          finish_reason: this.toFinishReson(anthropicResponse.stop_reason),
          index: 0,
        },
      ],
    };
  }*/
  
  /*private async* toStreamingResponse(
    stream: AsyncIterable<Anthropic.Completion>,
  ): ResultStreaming {
    for await (const chunk of stream) {
      yield this.toStreamingChunk(chunk);
    }
  }*/

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
      /*const response = await this.client.messages.create({
        max_tokens: 200000,
        messages: [{ role: 'user', content: 'Hello, Claude' }],
        model: params.model,
        stream: true
      });*/
      const EMPTY_STREAM = {
      } as Promise<ResultNotStreaming>;
      
      return EMPTY_STREAM;
    } else {
      // Process non-streaming responses
      const response = await this.client.messages.create({
        max_tokens: 4096,
        messages: this.toAnthropicPrompt(params.messages),
        model: params.model,
        stream: false,
      });
      return this.toResponse(response);
    }
  }
}

export default AnthropicWrapper;
