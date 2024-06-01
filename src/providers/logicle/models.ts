import { EnrichedModel } from '../../types';

export const modelEnrichmentData:EnrichedModel[] = [
  {
    name: 'GPT-4o',
    description: 'Our most advanced, multimodal flagship model that’s cheaper and faster than GPT-4 Turbo. Currently points to gpt-4o-2024-05-13.',
    id: 'gpt-4o',
    object: 'model',
    created: 1698959748,
    owned_by: 'openai',
    context_length: 128000,
    tokenizer: 'o200k_base',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 5,
      output: 15
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
    name: 'Claude 3 Opus',
    description: 'Most powerful model for highly complex tasks',
    id: 'claude-3-opus',
    object: 'model',
    created: 1698959748,
    owned_by: 'anthropic',
    context_length: 200000,
    tokenizer: 'anthropic',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 15,
      output: 75
    }
  },
  {
    name: 'Claude 3 Sonnet',
    description: 'Ideal balance of intelligence and speed for enterprise workloads',
    id: 'claude-3-sonnet',
    object: 'model',
    created: 1698959748,
    owned_by: 'anthropic',
    context_length: 200000,
    tokenizer: 'anthropic',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 3,
      output: 15
    }
  },
  {
    name: 'Claude 3 Haiku',
    description: 'Fastest and most compact model for near-instant responsiveness',
    id: 'claude-3-haiku',
    object: 'model',
    created: 1698959748,
    owned_by: 'anthropic',
    context_length: 200000,
    tokenizer: 'anthropic',
    capabilities: {
      vision: true,
      function_calling: true
    },
    prices: {
      input: 0.25,
      output: 1.25
    }
  }
];