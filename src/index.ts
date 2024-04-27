import OpenAIWrapper from './providers/openai';
import AnthropicWrapper from './providers/anthropic';
import TogetherWrapper from './providers/together';
import GroqWrapper from './providers/groq';
//import AzureWrapper from './providers/azure';
//import OllamaWrapper from './providers/ollama';

import {
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
  HandlerModelParamsEnriched,
  HandlerModelParamsStandard,
} from './types';

interface ProviderParams {
  apiKey: string;
  baseUrl?: string;
  providerType: ProviderType;
}

export enum ProviderType {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
/*  Azure = 'azure',*/
/*  Ollama = 'ollama',*/
  LocalAI = 'localai',
  TogetherAI = 'togetherai',
  Groq = 'groq',
}

export class Provider {
  private apiKey: string;
  private baseUrl: string | undefined;
  private providerType: ProviderType;

  private static PROVIDER_TYPE_HANDLER_MAPPINGS: Record<ProviderType,(apiKey: string, baseUrl: string | undefined) => IProviderWrapper> = {
      [ProviderType.OpenAI]: (apiKey, baseUrl) =>
      new OpenAIWrapper(apiKey, baseUrl),
      [ProviderType.Anthropic]: (apiKey, baseUrl) =>
      new AnthropicWrapper(apiKey, baseUrl),
      /*[ProviderType.Azure]: (apiKey, baseUrl) =>
      new AzureWrapper(apiKey, baseUrl),*/
      /*[ProviderType.Ollama]: (apiKey, baseUrl) =>
      new OllamaWrapper(apiKey, baseUrl),*/
      [ProviderType.LocalAI]: (apiKey, baseUrl) =>
      new OpenAIWrapper(apiKey, baseUrl),
      [ProviderType.TogetherAI]: (apiKey, baseUrl) =>
      new TogetherWrapper(apiKey, baseUrl),
      [ProviderType.Groq]: (apiKey, baseUrl) =>
      new GroqWrapper(apiKey, baseUrl),
  };

  private client: IProviderWrapper;

  constructor(params: ProviderParams) {
    this.apiKey = params.apiKey;
    this.baseUrl = params.baseUrl ?? undefined;
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
      return this.client.completions(
        params as HandlerParamsNotStreaming & { stream: false }
      );
    }
  }
}
