import { ModelEnrichmentDataType } from '../../types';

export const modelEnrichmentData:ModelEnrichmentDataType = {
    'claude-3-opus-20240229': {
      name: 'Claude 3 Opus',
      description: 'Most powerful model for highly complex tasks',
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
    'claude-3-sonnet-20240229': {
      name: 'Claude 3 Sonnet',
      description: 'Ideal balance of intelligence and speed for enterprise workloads',
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
    'claude-3-haiku-20240307': {
      name: 'Claude 3 Haiku',
      description: 'Fastest and most compact model for near-instant responsiveness',
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
    },
    'claude-2.1': {
      name: 'Claude 2.1',
      description: 'Updated version of Claude 2 with improved accuracy',
      context_length: 200000,
      tokenizer: 'anthropic',
      capabilities: {
        vision: false,
        function_calling: false
      },
      prices: {
        input: 8,
        output: 24
      }
    },
    'claude-2.0': {
      name: 'Claude 2',
      description: 'Predecessor to Claude 3, offering strong all-round performance',
      context_length: 100000,
      tokenizer: 'anthropic',
      capabilities: {
        vision: false,
        function_calling: false
      },
      prices: {
        input: 8,
        output: 24
      }
    },
    'claude-instant-1.2': {
      name: 'Claude Instant 1.2',
      description: 'Our cheapest small and fast model, a predecessor of Claude Haiku.',
      context_length: 100000,
      tokenizer: 'anthropic',
      capabilities: {
        vision: false,
        function_calling: false
      },
      prices: {
        input: 0.8,
        output: 2.4
      }
    },
  };