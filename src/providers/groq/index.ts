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

interface GroqModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  active: boolean;
  context_window: number;
}

export interface GroqStandardModelList {
    object: string;
    data: GroqModel[];
  }

class GroqWrapper implements IProviderWrapper {
  private client: OpenAI;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.GROQ_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.groq.com/openai/v1';

    this.client = new OpenAI({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  /*private convertGroqToStandardModelList(togetherModels: TogetherModelArray): StandardModelList {
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
  }*/

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    if (params.enrich) {
      return this.client.models.list();
    } else {
      return this.client.models.list();
    }
  }

  public async completions(params: HandlerParams & { stream: true }): Promise<ResultStreaming>;

  public async completions(params: HandlerParams & { stream?: false }): Promise<ResultNotStreaming>;
  
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    if (params.stream) {
      // Process streaming responses
      const response = await this.client.chat.completions.create({
        ...params,
        stream: params.stream,
      });
      return response;
    } else {
      // Process non-streaming responses
      const response = await this.client.chat.completions.create({
        ...params,
        stream: false,
      });
      return response;
    }
  }
}

export default GroqWrapper;