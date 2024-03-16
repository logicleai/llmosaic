import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const message = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [
        {
          role: 'user',
          content: 'Hello, Claude'
        },
        {
          role: 'assistant',
          content: "Hello! It's nice to meet you. How can I assist you today?"
        },
        {
          role: 'user',
          content: 'Who are you?'
        }
    ],
    model: 'claude-3-opus-20240229',
  });

  console.log(message);
  console.log(message.content[0]);
}

main();