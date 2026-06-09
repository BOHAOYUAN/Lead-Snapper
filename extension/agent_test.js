const { chromium } = require('playwright');
const fs = require('fs');

// --- 配置区 ---
// 这里我们使用 test.js 里遗留的 DeepSeek 的配置格式，你如果用 Gemini 1.5 也可以平替 (配置相应 baseUrl 和 Key 即可)
const API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = 'sk-7d97a68e6967406db9ecf35fa986313a'; // 替换你的真实 Key

async function main() {
  console.log('🚀 [HY-Agent] 启动冷测试...');
  
  // 1. 启动浏览器 (关闭 headless 以便手动登录或观察)
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 导航到领英搜索结果页 (此时你可以手动登录)
  console.log('🌐 [HY-Agent] 正在打开网页... 如果遇到登录，请在 30 秒内手动登录...');
  await page.goto('https://www.linkedin.com/search/results/people/?keywords=ceo', { waitUntil: 'domcontentloaded' });
  
  // 留出时间让人工操作或等待页面加载完毕
  await page.waitForTimeout(10000); 

  console.log('👁️ [HY-Agent] 开始注入 ID-Mapper...');
  await injectAgentIds(page);

  console.log('🗜️ [HY-Agent] 开始执行 DOM 蒸馏...');
  const distilledDOM = await distillDOM(page);
  
  // 存个档，方便我们肉眼查看
  fs.writeFileSync('distilled_dom.json', JSON.stringify(JSON.parse(distilledDOM), null, 2));
  console.log(`✅ [HY-Agent] 蒸馏完成！获取到 ${JSON.parse(distilledDOM).length} 个关键元素，已保存至 distilled_dom.json`);
  
  console.log('🧠 [HY-Agent] 开始连接大脑 (请求大模型)...');
  // 你可以修改意图，测试操作或者提问
  const intent = '点击页面上第一个能发送消息的按钮（Message 或 Connect），或者提取一下页面里能看到的职位头衔信息';
  const actionPlan = await getNextAction(intent, distilledDOM);
  
  console.log('🎯 [HY-Agent] 大脑决策返回:', actionPlan);

  if (actionPlan) {
    if (actionPlan.reason) {
      console.log(`💡 [HY-Agent] AI 思考/理由: ${actionPlan.reason}`);
    }
    
    if (actionPlan.answer) {
      console.log(`💬 [HY-Agent] AI 给出答案: ${actionPlan.answer}`);
    }

    if (actionPlan.id && actionPlan.action !== 'none') {
      console.log(`⚡ [HY-Agent] 准备执行动作: ${actionPlan.action} -> 元素 ID: ${actionPlan.id}`);
      
      // 定位元素
      const targetElement = page.locator(`[data-hy-id="${actionPlan.id}"]`);
      
      // 检查元素是否存在，避免报错
      const elementCount = await targetElement.count();
      if (elementCount > 0) {
        // 高亮一下目标，验证是不是找对了
        await targetElement.evaluate(node => {
          node.style.outline = '4px solid red';
          node.style.backgroundColor = 'rgba(255,0,0,0.3)';
          node.style.boxShadow = '0 0 15px red';
          node.style.transition = 'all 0.3s ease-in-out';
        });
        console.log(`✨ [HY-Agent] 已经用红色高亮标记了目标元素！请看浏览器窗口！`);
        
        // 出于安全考虑，Demo 阶段就不真点了，看高亮就好
        // if (actionPlan.action === 'click') {
        //   await targetElement.click();
        // }
      } else {
        console.log(`❌ [HY-Agent] 当前页面找不到 ID 为 ${actionPlan.id} 的元素，可能已动态变化。`);
      }
    } else {
      console.log(`⏸️ [HY-Agent] 本次意图仅为查询或无需具体交互。`);
    }
  }

  // 保持开启以便观察
  console.log('☕ [HY-Agent] 运行完毕，浏览器将保持开启状态...');
}

// ================== 核心模块实现 ==================

// 1. ID-Mapper
async function injectAgentIds(page) {
  await page.evaluate(() => {
    let idCounter = 0;
    // 关键：覆盖大部分交互元素
    // 注意：把 aria-label, role 等带进去，这在领英上特别有用
    const interactableSelectors = 'a, button, input, select, textarea, [role="button"], [contenteditable="true"], .artdeco-button';
    const elements = document.querySelectorAll(interactableSelectors);
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // 在视口内，且高度宽度大于0，可见
      if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden') {
        el.setAttribute('data-hy-id', ++idCounter);
        // 可以注入一个极其微小的角标方便人眼核对 (可选)
        // el.style.position = 'relative';
        // const span = document.createElement('span');
        // span.style.cssText = 'position:absolute; top:0; left:0; font-size:10px; background:yellow; color:black; z-index:99999;';
        // span.textContent = idCounter;
        // el.appendChild(span);
      }
    });
  });
}

// 2. The Purifier
async function distillDOM(page) {
  return await page.evaluate(() => {
    const distilledElements = [];
    const elements = document.querySelectorAll('[data-hy-id]');
    
    elements.forEach(el => {
      let textContent = el.innerText?.trim();
      const ariaLabel = el.getAttribute('aria-label');
      
      // 去除多余的换行符和空格，减小 token 占用
      if (textContent) {
        textContent = textContent.replace(/\s+/g, ' ');
      }
      
      // 如果一个按钮没字也没 label，模型基本上也没法判断，我们可以丢弃或者保留给视觉
      if(textContent || ariaLabel || el.tagName.toLowerCase() === 'input') {
          distilledElements.push({
            id: el.getAttribute('data-hy-id'),
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute('type') || null,
            text: textContent ? textContent.substring(0, 150) : null,
            ariaLabel: ariaLabel ? ariaLabel.substring(0, 100) : null,
            title: el.getAttribute('title') ? el.getAttribute('title').substring(0, 50) : null
          });
      }
    });
    
    return JSON.stringify(distilledElements);
  });
}

// 3. Brain Connector
async function getNextAction(intent, distilledData) {
  // 因为蒸馏后的 DOM 可能依然有上百项，为了防止 token 溢出或幻觉，先格式化一下
  const prompt = `
你是一个顶尖的网页分析和 RPA 操作专家。
用户的任务/意图是: "${intent}"

以下是当前网页中提取出的可交互元素的精简列表（格式为 JSON 数组）：
${distilledData}

请分析列表，找到最符合意图的元素，或者解答用户的疑问。
你必须且只能返回合法的 JSON 格式。包含如下字段：
- id: 目标元素的 ID (字符串格式，如果只是回答问题不需要操作元素，则填空字符串 "")
- action: 操作类型 ("click" | "type" | "none"，如果不需操作填 "none")
- value: 附加值 (如需要打字的内容，没有则为空)
- reason: 你的分析过程和操作理由
- answer: 如果用户的意图包含询问信息，请在这里直接给出你观察到的答案。如果没有则为空字符串 ""

返回 JSON 示例 1 (需要操作)：
{"id": "12", "action": "click", "value": "", "reason": "这是名为 Message 的按钮", "answer": ""}

返回 JSON 示例 2 (回答问题)：
{"id": "", "action": "none", "value": "", "reason": "从页面文本提取了信息", "answer": "页面中看到的职位头衔有 CEO、CTO 等"}
`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 如果使用 Gemini 换成模型名
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an intelligent browser automation agent. Always respond with strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content;
    console.log("-> [API] 原始返回消息:", content);
    
    // 鲁棒性处理：去除可能存在的 Markdown 格式
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 连接大脑或解析 JSON 失败:', error);
    return null;
  }
}

main();
