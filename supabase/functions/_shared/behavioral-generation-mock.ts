const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname === 'ai.gateway.lovable.dev') {
    return Promise.resolve(Response.json({
      choices: [{ message: { tool_calls: [{ function: { arguments: JSON.stringify({
        summary: 'Análise confirmada', tone: 'direto', communication_style: 'direto',
        sentiment_trend: 'neutral', preferences: [], hobbies: [], recurrent_topics: [],
      }) } }] } }],
    }));
  }
  return originalFetch(input, init);
};
await import('../generate-behavioral-profile/index.ts');
