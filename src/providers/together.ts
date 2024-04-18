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
  ModelEnrichmentDataType,
} from '../types';

const modelEnrichmentData:ModelEnrichmentDataType = {
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'GPT-4 Turbo with Vision. The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling. Currently points to gpt-4-turbo-2024-04-09',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-turbo-2024-04-09': {
    name: 'GPT-4 Turbo',
    description: 'GPT-4 Turbo with Vision model. Vision requests can now use JSON mode and function calling. gpt-4-turbo currently points to this version',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-turbo-preview': {
    name: 'GPT-4 Turbo Preview',
    description: 'GPT-4 Turbo preview model. Currently points to gpt-4-0125-preview',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-0125-preview': {
    name: 'GPT-4 Turbo Preview (0125)',
    description: 'GPT-4 Turbo preview model intended to reduce cases of “laziness” where the model doesn’t complete a task. Returns a maximum of 4,096 output tokens',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-1106-preview': {
    name: 'GPT-4 Turbo Preview (1106)',
    description: 'GPT-4 Turbo preview model featuring improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Returns a maximum of 4,096 output tokens. This is a preview model',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-vision-preview': {
    name: 'GPT-4 Turbo with Vision Preview',
    description: 'GPT-4 model with the ability to understand images, in addition to all other GPT-4 Turbo capabilities. This is a preview model, we recommend developers to now use gpt-4-turbo which includes vision capabilities. Currently points to gpt-4-1106-vision-preview',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4-1106-vision-preview': {
    name: 'GPT-4 Turbo with Vision Preview',
    description: 'GPT-4 model with the ability to understand images, in addition to all other GPT-4 Turbo capabilities. This is a preview model, we recommend developers to now use gpt-4-turbo which includes vision capabilities. Returns a maximum of 4,096 output tokens',
    context_length: 128000,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 10,
      output: 30
    }
  },
  'gpt-4': {
    name: 'GPT-4',
    description: 'Currently points to gpt-4-0613',
    context_length: 8192,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 30,
      output: 60
    }
  },
  'gpt-4-0613': {
    name: 'GPT-4 (0613)',
    description: 'Snapshot of gpt-4 from June 13th 2023 with improved function calling support',
    context_length: 8192,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 30,
      output: 60
    }
  },
  'gpt-4-32k': {
    name: 'GPT-4 32K',
    description: 'Currently points to gpt-4-32k-0613. See continuous model upgrades. This model was never rolled out widely in favor of GPT-4 Turbo',
    context_length: 32768,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 60,
      output: 120
    }
  },
  'gpt-4-32k-0613': {
    name: 'GPT-4 32K (0613)',
    description: 'Snapshot of gpt-4-32k from June 13th 2023 with improved function calling support. This model was never rolled out widely in favor of GPT-4 Turbo',
    context_length: 32768,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 60,
      output: 120
    }
  },
  'gpt-3.5-turbo-0125': {
    name: 'GPT-3.5 Turbo (0125)',
    description: 'The latest GPT-3.5 Turbo model with higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls. Returns a maximum of 4,096 output tokens',
    context_length: 16385,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 0.5,
      output: 1.5
    }
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Currently points to gpt-3.5-turbo-0125',
    context_length: 16385,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 0.5,
      output: 1.5
    }
  },
  'gpt-3.5-turbo-1106': {
    name: 'GPT-3.5 Turbo (1106)',
    description: 'GPT-3.5 Turbo model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Returns a maximum of 4,096 output tokens',
    context_length: 16385,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 0.5,
      output: 1.5
    }
  },
  'gpt-3.5-turbo-0613': {
    name: 'GPT-3.5 Turbo Legacy (0613)',
    description: 'Snapshot of gpt-3.5-turbo from June 13th 2023. Will be deprecated on June 13, 2024',
    context_length: 4096,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 0.5,
      output: 1.5
    }
  },
  'gpt-3.5-turbo-16k': {
    name: 'GPT-3.5 Turbo 16K Legacy (0613)',
    description: 'Snapshot of gpt-3.5-16k-turbo from June 13th 2023. Will be deprecated on June 13, 2024',
    context_length: 16385,
    tokenizer: 'cl100k_base',
    capabilities: {
      vision: false,
      function_calling: true
    },
    prices: {
      input: 0.5,
      output: 1.5
    }
  }
};

const modelStandardData: Model[] = [{id: 'zero-one-ai/Yi-34B-Chat', object: 'model', created: 1713479642, owned_by: '01.AI'}, {id: 'allenai/OLMo-7B-Instruct', object: 'model', created: 1713479642, owned_by: 'Allen AI'}, {id: 'allenai/OLMo-7B-Twin-2T', object: 'model', created: 1713479642, owned_by: 'Allen AI'}, {id: 'allenai/OLMo-7B', object: 'model', created: 1713479642, owned_by: 'Allen AI'}, {id: 'Austism/chronos-hermes-13b', object: 'model', created: 1713479642, owned_by: 'Austism'}, {id: 'cognitivecomputations/dolphin-2.5-mixtral-8x7b', object: 'model', created: 1713479642, owned_by: 'cognitivecomputations'}, {id: 'databricks/dbrx-instruct', object: 'model', created: 1713479642, owned_by: 'databricks'}, {id: 'deepseek-ai/deepseek-coder-33b-instruct', object: 'model', created: 1713479642, owned_by: 'DeepSeek'}, {id: 'deepseek-ai/deepseek-llm-67b-chat', object: 'model', created: 1713479642, owned_by: 'DeepSeek'}, {id: 'garage-bAInd/Platypus2-70B-instruct', object: 'model', created: 1713479642, owned_by: 'garage-bAInd'}, {id: 'google/gemma-2b-it', object: 'model', created: 1713479642, owned_by: 'Google'}, {id: 'google/gemma-7b-it', object: 'model', created: 1713479642, owned_by: 'Google'}, {id: 'Gryphe/MythoMax-L2-13b', object: 'model', created: 1713479642, owned_by: 'Gryphe'}, {id: 'lmsys/vicuna-13b-v1.5', object: 'model', created: 1713479642, owned_by: 'LM Sys'}, {id: 'lmsys/vicuna-7b-v1.5', object: 'model', created: 1713479642, owned_by: 'LM Sys'}, {id: 'codellama/CodeLlama-13b-Instruct-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'codellama/CodeLlama-34b-Instruct-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'codellama/CodeLlama-70b-Instruct-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'codellama/CodeLlama-7b-Instruct-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'meta-llama/Llama-2-70b-chat-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'meta-llama/Llama-2-13b-chat-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'meta-llama/Llama-2-7b-chat-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'meta-llama/Llama-3-8b-chat-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'meta-llama/Llama-3-70b-chat-hf', object: 'model', created: 1713479642, owned_by: 'Meta'}, {id: 'microsoft/WizardLM-2-8x22B', object: 'model', created: 1713479642, owned_by: 'Microsoft'}, {id: 'mistralai/Mistral-7B-Instruct-v0.1', object: 'model', created: 1713479642, owned_by: 'mistralai'}, {id: 'mistralai/Mistral-7B-Instruct-v0.2', object: 'model', created: 1713479642, owned_by: 'mistralai'}, {id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', object: 'model', created: 1713479642, owned_by: 'mistralai'}, {id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', object: 'model', created: 1713479642, owned_by: 'mistralai'}, {id: 'NousResearch/Nous-Capybara-7B-V1p9', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-2-Mistral-7B-DPO', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-llama-2-7b', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-Llama2-13b', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'NousResearch/Nous-Hermes-2-Yi-34B', object: 'model', created: 1713479642, owned_by: 'NousResearch'}, {id: 'openchat/openchat-3.5-1210', object: 'model', created: 1713479642, owned_by: 'OpenChat'}, {id: 'Open-Orca/Mistral-7B-OpenOrca', object: 'model', created: 1713479642, owned_by: 'OpenOrca'}, {id: 'Qwen/Qwen1.5-0.5B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-1.8B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-4B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-7B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-14B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-32B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'Qwen/Qwen1.5-72B-Chat', object: 'model', created: 1713479642, owned_by: 'Qwen'}, {id: 'snorkelai/Snorkel-Mistral-PairRM-DPO', object: 'model', created: 1713479642, owned_by: 'Snorkel AI'}, {id: 'togethercomputer/alpaca-7b', object: 'model', created: 1713479642, owned_by: 'Stanford'}, {id: 'teknium/OpenHermes-2-Mistral-7B', object: 'model', created: 1713479642, owned_by: 'Teknium'}, {id: 'teknium/OpenHermes-2p5-Mistral-7B', object: 'model', created: 1713479642, owned_by: 'Teknium'}, {id: 'togethercomputer/Llama-2-7B-32K-Instruct', object: 'model', created: 1713479642, owned_by: 'Together'}, {id: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1', object: 'model', created: 1713479642, owned_by: 'Together'}, {id: 'togethercomputer/RedPajama-INCITE-7B-Chat', object: 'model', created: 1713479642, owned_by: 'Together'}, {id: 'togethercomputer/StripedHyena-Nous-7B', object: 'model', created: 1713479642, owned_by: 'Together'}, {id: 'Undi95/ReMM-SLERP-L2-13B', object: 'model', created: 1713479642, owned_by: 'Undi95'}, {id: 'Undi95/Toppy-M-7B', object: 'model', created: 1713479642, owned_by: 'Undi95'}, {id: 'WizardLM/WizardLM-13B-V1.2', object: 'model', created: 1713479642, owned_by: 'WizardLM'}, {id: 'upstage/SOLAR-10.7B-Instruct-v1.0', object: 'model', created: 1713479642, owned_by: 'upstage'}];

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

  private enrichModels(standardModelList: StandardModelList): EnrichedModelList {
    const enrichedData = standardModelList.data
      .filter((model: Model) => Object.prototype.hasOwnProperty.call(modelEnrichmentData, model.id))
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
      data: modelStandardData,
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