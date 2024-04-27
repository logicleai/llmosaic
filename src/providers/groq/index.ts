import OpenAI from 'openai';
import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList, Model } from '../../types';
import { enrichToStandardDynamicModelList } from '../../utils/modelsConversion';
import { modelEnrichmentData } from './models';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
} from '../../types';

interface GroqModel extends Model {
  active: boolean;
  context_window: number;
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

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    const models = ((await this.client.models.list()).data as GroqModel[]).filter(model => model.active).map(({ active, context_window, ...rest }) => rest); // Filter out objects with active: false and exclude active and context_window properties
    const standardModelList = {
      object: "string",
      data: models,
    } as ModelList;
    if (params.enrich) {
      return enrichToStandardDynamicModelList(standardModelList, modelEnrichmentData);;
    } else {
      return standardModelList;
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