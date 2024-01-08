import OpenAI from 'openai';
import { IProviderWrapper } from '../types';
import {
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
} from '../types';

class OpenAIWrapper implements IProviderWrapper {
  private openai: OpenAI;

  constructor(apiKey?: string, baseUrl?: string) {
    const finalApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    const finalBaseUrl = baseUrl ?? 'https://api.openai.com/v1';

    this.openai = new OpenAI({
      apiKey: finalApiKey,
      baseURL: finalBaseUrl,
    });
  }

  private async *toStreamingResponse(
    response: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>,
  ): ResultStreaming {
    for await (const chunk of response) {
      yield {
        model: chunk.model,
        created: chunk.created,
        choices: chunk.choices.map((openAIChoice) => {
          return {
            delta: {
              content: openAIChoice.delta.content,
              role: openAIChoice.delta.role,
              function_call: openAIChoice.delta.function_call,
            },
            index: openAIChoice.index,
            finish_reason: openAIChoice.finish_reason,
          };
        }),
      };
    }
  }

  public async completions(
    params: HandlerParams & { stream: true },
  ): Promise<ResultStreaming>;
  public async completions(
    params: HandlerParams & { stream?: false },
  ): Promise<ResultNotStreaming>;
  public async completions(
    params: HandlerParams & { stream?: boolean },
  ): Promise<Result> {
    if (params.stream) {
      // Process streaming responses
      const response = await this.openai.chat.completions.create({
        ...params,
        stream: params.stream,
      });
      return this.toStreamingResponse(response);
    } else {
      // Process non-streaming responses
      const response = await this.openai.chat.completions.create({
        ...params,
        stream: false,
      });
      return response;
    }
  }
}

export default OpenAIWrapper;
