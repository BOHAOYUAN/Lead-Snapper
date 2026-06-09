const fs = require('fs');
fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-7d97a68e6967406db9ecf35fa986313a' },
  body: JSON.stringify({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: 'You are an elite B2B growth hacker. Output ONLY JSON.' }, { role: 'user', content: 'Output {"Confidence_Score":0, "Pain_Point_Analysis": "none"}' }]
  })
}).then(r => r.text()).then(t => fs.writeFileSync('test.json', t)).catch(console.error);
