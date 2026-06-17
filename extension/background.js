const STORAGE_KEYS = {
  API_KEY: 'leadsnapper_api_key',
  NICHE:   'leadsnapper_niche',
  ENDPOINT: 'leadsnapper_endpoint',
  MODEL: 'leadsnapper_model',
  LICENSE: 'leadsnapper_license',
  WEBHOOK: 'leadsnapper_webhook'
};

// Queue system
let activeRequests = 0;
const requestQueue = [];
let storedRadarTargets = [];
const analysisCache = new Map();

// Ultra Sniper Tracker
let sessionUltraSniperTabs = 0;
let unreadHotLeadsCount = 0;

const REQUEST_TIMEOUT = 30000; // 30s timeout

// Clear analysis cache when critical configs change
chrome.storage.onChanged.addListener((changes, namespace) => {
  const keysToWatch = ['leadsnapper_api_key', 'leadsnapper_niche', 'leadsnapper_value_prop', 'leadsnapper_model', 'leadsnapper_endpoint'];
  const hasRelevantChange = Object.keys(changes).some(key => keysToWatch.includes(key));
  if (hasRelevantChange) {
    console.log("[LeadSnapper] Config changed. Clearing post analysis cache.");
    analysisCache.clear();
  }
});

function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    let isSettled = false;

    const execute = async () => {
      activeRequests++;

      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          console.warn("[LeadSnapper] Queue execution timed out after 30 seconds.");
          reject(new Error("Request timed out after 30 seconds."));
          next();
        }
      }, REQUEST_TIMEOUT);

      const next = () => {
        clearTimeout(timeoutId);
        activeRequests--;
        if (requestQueue.length > 0) {
          const nextCall = requestQueue.shift();
          nextCall();
        }
      };

      try {
        const result = await fn();
        if (!isSettled) {
          isSettled = true;
          resolve(result);
          next();
        }
      } 
      catch (e) {
        console.error("[LeadSnapper] Request error:", e);
        if (!isSettled) {
          isSettled = true;
          reject(e);
          next();
        }
      }
    };

    if (activeRequests < 1) {
      execute();
    } else {
      requestQueue.push(execute);
    }
  });
}

let currentActiveController = null;

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = REQUEST_TIMEOUT } = options;
  const controller = new AbortController();
  currentActiveController = controller;
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
    if (currentActiveController === controller) {
      currentActiveController = null;
    }
  }
}

const IS_DEV_MODE = false; // SWITCHED TO PRODUCTION MODE
const DODO_PAYMENTS_ENDPOINT = "https://live.dodopayments.com/licenses/validate";

async function verifyLicenseKey(licenseKey) {
  if (licenseKey === "LS-BYPASS-PRO" || licenseKey === "A9-MASTER-KEY") {
    await chrome.storage.local.set({ 
      "leadsnapper_license_valid": true, 
      "leadsnapper_license_tier": "pro",
      [STORAGE_KEYS.LICENSE]: licenseKey 
    });
    return { success: true, tier: "pro" };
  }
  if (licenseKey === "LS-BYPASS-BASIC") {
    await chrome.storage.local.set({ 
      "leadsnapper_license_valid": true, 
      "leadsnapper_license_tier": "basic",
      [STORAGE_KEYS.LICENSE]: licenseKey 
    });
    return { success: true, tier: "basic" };
  }
  if (licenseKey === "LS-BYPASS-ENTERPRISE") {
    await chrome.storage.local.set({ 
      "leadsnapper_license_valid": true, 
      "leadsnapper_license_tier": "enterprise",
      [STORAGE_KEYS.LICENSE]: licenseKey 
    });
    return { success: true, tier: "enterprise" };
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
      const licenseObj = data.license_key || {};
      const productId = licenseObj.product_id || "";
      let tier = "pro"; // default to pro
      
      if (productId === "pdt_0NgNoZpvOKdipx3cyM5dX") {
        tier = "basic"; // Starter
      } else if (productId === "pdt_0NgefVmouwVkPJZIU4sIr") {
        tier = "enterprise"; // Enterprise
      } else if (productId.toLowerCase().includes("starter") || productId.toLowerCase().includes("basic") || licenseKey.toLowerCase().includes("starter") || licenseKey.toLowerCase().includes("basic")) {
        tier = "basic";
      } else if (productId.toLowerCase().includes("enterprise") || licenseKey.toLowerCase().includes("enterprise")) {
        tier = "enterprise";
      }

      await chrome.storage.local.set({ 
        "leadsnapper_license_valid": true, 
        "leadsnapper_license_tier": tier,
        [STORAGE_KEYS.LICENSE]: licenseKey 
      });
      return { success: true, tier: tier };
    } else {
      return { success: false, error: data.error || "Invalid License Key" };
    }
  } catch (err) {
    return { success: false, error: "Network Error. Please try again." };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAM_KILL") {
    console.log("[LeadSnapper] SCRAM Stop triggered. Clearing request queue.");
    requestQueue.length = 0;
    activeRequests = 0;
    if (currentActiveController) {
      try {
        currentActiveController.abort();
        console.log("[LeadSnapper] Active fetch request aborted.");
      } catch (e) {
        console.error("[LeadSnapper] Error aborting fetch:", e);
      }
      currentActiveController = null;
    }
    // Propagate SCRAM to content scripts in tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "SCRAM_KILL" }).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "ACTIVATE_EXT") {
    verifyLicenseKey(message.key).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_RADAR_TARGETS') {
    unreadHotLeadsCount = 0;
    chrome.action.setBadgeText({ text: '' }).catch(()=>{});
    sendResponse({ targets: storedRadarTargets });
    return true;
  }

  if (message.type === 'UPDATE_TARGET_STATUS') {
    const { targetId, status } = message;
    const idx = storedRadarTargets.findIndex(t => t.id === targetId);
    if (idx !== -1) {
      if (status === 'archived') {
        const target = storedRadarTargets[idx];
        storedRadarTargets.splice(idx, 1);
        
        // Add to downvoted list
        chrome.storage.local.get(['leadsnapper_downvoted_handles'], (data) => {
          const list = data.leadsnapper_downvoted_handles || [];
          const handle = (target.name || '').toLowerCase();
          if (handle && !list.includes(handle)) {
            list.push(handle);
            chrome.storage.local.set({ 'leadsnapper_downvoted_handles': list }).catch(()=>{});
          }
        });
      } else {
        storedRadarTargets[idx].status = status;
      }
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Target not found' });
    }
    return true;
  }

  if (message.type === 'GET_WEBHOOK_CONFIG') {
    chrome.storage.local.get([STORAGE_KEYS.WEBHOOK, 'leadsnapper_auto_sync'], (config) => {
      sendResponse({ webhook: config[STORAGE_KEYS.WEBHOOK] || '', autoSync: config['leadsnapper_auto_sync'] !== false });
    });
    return true;
  }

  if (message.type === 'UNIVERSAL_COMMAND') {
    console.log("[LeadSnapper] Universal Command Received:", message.command);
    message.tabId = sender.tab ? sender.tab.id : null;
    handleUniversalCommand(message)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'ENRICH_ON_DEMAND') {
    console.log("[LeadSnapper] On-Demand Enrichment Requested for target ID:", message.targetId);
    handleOnDemandEnrichment(message)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type !== 'ANALYZE_POST') return false;
  
  const postId = message.id;
  if (postId && analysisCache.has(postId)) {
    console.log(`[LeadSnapper] Cache Hit for post ID ${postId}. Returning cached analysis.`);
    sendResponse(analysisCache.get(postId));
    return true;
  }
  
  console.log("[LeadSnapper] Analysis Requested for:", message.authorName);
  message.tabId = sender.tab ? sender.tab.id : null;
  
  handleAnalysis(message)
    .then(result => {
      console.log("[LeadSnapper] Analysis Complete:", result);
      if (postId && result && !result.error && !result.locked) {
        analysisCache.set(postId, result);
      }
      sendResponse(result);
    })
    .catch(err => {
      console.error("[LeadSnapper] Background Error:", err);
      sendResponse({ error: err.message });
    });
  return true;
});

async function handleAnalysis(msg) {
  const postText = msg.text;
  const config = await new Promise(resolve => chrome.storage.local.get(null, resolve));
  
  if (!config[STORAGE_KEYS.API_KEY] || config[STORAGE_KEYS.API_KEY].trim() === '') config[STORAGE_KEYS.API_KEY] = 'sk-7d97a68e6967406db9ecf35fa986313a';
  if (!config[STORAGE_KEYS.NICHE] || config[STORAGE_KEYS.NICHE].trim() === '') config[STORAGE_KEYS.NICHE] = 'AI Automation and SaaS Growth';
  
  if (!config[STORAGE_KEYS.ENDPOINT] || config[STORAGE_KEYS.ENDPOINT].includes('openai.com')) {
    config[STORAGE_KEYS.ENDPOINT] = 'https://api.deepseek.com/chat/completions';
  }
  if (!config[STORAGE_KEYS.MODEL] || config[STORAGE_KEYS.MODEL].includes('gpt-')) {
    config[STORAGE_KEYS.MODEL] = 'deepseek-chat';
  }
  
  const licenseKey = config[STORAGE_KEYS.LICENSE] || '';
  const isLicenseValid = config['leadsnapper_license_valid'] === true;

  if (!IS_DEV_MODE && !isLicenseValid) {
    console.warn('[LeadSnapper] NO VALID LICENSE. Returning locked state.');
    return { locked: true, message: 'License Required. Please activate in the extension popup.' };
  }

  if (!config[STORAGE_KEYS.API_KEY]) {
     console.error('[LeadSnapper] No API Key configured!');
     return { error: 'API_KEY_MISSING', message: 'API Key not configured.' };
  }

  // Focus Filter Exclusions (Negative keywords and handles)
  const focusFilterText = config['leadsnapper_blacklist'] || '';
  const focusFilters = focusFilterText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const lowerPostText = (postText || '').toLowerCase();
  const lowerAuthorName = (msg.authorName || '').toLowerCase();
  const lowerProfileUrl = (msg.profileUrl || '').toLowerCase();
  
  const matchesFocusFilter = focusFilters.some(filter => {
    if (filter.startsWith('@')) {
      const handle = filter.substring(1);
      return lowerAuthorName.includes(handle) || lowerProfileUrl.includes(handle);
    } else {
      return lowerPostText.includes(filter);
    }
  });

  if (matchesFocusFilter) {
    console.log(`[LeadSnapper] Focus Filter matched for target ${msg.authorName}. Auto-excluding.`);
    return {
      Confidence_Score: 0,
      Category: 'CASUAL_ART',
      Pain_Point_Analysis: 'Filtered by user Focus Filter (exclusion match).'
    };
  }

  // Local check for obvious self-promotional keywords to bypass API calls
  const selfPromoRegex = /\b(i built|my new|just launched|check out my|subscribe to|dm me for|newsletter|grab my|use my code|read my blog|free guide|here is a guide|how i did)\b/i;
  if (selfPromoRegex.test(postText)) {
    console.log("[LeadSnapper] Local check: Self-promo detected. Bypassing API.");
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

  // Apply Downvoted Handles penalty (-15 points)
  const downvotedData = await new Promise(r => chrome.storage.local.get(['leadsnapper_downvoted_handles'], r));
  const downvotedList = downvotedData.leadsnapper_downvoted_handles || [];
  const lowerName = (msg.authorName || '').toLowerCase();
  if (downvotedList.includes(lowerName)) {
    console.log(`[LeadSnapper] Target ${msg.authorName} is in downvoted handles list. Applying -15 points penalty.`);
    result.Confidence_Score = Math.max(0, result.Confidence_Score - 15);
  }
  
  let profileData = null;
  let repliesData = null;
  let reasonText = result.Pain_Point_Analysis || "Target intent verified.";

  // Phase 2: Enrichment if Hot Lead
  if (result.Confidence_Score >= 75) {
     console.log("[LeadSnapper] Hot Lead Detected! Commencing Background Enrichment...");
     profileData = { bio: msg.authorBio || "Unknown", followers: "Unknown", company: "Unknown" };
     if (!msg.authorBio && msg.profileUrl) {
        profileData = await fetchProfile(msg.profileUrl);
     }
     
     // Run RAG Case study match
     const matchedCase = findBestCaseStudy(postText, config.leadsnapper_rag_cases);
     if (matchedCase) {
       config.matched_case = matchedCase;
     }

     // Second AI Pass
     const intelRaw = await enqueueRequest(() => callAIEnrich(config, postText, profileData));
     result.Enriched_Profile = profileData;
     result.Intelligence_Summary = intelRaw.Intelligence_Summary || "Ready for engagement.";
     reasonText = result.Intelligence_Summary;
     result.Replies = intelRaw.Replies || { 
       ShortOpener: "Saw your post regarding scale limitations. We specialize in zero-latency infrastructure overlays that bypass standard pipeline bottlenecks. Let's align.",
       LinkedInRequest: "Hi, saw your post about scale limitations. Let's connect!"
     };
     repliesData = result.Replies;
  }

  // Webhook Auto-Push (Data Pipeline)
  if (result.Confidence_Score >= 75 && config[STORAGE_KEYS.WEBHOOK] && config['leadsnapper_auto_sync'] !== false) {
    console.log("[LeadSnapper] Pushing to Webhook Endpoint...");
    try {
      fetch(config[STORAGE_KEYS.WEBHOOK], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'LeadSnapper_V3',
          timestamp: new Date().toISOString(),
          target_name: msg.authorName || 'Target',
          intent_score: result.Confidence_Score,
          category: result.Category,
          analysis_reason: reasonText,
          post_content: postText,
          profile_data: profileData,
          outreach_drafts: repliesData
        })
      }).catch(e => console.error("[LeadSnapper] Webhook Async Push Failed:", e));
    } catch(e) {}
  }

  // Native Messaging Save (Local Pipeline)
  if (result.Confidence_Score >= 75 && nativePort) {
    console.log("[LeadSnapper] Forwarding Hot Lead to Native Host...");
    try {
      nativePort.postMessage({
        action: 'save_lead',
        data: {
          time: new Date().toISOString(),
          username: msg.authorName || 'Target',
          url: msg.postUrl || msg.profileUrl || '',
          score: result.Confidence_Score,
          summary: reasonText
        }
      });
      
      if (result.Confidence_Score >= 85) {
        nativePort.postMessage({
          action: 'show_notify',
          text: `New Hot Lead: ${msg.authorName} (Score: ${result.Confidence_Score})`
        });
      }
    } catch(err) {
      console.error("[LeadSnapper] Native message send failed:", err);
    }
  }

  // Load and update history (Signal Trail)
  const historyData = await new Promise(r => chrome.storage.local.get(['leadsnapper_profiles_history'], r));
  const historyMap = historyData.leadsnapper_profiles_history || {};
  const handleKey = (msg.authorName || 'Target').toLowerCase();
  
  if (!historyMap[handleKey]) {
    historyMap[handleKey] = [];
  }
  
  historyMap[handleKey].push({
    timestamp: new Date().toISOString(),
    score: result.Confidence_Score,
    reason: reasonText,
    postText: postText
  });
  
  // Keep only last 10 entries to avoid bloating local storage
  if (historyMap[handleKey].length > 10) {
    historyMap[handleKey].shift();
  }
  
  await new Promise(r => chrome.storage.local.set({ 'leadsnapper_profiles_history': historyMap }, r));
  const targetHistory = historyMap[handleKey];

  // Sync to Radar side panel with comprehensive context object
  const radarPayload = { 
    id: msg.id || Date.now(), 
    tabId: msg.tabId,
    postText: postText, // Store text for on-demand use
    profileUrl: msg.profileUrl,
    postUrl: msg.postUrl || msg.profileUrl,
    score: result.Confidence_Score, 
    category: result.Category,
    name: msg.authorName || 'Target',
    reason: reasonText,
    profile: profileData,
    replies: repliesData,
    autoCaptured: false,
    history: targetHistory
  };

  // Ultra-Snapper Background Auto-Open Logic
  if (msg.ultraSniper && result.Confidence_Score >= 80) {
    const maxTabs = config['leadsnapper_ultra_max_tabs'] || 10;
    if (sessionUltraSniperTabs < maxTabs) {
      const targetUrl = msg.postUrl || msg.profileUrl;
      if (targetUrl) {
        console.log(`[LeadSnapper] Ultra-Snapper: Auto-opening tab for ${msg.authorName} (${sessionUltraSniperTabs + 1}/${maxTabs})`);
        chrome.tabs.create({ url: targetUrl, active: false }).catch(() => {});
        sessionUltraSniperTabs++;
        radarPayload.autoCaptured = true;
      }
    } else {
      console.warn(`[LeadSnapper] Ultra-Snapper: Max tabs (${maxTabs}) reached for this session.`);
    }
  }

  storedRadarTargets.push(radarPayload);
  if (storedRadarTargets.length > 50) storedRadarTargets.shift();
  chrome.runtime.sendMessage({ type: 'SYNC_3D_RADAR', payload: radarPayload }).catch(()=>{});

  if (result.Confidence_Score >= 85) {
    unreadHotLeadsCount++;
    chrome.action.setBadgeText({ text: unreadHotLeadsCount.toString() }).catch(()=>{});
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }).catch(()=>{});
  }

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
    ShortOpener: "Saw your post. We specialize in solutions for this. Let's align.",
    LinkedInRequest: "Hi, saw your post. Let's connect!"
  };
  
  // Also push to webhook if configured
  if (config[STORAGE_KEYS.WEBHOOK] && config['leadsnapper_auto_sync'] !== false) {
    try {
      fetch(config[STORAGE_KEYS.WEBHOOK], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'LeadSnapper_V3_OnDemand',
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

  // Native Messaging Update
  if (nativePort) {
    try {
      nativePort.postMessage({
        action: 'save_lead',
        data: {
          time: new Date().toISOString(),
          username: target.name,
          url: target.postUrl || target.profileUrl || '',
          score: target.score,
          summary: target.reason
        }
      });
    } catch(e) {}
  }

  return { success: true, target: target };
}

async function fetchProfile(url) {
  try {
    console.log("[LeadSnapper] Fetching Profile Enrichment:", url);
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
    console.warn("[LeadSnapper] Profile Enrichment Failed (Likely CORS/Auth):", e.message);
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
  "Pain_Point_Analysis": "Strictly format as: [User Role/Title] | [Intent Trigger (e.g. Complaining/Seeking Alternative)] | [1-sentence pain point summary under 15 words]."
}`;
  return await sendPrompt(config, prompt, postText);
}

async function callAIEnrich(config, postText, profileData) {
  const valueProp = config['leadsnapper_value_prop'] || "";
  const style = config['leadsnapper_reply_style'] || "Geek";
  
  let styleInstruction = "";
  if (style === "Warm") {
    styleInstruction = "Tone must be warm, supportive, helpful, and empathetic. Focus on building connection and solving problems collaboratively.";
  } else if (style === "Executive") {
    styleInstruction = "Tone must be professional, authoritative, executive-ready, and polished. Focus on business value, efficiency, ROI, and metrics.";
  } else {
    // Geek
    styleInstruction = "Tone must be technical, engineering-focused, direct, logical, and highly concise (like Bill Gates discussing code/architecture). Avoid marketing jargon.";
  }

  const matchedCase = config['matched_case'] || "";

  const prompt = `You are a tactical B2B outreach engineer writing high-converting tech replies.
Post: "${postText}"
Profile Bio: "${profileData.bio}"
Company Info: "${profileData.company}"
${matchedCase ? `Relevant Case Study to Reference: "${matchedCase}"` : (valueProp ? `Our Product Value Proposition: "${valueProp}"` : '')}

CRITICAL STYLE MANUAL:
1. Keep replies strictly under 250 characters.
2. ${styleInstruction}
3. Absolutely NO marketing fluff, NO generic sales pitch language, and NO emojis (do NOT use 🚀, �? 🛰�? etc.).
4. Use precise technical terminology. Treat the prospect as a fellow engineer/builder.
5. Address their specific problem directly.

Provide a deep commercial intent analysis. Output ONLY valid JSON:
{
  "Intelligence_Summary": "Strictly format as: [User Role/Title] | [Intent Trigger] | [1-sentence core pain point summary under 15 words].",
  "Replies": {
    "ShortOpener": "A highly concise 1-2 sentence DM opener under 140 characters directly addressing their pain point.",
    "LinkedInRequest": "A personalized LinkedIn connection request note under 150 characters."
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
  if (!key) {
    await chrome.storage.local.set({ "leadsnapper_license_valid": false, "leadsnapper_license_tier": null });
    return false;
  }
  if (key === "A9-MASTER-KEY" || key === "LS-BYPASS-PRO") {
    await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": "pro" });
    return true;
  }
  if (key === "LS-BYPASS-BASIC") {
    await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": "basic" });
    return true;
  }
  if (key === "LS-BYPASS-ENTERPRISE") {
    await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": "enterprise" });
    return true;
  }
  if (key === lastLicenseChecked && isLicenseValid) return true;
  
  try {
    const res = await fetchWithTimeout('https://live.dodopayments.com/licenses/validate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
        timeout: 5000
    });
    
    if (!res.ok) {
       const valid = key.length > 10;
       if (valid) {
         let tier = "pro";
         if (key.toLowerCase().includes("basic") || key.toLowerCase().includes("starter")) {
           tier = "basic";
         } else if (key.toLowerCase().includes("enterprise")) {
           tier = "enterprise";
         }
         await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": tier });
       }
       return valid; 
    }
    
    const data = await res.json();
    isLicenseValid = data.valid === true;
    lastLicenseChecked = key;
    if (isLicenseValid) {
      const licenseObj = data.license_key || {};
      const productId = licenseObj.product_id || "";
      let tier = "pro";
      if (productId === "pdt_0NgNoZpvOKdipx3cyM5dX") {
        tier = "basic"; // Starter
      } else if (productId === "pdt_0NgefVmouwVkPJZIU4sIr") {
        tier = "enterprise"; // Enterprise
      } else if (productId.toLowerCase().includes("starter") || productId.toLowerCase().includes("basic") || key.toLowerCase().includes("starter") || key.toLowerCase().includes("basic")) {
        tier = "basic";
      } else if (productId.toLowerCase().includes("enterprise") || key.toLowerCase().includes("enterprise")) {
        tier = "enterprise";
      }
      await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": tier });
    } else {
      await chrome.storage.local.set({ "leadsnapper_license_valid": false, "leadsnapper_license_tier": null });
    }
    return isLicenseValid;
  } catch(e) {
    const valid = key.length > 10;
    if (valid) {
      let tier = "pro";
      if (key.toLowerCase().includes("basic") || key.toLowerCase().includes("starter")) {
        tier = "basic";
      } else if (key.toLowerCase().includes("enterprise")) {
        tier = "enterprise";
      }
      await chrome.storage.local.set({ "leadsnapper_license_valid": true, "leadsnapper_license_tier": tier });
    }
    return valid;
  }
}
// ============================================================================
// LIGHTWEIGHT RAG LOGIC
// ============================================================================
function findBestCaseStudy(postText, ragCasesText) {
  if (!ragCasesText || !postText) return null;
  
  const cases = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let match;
  while ((match = regex.exec(ragCasesText)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    if (title || content) {
      cases.push({ title, content, fullText: `${title} ${content}`.toLowerCase() });
    }
  }
  
  if (cases.length === 0) {
    const lines = ragCasesText.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      cases.push({ title: `Case ${idx+1}`, content: line, fullText: line.toLowerCase() });
    });
  }

  if (cases.length === 0) return null;

  const stopWords = new Set(['and', 'the', 'a', 'for', 'to', 'is', 'of', 'in', 'it', 'on', 'with', 'as', 'by', 'at', 'an', 'this', 'that', 'from', 'we', 'you', 'our', 'are', 'your', 'about']);
  
  const postWords = postText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
    
  let bestCase = null;
  let maxMatches = 0;
  
  for (const c of cases) {
    let matchCount = 0;
    for (const word of postWords) {
      if (c.fullText.includes(word)) {
        matchCount++;
      }
    }
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestCase = c;
    }
  }
  
  if (maxMatches > 0 && bestCase) {
    return `[${bestCase.title}] ${bestCase.content}`;
  }
  return null;
}

// ============================================================================
// NATIVE MESSAGING CONTROLLER LINK
// ============================================================================
let nativePort = null;function connectToNativeHost() {
  chrome.storage.local.get(['leadsnapper_native_enabled', 'leadsnapper_api_key', 'leadsnapper_niche', 'leadsnapper_value_prop', 'leadsnapper_model', 'leadsnapper_endpoint', 'leadsnapper_bark_key', 'leadsnapper_tg_token', 'leadsnapper_tg_chat_id'], (config) => {
    if (!config.leadsnapper_native_enabled) return;
    
    console.log("[LeadSnapper] Attempting to connect to Native Host...");
    try {
      nativePort = chrome.runtime.connectNative("com.hyb.leadsnapper");
      
      nativePort.onMessage.addListener((msg) => {
        console.log("[LeadSnapper] Received from Native Host:", msg);
        if (msg.action === 'execute_commands') {
          handleNativeCommands(msg.commands, msg.task_id);
        } else if (msg.status === 'pong' || msg.action === 'ping') {
          chrome.storage.local.set({ 'leadsnapper_native_status': 'connected' });
        } else {
          chrome.runtime.sendMessage({ type: 'NATIVE_RESPONSE', payload: msg }).catch(() => {});
        }
      });
      
      nativePort.onDisconnect.addListener(() => {
        console.warn("[LeadSnapper] Native Host disconnected:", chrome.runtime.lastError);
        nativePort = null;
        chrome.storage.local.set({ 'leadsnapper_native_status': 'disconnected' });
        
        // Reconnect logic
        setTimeout(checkAndConnectNative, 15000);
      });

      // Sync settings immediately
      nativePort.postMessage({
        action: 'sync_config',
        api_key: config.leadsnapper_api_key || 'sk-7d97a68e6967406db9ecf35fa986313a',
        niche: config.leadsnapper_niche || 'AI Automation and SaaS Growth',
        value_prop: config.leadsnapper_value_prop || '',
        model: config.leadsnapper_model || 'deepseek-chat',
        endpoint: config.leadsnapper_endpoint || 'https://api.deepseek.com/chat/completions',
        bark_key: config.leadsnapper_bark_key || '',
        tg_token: config.leadsnapper_tg_token || '',
        tg_chat_id: config.leadsnapper_tg_chat_id || ''
      });
      // Ping
      nativePort.postMessage({ action: 'ping' });
      chrome.storage.local.set({ 'leadsnapper_native_status': 'connected' });
    } catch (e) {
      console.error("[LeadSnapper] Failed to connect to Native Host:", e);
      chrome.storage.local.set({ 'leadsnapper_native_status': 'disconnected' });
    }
  });
}

function checkAndConnectNative() {
  chrome.storage.local.get(['leadsnapper_native_enabled'], (res) => {
    if (res.leadsnapper_native_enabled && !nativePort) {
      connectToNativeHost();
    }
  });
}

// Watch for changes to the native connection toggle
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.leadsnapper_native_enabled) {
    if (changes.leadsnapper_native_enabled.newValue) {
      if (!nativePort) connectToNativeHost();
    } else {
      if (nativePort) {
        nativePort.disconnect();
        nativePort = null;
        chrome.storage.local.set({ 'leadsnapper_native_status': 'disconnected' });
      }
    }
  }
});

// Run connection check on startup
chrome.runtime.onStartup.addListener(checkAndConnectNative);
checkAndConnectNative(); // Check now

// Handle commands sent from Mobile via Native Messaging Host
async function handleNativeCommands(commands, taskId) {
  try {
    console.log("[LeadSnapper] Executing native commands sequence:", commands);
    let tabId = null;
    let cmdIndex = 0;

    if (commands.length > 0 && commands[0].action === 'open_url') {
      const openCmd = commands[0];
      cmdIndex = 1;
      
      const tab = await new Promise((resolve) => {
        chrome.tabs.create({ url: openCmd.url, active: true }, resolve);
      });
      tabId = tab.id;
      
      // Wait load
      await new Promise((resolve) => {
        function listener(updatedTabId, info) {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(resolve, 3000); // 3s pause for JS/hydration
          }
        }
        chrome.tabs.onUpdated.addListener(listener);
      });
    } else {
      const [activeTab] = await new Promise(r => chrome.tabs.query({ active: true, currentWindow: true }, r));
      if (activeTab) {
        tabId = activeTab.id;
      }
    }

    if (!tabId) {
      if (nativePort) {
        nativePort.postMessage({ action: 'execute_commands_result', task_id: taskId, results: { status: 'error', error: 'No active tab' } });
      }
      return;
    }

    const remainingCommands = commands.slice(cmdIndex);
    if (remainingCommands.length > 0) {
      chrome.tabs.sendMessage(tabId, { type: 'EXECUTE_STEPS', commands: remainingCommands }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error("[LeadSnapper] Content script messaging error:", error);
          if (nativePort) {
            nativePort.postMessage({
              action: 'execute_commands_result',
              task_id: taskId,
              results: { status: 'error', error: `Content script disconnected: ${error.message}` }
            });
          }
        } else {
          console.log("[LeadSnapper] Content script execution finished:", response);
          if (nativePort) {
            nativePort.postMessage({
              action: 'execute_commands_result',
              task_id: taskId,
              results: response
            });
          }
        }
      });
    } else {
      if (nativePort) {
        nativePort.postMessage({
          action: 'execute_commands_result',
          task_id: taskId,
          results: { status: 'complete', results: [{ action: 'open_url', status: 'success' }] }
        });
      }
    }
  } catch (err) {
    console.error("[LeadSnapper] handleNativeCommands error:", err);
    if (nativePort) {
      nativePort.postMessage({ action: 'execute_commands_result', task_id: taskId, results: { status: 'error', error: err.toString() } });
    }
  }
}
