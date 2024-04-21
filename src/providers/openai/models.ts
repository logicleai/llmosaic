import { EnrichedModel } from '../../types';

export const modelEnrichmentData:EnrichedModel[] = [
    {
      name: 'GPT-4 Turbo',
      description: 'GPT-4 Turbo with Vision. The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling. Currently points to gpt-4-turbo-2024-04-09',
      id: 'gpt-4-turbo',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo (0409)',
      description: 'GPT-4 Turbo with Vision model. Vision requests can now use JSON mode and function calling. gpt-4-turbo currently points to this version',
      id: 'gpt-4-turbo-2024-04-09',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo Preview',
      description: 'GPT-4 Turbo preview model. Currently points to gpt-4-0125-preview',
      id: 'gpt-4-turbo-preview',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo Preview (0125)',
      description: 'GPT-4 Turbo preview model intended to reduce cases of “laziness” where the model doesn’t complete a task. Returns a maximum of 4,096 output tokens',
      id: 'gpt-4-0125-preview',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo Preview (1106)',
      description: 'GPT-4 Turbo preview model featuring improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Returns a maximum of 4,096 output tokens. This is a preview model',
      id: 'gpt-4-1106-preview',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo Vision Preview',
      description: 'GPT-4 model with the ability to understand images, in addition to all other GPT-4 Turbo capabilities. This is a preview model, we recommend developers to now use gpt-4-turbo which includes vision capabilities. Currently points to gpt-4-1106-vision-preview',
      id: 'gpt-4-vision-preview',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 Turbo Vision Preview (1106)',
      description: 'GPT-4 model with the ability to understand images, in addition to all other GPT-4 Turbo capabilities. This is a preview model, we recommend developers to now use gpt-4-turbo which includes vision capabilities. Returns a maximum of 4,096 output tokens',
      id: 'gpt-4-1106-vision-preview',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4',
      description: 'Currently points to gpt-4-0613',
      id: 'gpt-4',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 (0613)',
      description: 'Snapshot of gpt-4 from June 13th 2023 with improved function calling support',
      id: 'gpt-4-0613',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 32K',
      description: 'Currently points to gpt-4-32k-0613. See continuous model upgrades. This model was never rolled out widely in favor of GPT-4 Turbo',
      id: 'gpt-4-32k',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-4 32K (0613)',
      description: 'Snapshot of gpt-4-32k from June 13th 2023 with improved function calling support. This model was never rolled out widely in favor of GPT-4 Turbo',
      id: 'gpt-4-32k-0613',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-3.5 Turbo (0125)',
      description: 'The latest GPT-3.5 Turbo model with higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls. Returns a maximum of 4,096 output tokens',
      id: 'gpt-3.5-turbo-0125',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-3.5 Turbo',
      description: 'Currently points to gpt-3.5-turbo-0125',
      id: 'gpt-3.5-turbo',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-3.5 Turbo (1106)',
      description: 'GPT-3.5 Turbo model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Returns a maximum of 4,096 output tokens',
      id: 'gpt-3.5-turbo-1106',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-3.5 Turbo Legacy (0613)',
      description: 'Snapshot of gpt-3.5-turbo from June 13th 2023. Will be deprecated on June 13, 2024',
      id: 'gpt-3.5-turbo-0613',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
    {
      name: 'GPT-3.5 Turbo 16K Legacy (0613)',
      description: 'Snapshot of gpt-3.5-16k-turbo from June 13th 2023. Will be deprecated on June 13, 2024',
      id: 'gpt-3.5-turbo-16k',
      object: 'model',
      created: 1698959748,
      owned_by: 'openai',
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
  ];