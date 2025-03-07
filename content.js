const API_URL = 'https://api.hyperbolic.xyz/v1/completions';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzY290dHNhdWVyc2NAZ21haWwuY29tIiwiaWF0IjoxNzM4MTk2NzYxfQ.tP4K8UBOkUYfdpkmlU_pyxnLpw02MYsRI36IDQAA-kA';

async function streamCompletion(tweetElement, prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Meta-Llama-3.1-405B-FP8',
      prompt: prompt,
      max_tokens: 100,
      temperature: 0.7,
      top_p: 0.9,
      stream: true
    }),
  });

  if (!response.ok || !response.body) {
    console.error('API response error:', response.statusText);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let partialText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    partialText += decoder.decode(value, { stream: true });
    tweetElement.textContent = prompt + partialText;
  }
}

function completeTweets() {
  document.querySelectorAll('div[data-testid="tweetText"]').forEach(tweet => {
    if (tweet.getAttribute('data-completed') === 'true') return;

    tweet.setAttribute('data-completed', 'true');
    const originalText = tweet.textContent.trim();

    streamCompletion(tweet, originalText + ' ').catch(console.error);
  });
}

const observer = new MutationObserver(completeTweets);
observer.observe(document.body, { childList: true, subtree: true });

completeTweets();
