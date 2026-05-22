const https = require('https');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve(`${url} -> OK (${res.statusCode})`);
      } else {
        resolve(`${url} -> FAIL (${res.statusCode})`);
      }
    }).on('error', (e) => {
      resolve(`${url} -> ERROR (${e.message})`);
    }).on('timeout', () => {
      resolve(`${url} -> TIMEOUT`);
    });
  });
}

async function test() {
  const prompt = encodeURIComponent("A red cat");
  const urls = [
    `https://image.pollinations.ai/prompt/${prompt}`,
    `https://pollinations.ai/p/${prompt}`,
    `https://api.kastg.xyz/api/ai/text2image?prompt=${prompt}`
  ];
  
  for (const url of urls) {
    const res = await checkUrl(url);
    console.log(res);
  }
}

test();
