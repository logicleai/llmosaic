import OpenAI from 'openai';
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

interface TogetherPricing {
  hourly: number;
  input: number;
  output: number;
  base: number;
  finetune: number;
}

interface TogetherModel {
  id: string;
  object: string;
  created: number;
  type: string;
  display_name: string;
  organization: string;
  link: string;
  license: string;
  context_length?: number;
  pricing: TogetherPricing;
}

type TogetherModelArray = TogetherModel[];

class TogetherWrapper implements IProviderWrapper {
  private together: OpenAI;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.TOGETHER_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.together.xyz/v1';

    this.together = new OpenAI({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  private async fetchModels(): Promise<TogetherModelArray> {
    try {
      const response = await fetch(`${this.together.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.together.apiKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching models with Fetch:', error);
      throw error;
    }
  }

  private convertTogetherModelArrayToStandardModelList(togetherModels: TogetherModelArray): StandardModelList {
    const standardModels: Model[] = togetherModels.map(togetherModel => ({
      id: togetherModel.id,
      object: togetherModel.object,
      created: togetherModel.created,
      owned_by: togetherModel.organization,
    }));
    
    return {
      object: "list",
      data: standardModels,
    };
  }

  private convertTogetherModelArrayToEnrichedModelList(togetherModels: TogetherModelArray): EnrichedModelList {
    const enrichedModels: EnrichedModel[] = togetherModels.map(togetherModel => ({
      id: togetherModel.id,
      object: togetherModel.object,
      created: togetherModel.created,
      owned_by: togetherModel.organization,
      name: togetherModel.display_name,
      description: null,
      context_length: togetherModel.context_length ?? null,
      tokenizer: null,
      capabilities: null,
      prices: {
        input: togetherModel.pricing.input,
        output: togetherModel.pricing.output
      }
    }));
    
    return {
      object: "list",
      data: enrichedModels,
    };
  }

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    if (params.enrich) {
      return this.convertTogetherModelArrayToEnrichedModelList(await this.fetchModels());
    } else {
      return this.convertTogetherModelArrayToStandardModelList(await this.fetchModels());
    }
  }

  public async completions(params: HandlerParams & { stream: true }): Promise<ResultStreaming>;

  public async completions(params: HandlerParams & { stream?: false }): Promise<ResultNotStreaming>;
  
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    if (params.stream) {
      // Process streaming responses
      const response = await this.together.chat.completions.create({
        ...params,
        stream: params.stream,
      });
      return response;
    } else {
      // Process non-streaming responses
      const response = await this.together.chat.completions.create({
        ...params,
        stream: false,
      });
      return response;
    }
  }
}

export default TogetherWrapper;