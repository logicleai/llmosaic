import { ConsistentResponseUsage } from '../types';
import { encoderCl100K } from './encoders';

export function countTokens(text: string): number {
  return encoderCl100K.encode(text).length;
}

export function toUsage(
  prompt: string,
  completion: string | undefined,
): ConsistentResponseUsage | undefined {
  if (!completion) {
    return undefined;
  }

  const promptTokens = countTokens(prompt);
  const completionTokens = countTokens(completion);
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
}
