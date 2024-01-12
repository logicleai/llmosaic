import OpenAIWrapper from './providers/openai';
import OllamaWrapper from './providers/ollama';
import {
  Handler,
  HandlerModelParams,
  HandlerParams,
  HandlerParamsNotStreaming,
  HandlerParamsStreaming,
  Result,
  ResultNotStreaming,
  ResultStreaming,
  IProviderWrapper,
  ModelList,
  EnrichedModelList,
  StandardModelList,
  Model,
  HandlerModelParamsEnriched,
  HandlerModelParamsStandard,
} from './types';

interface ProviderParams {
  apiKey: string;
  baseUrl: string;
  providerType: ProviderType;
}

export enum ProviderType {
  OpenAI = 'openai',
  Ollama = 'ollama',
  LocalAI = 'localai',
}

export class Provider {
  private apiKey: string;
  private baseUrl: string;
  private providerType: ProviderType;

  private static PROVIDER_TYPE_HANDLER_MAPPINGS: Record<
    ProviderType,
    (apiKey: string, baseUrl: string) => IProviderWrapper
  > = {
      [ProviderType.OpenAI]: (apiKey, baseUrl) =>
      new OpenAIWrapper(apiKey, baseUrl),
      [ProviderType.Ollama]: (apiKey, baseUrl) =>
      new OllamaWrapper(apiKey, baseUrl),
      [ProviderType.LocalAI]: (apiKey, baseUrl) =>
      new OpenAIWrapper(apiKey, baseUrl),
  };

  private client: IProviderWrapper;

  constructor(params: ProviderParams) {
    this.apiKey = params.apiKey;
    this.baseUrl = params.baseUrl;
    this.providerType = params.providerType;
    const clientCreationFunction =
      Provider.PROVIDER_TYPE_HANDLER_MAPPINGS[this.providerType];

    // Handle the case where there is no mapping for the given providerType
    if (!clientCreationFunction) {
      throw new Error(
        `Provider not supported for provider type: ${this.providerType}`,
      );
    }
    // Instantiate the correct provider wrapper
    this.client = clientCreationFunction(this.apiKey, this.baseUrl);
  }

  private enrichModels(modelList: ModelList): ModelList {
    return modelList;
  }

  async models(params: HandlerModelParamsEnriched & { enrich: true }):Promise<EnrichedModelList>;

  async models(params: HandlerModelParamsStandard & { enrich?: false }):Promise<StandardModelList>;

  async models(
    params: HandlerModelParams,
  ):Promise<ModelList>{
    if (params.enrich) {
      return this.client.models(params as HandlerModelParamsEnriched & { enrich: true });
    } else {
      return this.client.models(params as HandlerModelParamsStandard);;
    }
  }

  async completion(
    params: HandlerParamsNotStreaming & { stream: false },
  ): Promise<ResultNotStreaming>;

  async completion(
    params: HandlerParamsStreaming & { stream?: true },
  ): Promise<ResultStreaming>;

  async completion(params: HandlerParams): Promise<Result> {
    // Call the completions method on the handler with necessary params
    if (params.stream === true) {
      return this.client.completions(
        params as HandlerParamsStreaming & { stream: true },
      );
    } else {
      return this.client.completions(params as HandlerParamsNotStreaming);
    }
  }
}
