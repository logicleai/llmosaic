import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

const messages = [
    {
        role: 'user',
        content: 'Hello, Claude'
    },
    {
        type: 'assistant',
        content: "Hello! It's nice to meet you. How can I assist you today?"
    },
    {
        role: 'user',
        content: 'Who are you?'
    }
]

async function main() {
  const message = await anthropic.messages.create({
    max_tokens: 1024,
    messages: messages,
    model: 'claude-3-opus-20240229',
  });

  console.log(message.content);
}

main();