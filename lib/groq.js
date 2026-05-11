import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(systemPrompt, userPrompt, maxTokens = 1500) {
  const res = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return res.choices[0].message.content;
}

export async function chatGroq(systemPrompt, history, maxTokens = 1000) {
  const res = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: systemPrompt }, ...history],
  });
  return res.choices[0].message.content;
}
