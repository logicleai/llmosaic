import Anthropic from '@anthropic-ai/sdk';

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

import { toUsage } from '../utils/toUsage';
import { combinePrompts } from '../utils/combinePrompts';
import { getUnixTimestamp } from '../utils/getUnixTimestamp';

import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions'

const modelEnrichmentData: { [key: string]: { name: string; description: string; context_length: number; tokenizer: string; } } = {
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    description: 'Latest GPT-4 model with a massive 128,000-token capacity, featuring advanced capabilities like improved instruction following and JSON mode.',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-3-sonnet-20240229': {
    name: 'Claude 3 Sonnet',
    description: 'Advanced multimodal model for generating text and code, excelling in complex problem-solving with a broad knowledge base.',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    description: 'Enhanced GPT-4 with extended 32,768 token capacity, ideal for longer context applications while retaining high accuracy.',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-2.1': {
    name: 'Claude 2.1',
    description: ' Cost-effective GPT-3.5 model optimized for chat and traditional tasks, balancing performance and resource usage.',
    context_length: 200000,
    tokenizer: 'openai'
  },
  'claude-2.0': {
    name: 'Claude 2',
    description: ' Cost-effective GPT-3.5 model optimized for chat and traditional tasks, balancing performance and resource usage.',
    context_length: 100000,
    tokenizer: 'openai'
  },
  'claude-instant-1.2': {
    name: 'Claude Instant 1.2',
    description: ' Cost-effective GPT-3.5 model optimized for chat and traditional tasks, balancing performance and resource usage.',
    context_length: 100000,
    tokenizer: 'openai'
  },
};

const modelData

class AnthropicWrapper implements IProviderWrapper {
  private client: Anthropic;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.anthropic.com';

    this.client = new Anthropic({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  private toAnthropicPrompt(messages: Message[]): string {
    const textsCombined = combinePrompts(messages);
    return `${Anthropic.HUMAN_PROMPT} ${textsCombined}${Anthropic.AI_PROMPT}`;
  }
  
  private toFinishReson(string: string): FinishReason {
    if (string === 'max_tokens') {
      return 'length';
    }
  
    return 'stop';
  }
  
  private toResponse(
    anthropicResponse: Anthropic.Message,
    prompt: string,
  ): ChatCompletion {
    return {
      model: anthropicResponse.model,
      created: getUnixTimestamp(),
      usage: toUsage(prompt, anthropicResponse.completion),
      choices: [
        {
          message: {
            content: anthropicResponse.completion,
            role: 'assistant',
          },
          finish_reason: this.toFinishReson(anthropicResponse.stop_reason),
          index: 0,
        },
      ],
    };
  }
  private toStreamingChunk(
    anthropicResponse: Anthropic.Completion,
  ): StreamingChunk {
    return {
      model: anthropicResponse.model,
      created: getUnixTimestamp(),
      choices: [
        {
          delta: { content: anthropicResponse.completion, role: 'assistant' },
          finish_reason: toFinishReson(anthropicResponse.stop_reason),
          index: 0,
        },
      ],
    };
  }
  
  private async* toStreamingResponse(
    stream: AsyncIterable<Anthropic.Completion>,
  ): ResultStreaming {
    for await (const chunk of stream) {
      yield toStreamingChunk(chunk);
    }
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
      data: (await this.client.).data,
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
        max_tokens: 200000,
        messages: [{ role: 'user', content: 'Hello, Claude' }],
        model: params.model,
        stream: true
      });
      return this.toStreamingResponse(response);
    } else {
      // Process non-streaming responses
      const response = await this.client.messages.create({
        max_tokens: 200000,
        messages: [{ role: 'user', content: 'Hello, Claude' }],
        model: params.model,
        stream: false,
      });
      return this.toResponse(response, prompt);
    }
  }
}

export default AnthropicWrapper;
