import OpenAI from 'openai';
import { EnrichedModelList, IProviderWrapper, ModelList, StandardModelList } from '../../types';
import {
  HandlerModelParams,
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result
} from '../../types';

import { modelEnrichmentData } from './models';
import { enrichToStandardDynamicModelList } from '../../utils/modelsConversion';



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

  private async fetchModels(): Promise<any> {
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

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    const standardModelList = {
      object: "string",
      data: (await this.fetchModels()) as any,
    } as ModelList;
    console.log(await this.fetchModels());
    if (params.enrich) {
      return standardModelList;
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