/*import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
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


class AzureWrapper implements IProviderWrapper {
  private client: OpenAIClient;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://andrai-azure-oai.openai.azure.com/openai/deployments/gpt-4';
    const apiVersion = '2023-07-01-preview';

    this.client = new OpenAIClient(
      finalBaseUrl,
      new AzureKeyCredential(finalApiKey as string)
    );
  }

  async models(params: HandlerModelParams & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParams & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams & { enrich?: boolean },
  ):Promise<ModelList>{
    return {
      object: "string",
      data: [],
    } as ModelList;
  }

  public async completions(params: HandlerParams & { stream: true }): Promise<ResultStreaming>;

  public async completions(params: HandlerParams & { stream?: false }): Promise<ResultNotStreaming>;
  
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    if (params.stream) {
      // Process streaming responses
      const response = await this.client.streamChatCompletions(
        'gpt-35-turbo',
        params.messages
      );
      return response;
    } else {
      // Process non-streaming responses
      const response = await this.client.getChatCompletions(
        'gpt-35-turbo',
        params.messages
      );
      return response;
    }
  }
}

export default AzureWrapper;*/