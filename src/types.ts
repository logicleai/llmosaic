import { ChatCompletionCreateParams, ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';

import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions'

import { APIPromise } from 'openai/src/core';

import { Stream } from 'openai/streaming';

export type Role = 'system' | 'user' | 'assistant' | 'function';

export interface Message {
  role: Role;
  content: string | null;
}

export type FinishReason =
  | 'stop'
  | 'length'
  | 'function_call'
  | 'content_filter';

export interface ConsistentResponseChoice {
  finish_reason: FinishReason | null;
  index: number;
  message: {
    role: string | null | undefined;
    content: string | null | undefined;
    function_call?: {
      arguments: string;
      name: string;
    };
  };
}

export interface ConsistentResponseStreamingChoice
  extends Omit<ConsistentResponseChoice, 'message'> {
  delta: Omit<ConsistentResponseChoice['message'], 'function_call'> & {
    function_call?: {
      arguments?: string;
      name?: string;
    };
  };
}

export interface ConsistentResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ConsistentResponse {
  choices: ConsistentResponseChoice[];
  model?: string;
  created?: number;
  usage?: ConsistentResponseUsage;
}

export type ResultNotStreaming = APIPromise<ChatCompletion>;

export type ResultStreaming = APIPromise<Stream<ChatCompletionChunk>>;

export type Result = ResultNotStreaming | ResultStreaming;

export type HandlerParamsStreaming = ChatCompletionCreateParamsStreaming;

export type HandlerParamsNotStreaming = ChatCompletionCreateParamsNonStreaming;

export type HandlerParams = HandlerParamsStreaming | HandlerParamsNotStreaming;

export type Handler = (params: HandlerParams) => Promise<Result>;

export interface HandlerModelParamsBase {
  enrich?: boolean | null;
}

export interface HandlerModelParamsEnriched extends HandlerModelParamsBase {
  enrich?: true;
}

export interface HandlerModelParamsStandard extends HandlerModelParamsBase {
  enrich?: false;
}

export type HandlerModelParams = HandlerModelParamsEnriched | HandlerModelParamsStandard;

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface EnrichedModelCapabilities {
  vision: boolean
  functions: string
}

export interface EnrichedModel extends Model{
  name: string
  description: string
  context_length: number
  tokenizer: string
}

export interface StandardModelList {
  object: string;
  data: Model[];
}

export interface EnrichedModelList {
  object: string;
  data: EnrichedModel[];
}

export type ModelList = StandardModelList | EnrichedModelList;

export interface IProviderWrapper {
  models(
    params: HandlerModelParams & { enrich: true },
  ): Promise<EnrichedModelList>;
  models(
    params: HandlerModelParams & { enrich?: false },
  ): Promise<StandardModelList>;
  completions(
    params: HandlerParams & { stream: true },
  ): Promise<ResultStreaming>;
  completions(
    params: HandlerParams & { stream?: false },
  ): Promise<ResultNotStreaming>;
}
