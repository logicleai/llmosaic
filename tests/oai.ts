import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
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
    model: 'gpt-3.5-turbo',
  });

  console.log(chatCompletion);
  console.log(chatCompletion.choices[0])
}

main();