import { Provider, ProviderType } from 'llmosaic';

class OpenAITest {
    private client: Provider;

    constructor(apiKey: string) {
        this.client = new Provider({ apiKey: apiKey, providerType: ProviderType.OpenAI });
    }

    async oaiCompletion() {
        const res = await this.client.completion({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-3.5-turbo',
            stream: false,
        });
        console.log(res.choices[0].message.content);
    }

    async oaiCompletionStreaming() {
        const res = await this.client.completion({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-3.5-turbo',
            stream: true,
        });
        for await (const part of res) {
            process.stdout.write(part.choices[0]?.delta?.content || "");
        }
    }

    async oaiModelsStandard() {
        const res = await this.client.models({ enrich: false });
        console.log(res);
    }

    async oaiModelsEnriched() {
        const res = await this.client.models({ enrich: true });
        console.log(res);
    }

    async testOpenAI() {
        console.log("---Testing OpenAI Provider");
        await this.oaiModelsStandard();
        await this.oaiModelsEnriched();
        await this.oaiCompletion();
        await this.oaiCompletionStreaming();
        console.log("\n---END---");
    }
}

class AzureTest {
    private client: Provider;

    constructor(apiKey: string) {
        this.client = new Provider({ apiKey: apiKey, providerType: ProviderType.Azure });
    }

    async oaiCompletion() {
        const res = await this.client.completion({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-4',
            stream: false,
        });
        console.log(res.choices[0].message.content);
    }

    async oaiCompletionStreaming() {
        const res = await this.client.completion({
            messages: [{ role: 'user', content: 'Say this is a test' }],
            model: 'gpt-4',
            stream: true,
        });
        for await (const part of res) {
            process.stdout.write(part.choices[0]?.delta?.content || "");
        }
    }

    async oaiModelsStandard() {
        const res = await this.client.models({ enrich: false });
        console.log(res);
    }

    async oaiModelsEnriched() {
        const res = await this.client.models({ enrich: true });
        console.log(res);
    }

    async testAzure() {
        console.log("---Testing Azure Provider");
        await this.oaiModelsStandard();
        await this.oaiModelsEnriched();
        await this.oaiCompletion();
        await this.oaiCompletionStreaming();
        console.log("\n---END---");
    }
}

async function testAll(){
    const apiKeyOAI = "";
    const openAIProvider = new OpenAITest(apiKeyOAI);
    await openAIProvider.testOpenAI();
    
    const apiKeyAzure = "";
    const azureProvider = new AzureTest(apiKeyAzure);
    await azureProvider.testAzure();
}

testAll()