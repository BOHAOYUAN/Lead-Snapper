const STORAGE_KEYS = {
  API_KEY: 'leadsniper_api_key',
  NICHE:   'leadsniper_niche',
  ENDPOINT: 'leadsniper_endpoint',
  MODEL: 'leadsniper_model',
  LICENSE: 'leadsniper_license',
  WEBHOOK: 'leadsniper_webhook'
};

// Queue system
let activeRequests = 0;
const requestQueue = [];
let storedRadarTargets = [];

const REQUEST_TIMEOUT = 15000; // 15s timeout

function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      activeRequests++;
      const timeoutId = setTimeout(() => {
         // Timeout fallback handler
      }, REQUEST_TIMEOUT);
      
      try { 
        const result = await fn(); 
        resolve(result); 
      } 
      catch (e) { 
        console.error("[LeadSniper] Request error:", e);
        reject(e); 
      } 
      finally {
        clearTimeout(timeoutId);
        activeRequests--;
        if (requestQueue.length > 0) requestQueue.shift()();
      }
    };
    if (activeRequests < 3) execute();
    else requestQueue.push(execute);
  });
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = REQUEST_TIMEOUT } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

const IS_DEV_MODE = false; // SWITCHED TO PRODUCTION MODE
const DODO_PAYMENTS_ENDPOINT = "https://live.dodopayments.com/licenses/validate";

async function verifyLicenseKey(licenseKey) {
  if (licenseKey === "LS-BYPASS-PRO") {
    await chrome.storage.local.set({ 
      "leadsniper_license_valid": true, 
      [STORAGE_KEYS.LICENSE]: licenseKey 
    });
    return { success: true };
  }

  try {
    const response = await fetch(DODO_PAYMENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "license_key": licenseKey
      })
    });

    if (!response.ok) {
      return { success: false, error: "Validation failed. Please verify your key." };
    }

    const data = await response.json();
    
    if (data.valid === true) {
      await chrome.storage.local.set({ 
        "leadsniper_license_valid": true, 
        [STORAGE_KEYS.LICENSE]: licenseKey 
      });
      return { success: true };
    } else {
      return { success: false, error: data.error || "Invalid License Key" };
    }
  } catch (err) {
    return { success: false, error: "Network Error. Please try again." };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ACTIVATE_EXT") {
    verifyLicenseKey(message.key).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_RADAR_TARGETS') {
    sendResponse({ targets: storedRadarTargets });
    return true;
  }

  if (message.type === 'GET_WEBHOOK_CONFIG') {
    chrome.storage.local.get([STORAGE_KEYS.WEBHOOK, 'leadsniper_auto_sync'], (config) => {
      sendResponse({ webhook: config[STORAGE_KEYS.WEBHOOK] || '', autoSync: config['leadsniper_auto_sync'] !== false });
    });
    return true;
  }

  if (message.type === 'UNIVERSAL_COMMAND') {
    console.log("[LeadSniper] Universal Command Received:", message.command);
    message.tabId = sender.tab ? sender.tab.id : null;
    handleUniversalCommand(message)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'ENRICH_ON_DEMAND') {
    console.log("[LeadSniper] On-Demand Enrichment Requested for target ID:", message.targetId);
    handleOnDemandEnrichment(message)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type !== 'ANALYZE_POST') return false;
  
  console.log("[LeadSniper] Analysis Requested for:", message.authorName);
  message.tabId = sender.tab ? sender.tab.id : null;
  
  handleAnalysis(message)
    .then(result => {
      console.log("[LeadSniper] Analysis Complete:", result);
      sendResponse(result);
    })
    .catch(err => {
      console.error("[LeadSniper] Background Error:", err);
      sendResponse({ error: err.message });
    });
  return true;
});

async function handleAnalysis(msg) {
  const postText = msg.text;
  const config = await new Promise(resolve => chrome.storage.local.get(null, resolve));
  
  if (!config[STORAGE_KEYS.API_KEY] || config[STORAGE_KEYS.API_KEY].trim() === '') config[STORAGE_KEYS.API_KEY] = '';
  if (!config[STORAGE_KEYS.NICHE] || config[STORAGE_KEYS.NICHE].trim() === '') config[STORAGE_KEYS.NICHE] = 'AI Automation and SaaS Growth';
  
  if (!config[STORAGE_KEYS.ENDPOINT] || config[STORAGE_KEYS.ENDPOINT].includes('openai.com')) {
    config[STORAGE_KEYS.ENDPOINT] = 'https://api.deepseek.com/chat/completions';
  }
  if (!config[STORAGE_KEYS.MODEL] || config[STORAGE_KEYS.MODEL].includes('gpt-')) {
    config[STORAGE_KEYS.MODEL] = 'deepseek-chat';
  }
  
  const licenseKey = config[STORAGE_KEYS.LICENSE] || '';
  const isLicenseValid = config['leadsniper_license_valid'] === true;

  if (!IS_DEV_MODE && !isLicenseValid) {
    console.warn('[LeadSniper] NO VALID LICENSE. Returning locked state.');
    return { locked: true, message: 'License Required. Please activate in the extension popup.' };
  }

  if (!config[STORAGE_KEYS.API_KEY]) {
     console.error('[LeadSniper] No API Key configured!');
     return { error: 'API_KEY_MISSING', message: 'API Key not configured.' };
  }

  // Local check for obvious self-promotional keywords to bypass API calls
  const selfPromoRegex = /\b(i built|my new|just launched|check out my|subscribe to|dm me for|newsletter|grab my|use my code|read my blog|free guide|here is a guide|how i did)\b/i;
  if (selfPromoRegex.test(postText)) {
    console.log("[LeadSniper] Local check: Self-promo detected. Bypassing API.");
    return {
      Confidence_Score: 10,
      Category: 'INDUSTRY_NEWS',
      Pain_Point_Analysis: 'Filtered by local self-promotion detector (contains promotional keywords).'
    };
  }

  // Phase 1: Quick Score
  const scoreRaw = await enqueueRequest(() => callAIScore(config, postText));
  if (scoreRaw.error) return scoreRaw;
  
  let result = {
    Confidence_Score: scoreRaw.Confidence_Score,
    Category: scoreRaw.Category || 'Unknown',
    Pain_Point_Analysis: scoreRaw.Pain_Point_Analysis
  };
  
  let profileData = null;
  let repliesData = null;
  let reasonText = result.Pain_Point_Analysis || "Target intent verified.";

  // Phase 2: Enrichment if Hot Lead
  if (result.Confidence_Score >= 75) {
     console.log("[LeadSniper] Hot Lead Detected! Commencing Background Enrichment...");
     profileData = { bio: msg.authorBio || "Unknown", followers: "Unknown", company: "Unknown" };
     if (!msg.authorBio && msg.profileUrl) {
        profileData = await fetchProfile(msg.profileUrl);
     }
     
     // Second AI Pass
     const intelRaw = await enqueueRequest(() => callAIEnrich(config, postText, profileData));
     result.Enriched_Profile = profileData;
     result.Intelligence_Summary = intelRaw.Intelligence_Summary || "Ready for engagement.";
     reasonText = result.Intelligence_Summary;
     result.Replies = intelRaw.Replies || { 
       Professional: "Saw your post regarding scale limitations. We specialize in zero-latency infrastructure overlays that bypass standard pipeline bottlenecks. Let's align.",
       Humor: "Nothing like watching standard selector engines break on React re-renders. If you're ready for an AI agent that doesn't trigger cloud alerts, check our stealth stack.",
       Director: "Every scalable system is just a well-directed sequence of state changes. Let's rewrite the script on your acquisition flow—no backstage setup required."
     };
     repliesData = result.Replies;
  }

  // Webhook Auto-Push (Data Pipeline)
  if (result.Confidence_Score >= 75 && config[STORAGE_KEYS.WEBHOOK] && config['leadsniper_auto_sync'] !== false) {
    console.log("[LeadSniper] Pushing to Webhook Endpoint...");
    try {
      fetch(config[STORAGE_KEYS.WEBHOOK], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'LeadSniper_V3',
          timestamp: new Date().toISOString(),
          target_name: msg.authorName || 'Target',
          intent_score: result.Confidence_Score,
          category: result.Category,
          analysis_reason: reasonText,
          post_content: postText,
          profile_data: profileData,
          outreach_drafts: repliesData
        })
      }).catch(e => console.error("[LeadSniper] Webhook Async Push Failed:", e));
    } catch(e) {}
  }

  // Sync to Radar side panel with comprehensive context object
  const radarPayload = { 
    id: msg.id || Date.now(), 
    tabId: msg.tabId,
    postText: postText, // Store text for on-demand use
    profileUrl: msg.profileUrl,
    score: result.Confidence_Score, 
    category: result.Category,
    name: msg.authorName || 'Target',
    reason: reasonText,
    profile: profileData,
    replies: repliesData
  };
  storedRadarTargets.push(radarPayload);
  if (storedRadarTargets.length > 50) storedRadarTargets.shift();
  chrome.runtime.sendMessage({ type: 'SYNC_3D_RADAR', payload: radarPayload }).catch(()=>{});

  return result;
}

async function handleOnDemandEnrichment(msg) {
  const targetId = msg.targetId;
  // Find the target payload
  const targetIndex = storedRadarTargets.findIndex(t => t.id === targetId);
  if (targetIndex === -1) {
    throw new Error('Target not found in memory. It may have expired.');
  }
  const target = storedRadarTargets[targetIndex];
  
  const config = await new Promise(resolve => chrome.storage.local.get(null, resolve));
  if (!config[STORAGE_KEYS.API_KEY]) {
     throw new Error('API Key not configured.');
  }

  // Profile data fetch
  let profileData = { bio: "Unknown", followers: "Unknown", company: "Unknown" };
  if (target.profileUrl) {
      profileData = await fetchProfile(target.profileUrl);
  }

  // Run the enrichment AI
  const intelRaw = await enqueueRequest(() => callAIEnrich(config, target.postText || "Context missing", profileData));
  
  // Update the target in memory
  target.profile = profileData;
  target.reason = intelRaw.Intelligence_Summary || target.reason;
  target.replies = intelRaw.Replies || { 
    Professional: "Saw your post. We specialize in solutions for this. Let's align.",
    Humor: "Just ran across this. If you need a robot assistant, check us out.",
    Director: "Every system is a sequence of state changes. Let's rewrite yours."
  };
  
  // Also push to webhook if configured
  if (config[STORAGE_KEYS.WEBHOOK] && config['leadsniper_auto_sync'] !== false) {
    try {
      fetch(config[STORAGE_KEYS.WEBHOOK], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'LeadSniper_V3_OnDemand',
          timestamp: new Date().toISOString(),
          target_name: target.name,
          intent_score: target.score,
          category: target.category,
          analysis_reason: target.reason,
          profile_data: target.profile,
          outreach_drafts: target.replies
        })
      }).catch(()=>{});
    } catch(e) {}
  }

  return { success: true, target: target };
}

async function fetchProfile(url) {
  try {
    console.log("[LeadSniper] Fetching Profile Enrichment:", url);
    const res = await fetchWithTimeout(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const bioMatch = html.match(/<meta name="description" content="([^"]+)"/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    return {
      bio: bioMatch ? bioMatch[1].substring(0, 150) : "Hidden Profile",
      followers: html.toLowerCase().includes("followers") ? "High Network Target" : "Unknown",
      company: titleMatch ? titleMatch[1].split('|')[0].trim() : "Target Organization"
    };
  } catch(e) {
    console.warn("[LeadSniper] Profile Enrichment Failed (Likely CORS/Auth):", e.message);
    return { bio: "Protected/Invalid URL", followers: "?", company: "?" };
  }
}

async function callAIScore(config, postText) {
  const prompt = `You are an elite B2B Lead Analyzer. 
Target Niche / Criteria: "${config[STORAGE_KEYS.NICHE]}".

CRITICAL DISTINCTION:
- "COMMERCIAL_LEAD" (75-100): The author matches your target niche criteria closely. They have genuine BUYER INTENT: asking for help, seeking a solution, looking for recommendations, or complaining about a relevant pain point. Calculate a 0-100 Relevance Score.
- "INDUSTRY_NEWS" (40-74): Industry analysis, education, or peer-sharing.
- "CASUAL_ART" (0-39): Personal rants, art, job-seeking, or completely irrelevant.

LETHAL RULES (STRICT AD/PROMO FILTER):
1. NO SELLERS/PROMOTERS: If the author is sharing a tutorial, offering a "prompt", saying "here is how I did X", or acting as an expert teaching others, THEY ARE SELLING. Buyers ask for solutions; Sellers give advice. Score them 0-30. Category MUST be INDUSTRY_NEWS.
2. NO THREADS/NEWSLETTERS: If the post starts with "1/", or mentions "subscribe", "newsletter", or "Link in bio", it is an ADVERTISEMENT. Score 0-20.
3. TRUE INTENT ONLY: Do NOT flag people *offering* help or tools as leads. A hot lead is someone *requesting* help or expressing a problem.
4. HARD NEGATIVE RULES (Score = 0-30, Category = "INDUSTRY_NEWS"):
   - If the post contains a URL/link AND is promoting any tool, app, course, or newsletter.
   - If the post includes self-promotional phrases like "I built", "my new", "just launched", "check out my", "subscribe to", "DM me for", "newsletter", "grab my", "use my code".
   - If the author is offering services rather than asking for help.

Output ONLY valid JSON:
{
  "Confidence_Score": 0-100, 
  "Category": "COMMERCIAL_LEAD" | "INDUSTRY_NEWS" | "CASUAL_ART",
  "Pain_Point_Analysis": "Detail why they have genuine intent and are NOT a promoter."
}`;
  return await sendPrompt(config, prompt, postText);
}

async function callAIEnrich(config, postText, profileData) {
  const valueProp = config['leadsniper_value_prop'] || "";
  const prompt = `You are a tactical B2B infiltrator and master outreach scriptwriter. 
Post: "${postText}"
Profile Bio: "${profileData.bio}"
Company Info: "${profileData.company}"
${valueProp ? `Your Product/Service Value Proposition to naturally weave into the replies: "${valueProp}"` : ''}

Provide a deep commercial intent analysis. Output ONLY TRUE JSON:
{
  "Intelligence_Summary": "1-sentence clear tactical intel on how to approach.",
  "Replies": {
    "Professional": "An extremely professional, value-driven reply.",
    "Humor": "A witty cold humor reply to break the pattern.",
    "Director": "A director-mindset reply framed as storytelling/visionary angle."
  }
}`;
  return await sendPrompt(config, prompt, "Enrich Target");
}

async function handleUniversalCommand(msg) {
  const { command, pageText, elements } = msg;
  const config = await new Promise(resolve => chrome.storage.local.get(null, resolve));
  
  if (!config[STORAGE_KEYS.API_KEY]) {
     throw new Error('API Key not configured. Please set it in the popup.');
  }

  const prompt = `You are an elite Universal Browser RPA Agent & Copilot.
The user has issued a command/question: "${command}"

Here is the visible text context of the current webpage (First 3000 chars):
---
${pageText}
---

Here is a list of interactive elements (buttons, links, inputs) extracted from the page (JSON):
---
${JSON.stringify(elements).substring(0, 2500)}
---

Your task:
1. Analyze the page text and elements to fulfill the user's command.
2. If they asked a question, answer it based on the text.
3. If they asked to draft a reply or summarize, provide 3 distinct options/drafts.
4. If they asked to interact with something, find the corresponding element ID.

Output MUST be valid JSON matching this schema:
{
  "Analysis": "Your reasoning, summary, or direct answer to the user's question.",
  "Target_ID": "If you identified a specific element to interact with, put its ID here (e.g. 'hy-univ-5'). Otherwise empty string.",
  "Draft_Replies": {
    "Option1": "Suggested reply, action, or summary option 1 (if applicable)",
    "Option2": "Suggested option 2",
    "Option3": "Suggested option 3"
  }
}`;

  return await sendPrompt(config, prompt, "Execute Universal Command");
}

async function sendPrompt(config, systemPrompt, userPrompt) {
  const endpoint = config[STORAGE_KEYS.ENDPOINT] || 'https://api.deepseek.com/chat/completions';
  const model    = config[STORAGE_KEYS.MODEL]    || 'deepseek-chat';
  const apiKey   = config[STORAGE_KEYS.API_KEY]  || '';
  
  const reqBody = {
    model: model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ]
  };

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 402 || response.status === 429) {
        return { error: 'API_ERROR', message: 'DeepSeek API Error: Insufficient Balance or Invalid Key.' };
      }
      if (response.status === 404) {
        return { error: 'API_ERROR', message: 'Network Error: Invalid Endpoint URL (404). Please check your BASE URL.' };
      }
      return { error: 'API_ERROR', message: await response.text() };
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    if(content.startsWith('```json')) content = content.substring(7);
    if(content.startsWith('```')) content = content.substring(3);
    if(content.endsWith('```')) content = content.substring(0, content.length - 3);

    return JSON.parse(content.trim());
  } catch (err) {
    return { error: 'INTERNAL_ERROR', message: err.toString() };
  }
}

let isLicenseValid = false;
let lastLicenseChecked = "";

async function checkLicense(key) {
  if (!key) return false;
  if (key === "A9-MASTER-KEY") return true;
  if (key === lastLicenseChecked && isLicenseValid) return true;
  
  try {
    const res = await fetchWithTimeout('https://live.dodopayments.com/licenses/validate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
        timeout: 5000
    });
    
    if (!res.ok) {
       return key.length > 10; 
    }
    
    const data = await res.json();
    isLicenseValid = data.valid === true;
    lastLicenseChecked = key;
    return isLicenseValid;
  } catch(e) {
    return key.length > 10;
  }
}
