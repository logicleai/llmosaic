import { ChatCompletionCreateParams } from 'openai/resources/chat/completions';

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

export type ResultNotStreaming = ConsistentResponse;

export interface StreamingChunk extends Omit<ConsistentResponse, 'choices'> {
  choices: ConsistentResponseStreamingChoice[];
}

export type ResultStreaming = AsyncIterable<StreamingChunk>;

export type Result = ResultNotStreaming | ResultStreaming;

export interface HandlerParamsBase {
  model: string;
  messages: Message[];
  stream?: boolean | null;
  temperature?: number | null;
  top_p?: number | null;
  stop?: string | null | string[];
  presence_penalty?: number | null;
  n?: number | null;
  max_tokens?: number | null;
  functions?: ChatCompletionCreateParams.Function[];
  function_call?:
    | 'none'
    | 'auto'
    | ChatCompletionCreateParams.FunctionCallOption;
}

export interface HandlerParamsStreaming extends HandlerParamsBase {
  stream?: true;
}

export interface HandlerParamsNotStreaming extends HandlerParamsBase {
  stream?: false;
}

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
