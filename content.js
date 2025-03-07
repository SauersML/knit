const API_URL = 'https://api.hyperbolic.xyz/v1/completions';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzY290dHNhdWVyc2NAZ21haWwuY29tIiwiaWF0IjoxNzM4MTk2NzYxfQ.tP4K8UBOkUYfdpkmlU_pyxnLpw02MYsRI36IDQAA-kA';

async function streamCompletion(tweetElement, prompt, button) {
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
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    partialProcess(chunk, text => {
      continuation += text;
      tweetElement.textContent = prompt + continuation;
    });
  }
}

function partialProcess(chunk, callback) {
  const lines = chunk.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('data:')) {
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;

      try {
        const json = JSON.parse(data);
        const text = json.choices[0].text;
        callback(text);
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    }
}

function addButton(tweetElement, container) {
  if (container.querySelector('.continue-btn')) return;

  const btn = document.createElement('button');
  btn.textContent = 'Continue ✨';
  btn.className = 'continue-btn';

  Object.assign(btn.style, {
    position: 'absolute',
    bottom: '5px',
    right: '10px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    background: '#1DA1F2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    zIndex: '1000'
  });

  btn.onclick = () => {
    btn.textContent = 'Continuing...';
    const prompt = tweetElement.textContent.trim() + ' ';
    streamCompletion(tweetElement, prompt).then(() => {
      btn.remove();
    }).catch(e => {
      btn.textContent = 'Error';
      console.error(e);
    });
  };

  container.style.position = 'relative';
  container.appendChild(btn);
}

function setupTweetButtons() {
  document.querySelectorAll('article').forEach(article => {
    const tweet = article.querySelector('div[data-testid="tweetText"]');
    if (!tweet) return;

    addButton(tweet, article);
  });
}

const decoder = new TextDecoder('utf-8');
let continuation = '';

const observer = new MutationObserver(setupTweetButtons);
observer.observe(document.body, { childList: true, subtree: true });

setupTweetButtons();
