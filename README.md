<h1 align="center">
    LLMosaic
</h1>
<p align="center">
    <p align="center">A TypeScript library for calling APIs of various LLMs using the OpenAI format [Azure, Anthropic, Ollama, Together AI, Groq, OpenAI]
    <br>
</p>
<h4 align="center">
    <a href="https://www.npmjs.com/package/@logicleai/llmosaic" target="_blank">
        <img src="https://img.shields.io/npm/v/%40logicleai%2Fllmosaic" alt="NPM Version">
    </a>
</h4>

## Installation

```sh
npm install @logicleai/llmosaic
```

## Usage

```ts
import { Provider, ProviderType } from '@logicleai/llmosaic';

const openai = new Provider({
  apiKey: process.env['OPENAI_API_KEY'],
  providerType: ProviderType.Anthropic,
});

async function main() {
  const chatCompletion = await openai.completion({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'claude-3-opus-20240229',
  });
}

main();
```

### Streaming responses

```ts
import { Provider, ProviderType } from '@logicleai/llmosaic';

const openai = new Provider({
  providerType: ProviderType.TogetherAI,
});

async function main() {
  const stream = await openai.completion({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    stream: true,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();
```

## Supported Providers

| **Provider** | **Completion** | **Streaming** | **Models** |
|:------------:|:--------------:|:-------------:|:----------:|
|    openai    |        ✅       |       ✅       |      ✅     |
|   anthropic  |        ✅       |       ✅       |      ✅     |
|  togetherai  |        ✅       |       ✅       |      ✅     |
|     groq     |        ✅       |       ✅       |      ✅     |
|    localai   |        ✅       |       ✅       |      ✅     |

## Contributing

### Clone the repo
```
git clone https://github.com/logicleai/llmosaic.git
```

### Install dependencies
```
npm install
```

### Build the project
```
npm run build
```