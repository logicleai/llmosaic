import OpenAI from 'openai';
import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList } from '../../types';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
} from '../../types';

import { modelEnrichmentData } from './models';
import { enrichToStandardDynamicModelList } from '../../utils/modelsConversion';

class LogicleCloudWrapper implements IProviderWrapper {
  private openai: OpenAI;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.openai.com/v1';

    this.openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    const standardModelList = {
      object: "string",
      data: (await this.openai.models.list()).data,
    } as ModelList;
    if (params.enrich) {
      return enrichToStandardDynamicModelList(standardModelList, modelEnrichmentData);
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
      const response = await this.openai.chat.completions.create({
        ...params,
        stream: params.stream,
      });
      return response;
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

export default LogicleCloudWrapper;
