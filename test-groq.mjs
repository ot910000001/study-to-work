const GROQ_API_KEY = process.env.GROQ_API_KEY || "your_api_key_here";
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'user', content: "Hello" }
    ],
  }),
});
const data = await response.json();
console.log(data);
