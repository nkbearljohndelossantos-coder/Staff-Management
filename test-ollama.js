import ollama from 'ollama';

async function main() {
  const response = await ollama.chat({
    model: 'qwen2.5-coder',
    messages: [{role: 'user', content: 'Hello!'}],
  });
  console.log(response.message.content);
}

main().catch(console.error);