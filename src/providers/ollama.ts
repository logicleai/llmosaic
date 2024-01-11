import { IProviderWrapper } from '../types';
import {
  HandlerParams,
  ResultStreaming,
  ResultNotStreaming,
  Result,
  StreamingChunk,
  Model,
  ModelList,
} from '../types';
import { getUnixTimestamp } from '../utils/getUnixTimestamp';
import { combinePrompts } from '../utils/combinePrompts';
import { toUsage } from '../utils/toUsage';

interface OllamaResponseChunk {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

class OllamaWrapper implements IProviderWrapper {
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.baseUrl = baseUrl ?? 'http://127.0.0.1:11434';
  }

  private toStreamingChunk(
    ollamaResponse: OllamaResponseChunk,
    model: string,
    prompt: string,
  ): StreamingChunk {
    return {
      model: model,
      created: getUnixTimestamp(),
      usage: toUsage(prompt, ollamaResponse.response),
      choices: [
        {
          delta: { content: ollamaResponse.response, role: 'assistant' },
          finish_reason: 'stop',
          index: 0,
        },
      ],
    };
  }

  private toCompletionResponse(
    content: string,
    model: string,
    prompt: string,
  ): ResultNotStreaming {
    return {
      model: model,
      created: getUnixTimestamp(),
      usage: toUsage(prompt, content),
      choices: [
        {
          message: { content, role: 'assistant' },
          finish_reason: 'stop',
          index: 0,
        },
      ],
    };
  }

// Function to convert the JSON response to a ModelList object
private convertToModelList(response: any): ModelList {
  // Create an empty array for the data property
  const data: Model[] = [];

  // Check if the response has a 'models' array
  if (response && Array.isArray(response.models)) {
    // Iterate over the models array and map each entry to a Model object
    response.models.forEach((model: any) => {
      const convertedModel: Model = {
        id: model.name,
        object: 'model',
        created: Math.floor(new Date(model.modified_at).getTime() / 1000), // Convert the modified_at date string to a timestamp
        owned_by: 'ollama'
      };
      data.push(convertedModel);
    });
  }

  // Return the ModelList object with the 'object' property and the 'data' array
  return {
    object: 'list',
    data: data
  };
}

  private async *iterateGenerateResponse(
    response: Response,
    model: string,
    prompt: string,
  ): AsyncIterable<StreamingChunk> {
    const reader = response.body?.getReader();
    let done = false;

    while (!done) {
      const next = await reader?.read();
      if (next?.value) {
        const decoded = new TextDecoder().decode(next.value);
        done = next.done;
        const lines = decoded.split(/(?<!\\)\n/);
        const ollamaResponses = lines
          .map((line) => line.trim())
          .filter((line) => line !== '')
          .map((line) => JSON.parse(line) as OllamaResponseChunk)
          .map((response) => this.toStreamingChunk(response, model, prompt));

        yield* ollamaResponses;
      } else {
        done = true;
      }
    }
  }

  private async getOllamaTagsResponse(
    baseUrl: string,
  ): Promise<Response> {
    return fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
    });
  }

  private async getOllamaGenerateResponse(
    model: string,
    prompt: string,
    baseUrl: string,
  ): Promise<Response> {
    return fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    });
  }

  async models():Promise<ModelList>{
    const res = await this.getOllamaTagsResponse(this.baseUrl);
    return this.convertToModelList(await res.json());
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
    const model = params.model;
    const prompt = combinePrompts(params.messages);

    const res = await this.getOllamaGenerateResponse(model, prompt, this.baseUrl);

    if (!res.ok) {
      throw new Error(
        `Received an error with code ${res.status} from Ollama API.`,
      );
    }

    if (params.stream) {
      return this.iterateGenerateResponse(res, model, prompt);
    }

    const chunks: StreamingChunk[] = [];

    for await (const chunk of this.iterateGenerateResponse(res, model, prompt)) {
      chunks.push(chunk);
    }

    const message = chunks.reduce((acc: string, chunk: StreamingChunk) => {
      return (acc += chunk.choices[0].delta.content);
    }, '');

    return this.toCompletionResponse(message, model, prompt);
  }
}

export default OllamaWrapper;
