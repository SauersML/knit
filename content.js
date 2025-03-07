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
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let lines = buffer.split('\n');
    buffer = lines.pop();  // Keep the last incomplete line for next iteration

    for (const line of linesFromChunk(lines)) {
      if (line === '[DONE]') {
        button.textContent = 'Done ✅';
        return;
      }
      try {
        const json = JSON.parse(line);
        const textChunk = json.choices[0].text;
        fullText += textChunk;
        tweetElement.textContent = prompt + fullText;
      } catch (e) {
        console.error('JSON parse error:', e, line);
      }
    }
  }
}

function* linesFromChunk(lines) {
  for (const line of lines) {
    if (line.startsWith('data:')) {
      yield line.replace(/^data:\s*/, '');
    }
  }
}

function addButton(tweetElement, container) {
  if (container.querySelector('.continue-btn')) return;

  const button = document.createElement('button');
  button.textContent = 'Continue ✨';
  button.className = 'continue-btn';
  
  Object.assign(button.style, {
    position: 'absolute',
    bottom: '5px',
    right: '10px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#1DA1F2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    zIndex: '1000'
  });

  button.onclick = () => {
    const prompt = tweetElement.textContent.trim() + ' ';
    streamCompletion(tweetElement, prompt, button).catch(e => {
      button.textContent = 'Error';
      console.error(e);
    });
  };

  container.style.position = 'relative';
  container.appendChild(button);
}

function setupTweetButtons() {
  document.querySelectorAll('article').forEach(article => {
    const tweetElement = article.querySelector('div[data-testid="tweetText"]');
    if (tweetElement) {
      addButton(tweetElement, article);
    }
  });
}

const observer = new MutationObserver(setupTweetButtons);
observer.observe(document.body, { childList: true, subtree: true });

setupTweetButtons();
