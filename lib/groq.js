import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

// Cache rate limit status for 5 minutes to avoid wasting time on subsequent requests
let isPrimaryRateLimited = false;
let rateLimitResetTime = 0;

export async function callGroq(systemPrompt, userPrompt, maxTokens = 1500) {
  const useFallbackDirectly = isPrimaryRateLimited && Date.now() < rateLimitResetTime;
  
  if (useFallbackDirectly) {
    console.log("Groq primary model is cached as rate-limited. Calling fallback directly...");
    const fallbackMaxTokens = Math.min(maxTokens, 1500);
    const res = await groq.chat.completions.create({
      model: FALLBACK_MODEL,
      max_tokens: fallbackMaxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return res.choices[0].message.content;
  }

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return res.choices[0].message.content;
  } catch (err) {
    const isRateLimit = err.status === 429 || (err.message && (err.message.includes('rate_limit') || err.message.includes('Rate limit') || err.message.includes('limit reached')));
    if (isRateLimit) {
      console.warn("Groq primary model rate limited. Caching status and falling back to llama-3.1-8b-instant...", err.message);
      isPrimaryRateLimited = true;
      rateLimitResetTime = Date.now() + 300000; // Cache for 5 minutes
      
      const fallbackMaxTokens = Math.min(maxTokens, 1500);
      const res = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        max_tokens: fallbackMaxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      return res.choices[0].message.content;
    }
    throw err;
  }
}

export async function chatGroq(systemPrompt, history, maxTokens = 1000) {
  const useFallbackDirectly = isPrimaryRateLimited && Date.now() < rateLimitResetTime;
  
  if (useFallbackDirectly) {
    console.log("Groq primary model is cached as rate-limited. Calling fallback directly...");
    const fallbackMaxTokens = Math.min(maxTokens, 1500);
    const res = await groq.chat.completions.create({
      model: FALLBACK_MODEL,
      max_tokens: fallbackMaxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    });
    return res.choices[0].message.content;
  }

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    });
    return res.choices[0].message.content;
  } catch (err) {
    const isRateLimit = err.status === 429 || (err.message && (err.message.includes('rate_limit') || err.message.includes('Rate limit') || err.message.includes('limit reached')));
    if (isRateLimit) {
      console.warn("Groq primary model rate limited. Caching status and falling back to llama-3.1-8b-instant...", err.message);
      isPrimaryRateLimited = true;
      rateLimitResetTime = Date.now() + 300000; // Cache for 5 minutes
      
      const fallbackMaxTokens = Math.min(maxTokens, 1500);
      const res = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        max_tokens: fallbackMaxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
      });
      return res.choices[0].message.content;
    }
    throw err;
  }
}
