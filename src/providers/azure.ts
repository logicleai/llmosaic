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
} from '../types';

const modelEnrichmentData: { [key: string]: { name: string; description: string; context_length: number; tokenizer: string; } } = {
  'gpt-4': {
    name: 'GPT-4',
    description: 'Advanced multimodal model for generating text and code, excelling in complex problem-solving with a broad knowledge base.',
    context_length: 8192,
    tokenizer: 'openai'
  },
  'gpt-4-32k': {
    name: 'GPT-4 32K',
    description: 'Enhanced GPT-4 with extended 32,768 token capacity, ideal for longer context applications while retaining high accuracy.',
    context_length: 32768,
    tokenizer: 'openai'
  },
  'gpt-4-1106-preview': {
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4 model with a massive 128,000-token capacity, featuring advanced capabilities like improved instruction following and JSON mode.',
    context_length: 128000,
    tokenizer: 'openai'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: ' Cost-effective GPT-3.5 model optimized for chat and traditional tasks, balancing performance and resource usage.',
    context_length: 4096,
    tokenizer: 'openai'
  },
  'gpt-3.5-turbo-1106': {
    name: 'GPT-3.5 Turbo 16K',
    description: 'Upgraded GPT-3.5 Turbo with 16,385 token capacity, suitable for more extended context needs while maintaining efficient processing.',
    context_length: 16385,
    tokenizer: 'openai'
  },
};


class AzureWrapper implements IProviderWrapper {
  private openai: OpenAI;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://andrai-azure-oai.openai.azure.com';
    const apiVersion = '2023-07-01-preview';

    this.openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': finalApiKey },
    });
  }

  private async *toStreamingResponse(
    response: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>,
  ): ResultStreaming {
    for await (const chunk of response) {
      yield {
        model: chunk.model,
        created: chunk.created,
        choices: chunk.choices.map((openAIChoice) => {
          return {
            delta: {
              content: openAIChoice.delta.content,
              role: openAIChoice.delta.role,
              function_call: openAIChoice.delta.function_call,
            },
            index: openAIChoice.index,
            finish_reason: openAIChoice.finish_reason,
          };
        }),
      };
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
      data: (await this.openai.models.list()).data,
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
    if (params.stream) {
      // Process streaming responses
      const response = await this.openai.chat.completions.create({
        ...params,
        stream: params.stream,
      });
      return this.toStreamingResponse(response);
    } else {
      // Process non-streaming responses
      const response = await this.openai.chat.completions.create({
        ...params,
        stream: false,
      });
      return response;
    }
  }
}

export default AzureWrapper;