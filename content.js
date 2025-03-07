const API_URL = 'https://api.hyperbolic.xyz/v1/completions';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzY290dHNhdWVyc2NAZ21haWwuY29tIiwiaWF0IjoxNzM4MTk2NzYxfQ.tP4K8UBOkUYfdpkmlU_pyxnLpw02MYsRI36IDQAA-kA';

async function streamCompletion(tweetElement, prompt, button) {
  button.disabled = true;
  button.textContent = 'Generating...';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
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
    button.textContent = 'Error';
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let continuation = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    continuation += decoder.decode(value, { stream: true });
    tweetElement.textContent = prompt + continuation;
  }

  button.textContent = 'Done ✅';
}

function addContinueButton(tweetContainer, tweetTextElement) {
  if (tweetContainer.querySelector('.continue-tweet-btn')) return;

  const button = document.createElement('button');
  button.textContent = 'Continue ✨';
  button.className = 'continue-tweet-btn';
  
  Object.assign(button.style, {
    position: 'absolute',
    bottom: '5px',
    right: '10px',
    padding: '2px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#1DA1F2',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    zIndex: '1000'
  });

  button.onclick = () => {
    const originalText = tweetTextElement.textContent.trim();
    streamCompletion(tweetTextElement, originalText + ' ', button).catch(console.error);
  };

  tweetContainer.style.position = 'relative';
  tweetContainer.appendChild(button);
}

function initTweetButtons() {
  document.querySelectorAll('article').forEach(article => {
    const tweetTextElement = article.querySelector('div[data-testid="tweetText"]');
    if (tweetTextElement) {
      addContinueButton(article, tweetTextElement);
    }
  });
}

const observer = new MutationObserver(initTweetButtons);
observer.observe(document.body, { childList: true, subtree: true });

initTweetButtons();
