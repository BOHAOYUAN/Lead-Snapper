/* LeadSniper 3.0 Content Script — Dual Platform Engine (Hardened) */

console.log('🚀 [LeadSniper] v3 Engine Boot.');

const CONFIG = {
  MIN_LENGTH: 80,
  MAX_LENGTH: 1200,
  THROTTLE: 1500
};

let TOTAL_SCANNED = 0;
let EXTENSION_ALIVE = true; // Guard against context invalidation
let IS_MUTE_SOUND = false;
let BLACKLIST_KEYWORDS = [];

function buildBlacklist(blacklistText) {
  if (!blacklistText) {
    BLACKLIST_KEYWORDS = [];
    return;
  }
  BLACKLIST_KEYWORDS = blacklistText.split(',')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);
  console.log('🔇 [LeadSniper] Loaded blacklist keywords:', BLACKLIST_KEYWORDS);
}

const PLATFORM = window.location.hostname.includes('linkedin.com') ? 'LinkedIn'
               : (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) ? 'X'
               : window.location.hostname.includes('reddit.com') ? 'Reddit'
               : window.location.hostname.includes('news.ycombinator.com') ? 'HN'
               : null;

if (!PLATFORM) console.warn('[LeadSniper] Unsupported platform.');

// ══════════════════════════════════════════════════════════
//  EXTENSION CONTEXT GUARD
//  Prevents 1000+ errors when extension is reloaded
//  but old page hasn't been refreshed yet.
// ══════════════════════════════════════════════════════════
function isExtensionAlive() {
  try {
    // This will throw if extension context is invalidated
    void chrome.runtime.id;
    return true;
  } catch (e) {
    return false;
  }
}

function safeSendMessage(msg, callback) {
  if (!EXTENSION_ALIVE) return;
  try {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        // Check if context died
        if (chrome.runtime.lastError.message?.includes('Extension context invalidated') ||
            chrome.runtime.lastError.message?.includes('disconnected')) {
          console.warn('[LeadSniper] Extension reloaded. Please refresh this page.');
          EXTENSION_ALIVE = false;
          observer.disconnect();
          updateRadar('⚠️ REFRESH PAGE');
          return;
        }
      }
      if (callback) callback(response);
    });
  } catch (e) {
    console.warn('[LeadSniper] Extension context lost. Shutting down gracefully.');
    EXTENSION_ALIVE = false;
    observer.disconnect();
    updateRadar('⚠️ REFRESH PAGE');
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SCROLL_TO_POST' && msg.id) {
    const el = document.querySelector(`[data-ls-id="${msg.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Inject Sniper Targeting Overlay
      let overlay = document.getElementById('ls-sniper-target-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ls-sniper-target-overlay';
        overlay.style.cssText = `
          position: absolute; pointer-events: none; z-index: 10000;
          border: 2px solid #ff2e4c; box-shadow: 0 0 30px rgba(255,46,76,0.8), inset 0 0 20px rgba(255,46,76,0.3);
          background: rgba(255,46,76,0.05); transition: opacity 0.4s ease;
          border-radius: 4px;
        `;
        document.body.appendChild(overlay);
      }
      
      const rect = el.getBoundingClientRect();
      overlay.style.top = (window.scrollY + rect.top - 10) + 'px';
      overlay.style.left = (window.scrollX + rect.left - 10) + 'px';
      overlay.style.width = (rect.width + 20) + 'px';
      overlay.style.height = (rect.height + 20) + 'px';
      overlay.style.opacity = '1';
      
      // Crosshair corners and text
      overlay.innerHTML = `
        <div style="position:absolute; top:-2px; left:-2px; width:20px; height:20px; border-top: 4px solid #ff2e4c; border-left: 4px solid #ff2e4c;"></div>
        <div style="position:absolute; top:-2px; right:-2px; width:20px; height:20px; border-top: 4px solid #ff2e4c; border-right: 4px solid #ff2e4c;"></div>
        <div style="position:absolute; bottom:-2px; left:-2px; width:20px; height:20px; border-bottom: 4px solid #ff2e4c; border-left: 4px solid #ff2e4c;"></div>
        <div style="position:absolute; bottom:-2px; right:-2px; width:20px; height:20px; border-bottom: 4px solid #ff2e4c; border-right: 4px solid #ff2e4c;"></div>
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#ff2e4c; font-family:monospace; font-weight:bold; font-size:18px; text-shadow:0 0 15px #ff2e4c; animation: ls-pulse 1s infinite;">[ TARGET LOCKED ]</div>
      `;
      
      // Add animation style if not exists
      if (!document.getElementById('ls-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'ls-pulse-style';
        style.innerHTML = '@keyframes ls-pulse { 0%, 100% { opacity: 1; transform:translate(-50%,-50%) scale(1); } 50% { opacity: 0.5; transform:translate(-50%,-50%) scale(1.1); } }';
        document.head.appendChild(style);
      }

      setTimeout(() => {
        overlay.style.opacity = '0';
      }, 2500);

      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Target element not found in DOM.' });
    }
    return true; // async response
  }

  if (msg.type === 'EXECUTE_RPA_REPLY' && msg.id && msg.text) {
    const el = document.querySelector(`[data-ls-id="${msg.id}"]`);
    if (!el) {
      sendResponse({ success: false, error: 'Post element not found in DOM' });
      return true;
    }
    
    // Highlight and center focus
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const origBorder = el.style.borderLeft;
    el.style.borderLeft = "6px solid #ff2e4c";
    el.style.boxShadow = "0 0 20px rgba(255,46,76,0.6)";
    setTimeout(() => {
      el.style.borderLeft = origBorder;
      el.style.boxShadow = "";
    }, 2000);
    
    // Execute RPA
    simulateRPA(el, msg.text).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // Keep message channel open for async response
  }
});

// ── EXTRACT TEXT ──
function extractText(el) {
  if (PLATFORM === 'Reddit') {
    let title = el.getAttribute('post-title') || '';
    if (!title) {
      const heading = el.querySelector('h3, h2, [slot="title"], a[data-click-id="title"], [data-testid="post-title"]');
      if (heading) {
        title = heading.textContent.trim();
      } else {
        const commentLinks = el.querySelectorAll('a[href*="/comments/"]');
        for (const link of commentLinks) {
          const text = link.textContent.trim();
          if (text && !/^\d+$/.test(text) && !/^\d+\s*(comments|条评论|评论|replies|回复)?$/i.test(text) && text.length > 5) {
            title = text;
            break;
          }
        }
      }
    }

    const bodyEl = el.querySelector('[slot="text-body"]') || el;
    const bodyClone = bodyEl.cloneNode(true);
    bodyClone.querySelectorAll('button, shreddit-post-actions, faceplate-share-menu, .ls-hud, shreddit-composer, shreddit-aspect-ratio, faceplate-number, shreddit-post-flair').forEach(t => t.remove());
    
    // Remove comment and vote links/stats links
    bodyClone.querySelectorAll('a').forEach(a => {
      const text = a.textContent.toLowerCase();
      if (text.includes('comment') || text.includes('评论') || text.includes('vote') || text.includes('票')) {
        a.remove();
      }
    });

    const bodyText = bodyClone.textContent.replace(/\s+/g, ' ').trim();
    return `[TITLE]: ${title} \n[BODY]: ${bodyText}`.substring(0, CONFIG.MAX_LENGTH);
  }
  if (PLATFORM === 'HN') {
    const titleEl = el.querySelector('span.titleline > a') || el.querySelector('.titleline') || el.querySelector('.titlelink');
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    let bodyText = "";
    const toptext = document.querySelector('.toptext');
    if (toptext && el.closest('table')) {
      bodyText = toptext.textContent.trim();
    }
    return `[TITLE]: ${titleText} \n[BODY]: ${bodyText}`.substring(0, CONFIG.MAX_LENGTH);
  }
  const clone = el.cloneNode(true);
  // Strip out UI components AND the entire comments section so we don't scan replies
  clone.querySelectorAll('button, img, svg, style, script, nav, header, footer, aside, .ls-hud, .update-components-comments, .feed-shared-update-v2__comments-container, .comments-comments-list, .comments-comment-item').forEach(t => t.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim().substring(0, CONFIG.MAX_LENGTH);
}

// ══════════════════════════════════════════════════════════
//  EXTRACT AUTHOR — Platform-specific
// ══════════════════════════════════════════════════════════
function extractAuthor(el) {
  let authorName = "Target";
  let profileUrl = null;
  let authorBio = "";

  if (PLATFORM === 'X') {
    const nameEl = el.querySelector('[data-testid="User-Name"] span');
    if (nameEl) authorName = nameEl.textContent.trim();
    const link = el.querySelector('a[role="link"][href^="/"]');
    if (link) profileUrl = link.href;

    const handleEl = el.querySelector('[data-testid="User-Name"] a[href^="/"] span:nth-child(2)');
    if (handleEl) {
      authorBio = handleEl.textContent.trim(); // store handle in bio for context
    }
  } else if (PLATFORM === 'Reddit') {
    const authorLink = el.querySelector('a[href*="/user/"], a[href*="/u/"]');
    if (authorLink) {
      let rawName = authorLink.textContent.trim();
      if (rawName.startsWith('u/')) rawName = rawName.substring(2);
      authorName = rawName;
      
      let href = authorLink.getAttribute('href') || '';
      if (href.startsWith('/')) {
        profileUrl = 'https://www.reddit.com' + href;
      } else {
        profileUrl = authorLink.href;
      }
    }
    const subredditLink = el.querySelector('a[href*="/r/"]');
    if (subredditLink) {
      authorBio = subredditLink.textContent.trim();
    }
  } else if (PLATFORM === 'HN') {
    const subtext = el.nextElementSibling;
    const authorLink = subtext ? subtext.querySelector('a.hnuser') : null;
    if (authorLink) {
      authorName = authorLink.textContent.trim();
      profileUrl = 'https://news.ycombinator.com/' + authorLink.getAttribute('href');
    }
    const scoreEl = subtext ? subtext.querySelector('.score') : null;
    if (scoreEl) {
      authorBio = `HN Score: ${scoreEl.textContent.trim()}`;
    }
  } else {
    // LinkedIn: Find the real poster accurately
    const allActors = el.querySelectorAll('.update-components-actor__container, .feed-shared-actor, .update-components-actor');
    let mainActor = null;
    
    for (const ac of allActors) {
      // Skip any actors that are in the comment section
      if (ac.closest('.update-components-comments, .feed-shared-update-v2__comments-container, .comments-comments-list')) continue;
      // In a reshare, the structure has two actors (Sharer and Original).
      // We overwrite mainActor, so it naturally picks the LAST non-comment actor (the original author).
      mainActor = ac;
    }
    
    if (mainActor) {
      const link = mainActor.querySelector('a[href*="/in/"], a[href*="/company/"]');
      if (link) profileUrl = link.href;
      
      const liName = mainActor.querySelector('.update-components-actor__name span[aria-hidden="true"], .feed-shared-actor__name span[aria-hidden="true"], .update-components-actor__title span[aria-hidden="true"]');
      
      if (liName && liName.textContent) {
        authorName = liName.textContent.split('\n')[0].trim();
      } else if (link) {
        authorName = link.textContent.replace(/\s+/g, ' ').trim().split('·')[0].trim();
      }

      // Extract LinkedIn headline directly from the post element
      const bioEl = mainActor.querySelector('.update-components-actor__description, .feed-shared-actor__description, .update-components-actor__headline');
      if (bioEl) {
        authorBio = bioEl.textContent.replace(/\s+/g, ' ').trim();
      }
    }
  }

  if (!authorName || authorName.length < 2 || authorName.length > 40) authorName = "Target";
  return { authorName, profileUrl, authorBio };
}

// ── HUD INJECTOR ──
function injectHUD(postEl, score, analysis, enrichment, replies, type="HOT") {
  if (postEl.querySelector('.ls-hud')) return;
  if (PLATFORM === 'HN') {
    const subtextRow = postEl.nextElementSibling;
    if (subtextRow && subtextRow.nextElementSibling && subtextRow.nextElementSibling.classList.contains('ls-hud-row')) return;
  }

  const div = document.createElement('div');
  div.className = 'ls-hud';
  
  const color = type === 'HOT' ? '#ff2e4c' : (type === 'BLUR' ? '#333' : '#00e5ff');
  const title = type === 'HOT' ? '🎯 HOT LEAD' : (type === 'BLUR' ? '🔒 ENCRYPTED TARGET INTEL' : '💡 POTENTIAL TARGET');
  const rgb = type === 'HOT' ? '255,46,76' : '0,229,255';

  div.style.cssText = `
    border-left: 4px solid ${color}; background: #111; padding: 12px; margin: 8px 0;
    font-family: Arial; font-size: 13px; color: white; border-radius: 4px;
    box-shadow: 0 4px 12px rgba(${rgb},0.2); position: relative; z-index: 999;
  `;

  const intelHtml = enrichment ? `
    <div style="background:#222; padding:6px; margin: 8px 0; border: 1px solid #333;">
      <div style="color: #00ff9d; font-size: 11px;">[COMPANY]: ${enrichment.company} | [BIO]: ${enrichment.bio?.substring(0,60)}...</div>
      <div style="color: #ff9800; font-size: 11px; margin-top:4px;"><b>INTEL:</b> ${analysis}</div>
    </div>
  ` : `<div style="color: #ccc; line-height: 1.4; ${type === 'BLUR' ? 'filter: blur(4px); user-select: none;' : ''}">${analysis.replace('BLUR:', '')}</div>`;

  div.innerHTML = `
    <div style="color: ${color}; font-weight: bold; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
      ${title} (Score: ${score})
    </div>
    ${intelHtml}
    <hr style="border: 0; border-bottom: 1px solid #333; margin: 8px 0;" />
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; gap: 8px;">
        ${type === 'BLUR' ? 
          `<button disabled style="background:#222; border:1px solid #444; color:#666; padding:4px 8px; font-size:11px; cursor:not-allowed;">Professional</button>
           <button disabled style="background:#222; border:1px solid #444; color:#666; padding:4px 8px; font-size:11px; cursor:not-allowed;">Creative</button>` :
          (replies ? `<button class="ls-snipe-btn" data-type="Professional" style="background:#0a3a2a; border:1px solid #00ff9d; color:#00ff9d; padding:4px 8px; cursor:pointer; font-size:11px;">🚀 Professional</button>
           <button class="ls-snipe-btn" data-type="Creative" style="background:#3a0a2a; border:1px solid #ff2e4c; color:#ff2e4c; padding:4px 8px; cursor:pointer; font-size:11px;">🎨 Creative</button>`
           : `<div style="color:#666; font-size:10px; font-style:italic;">Click target in Radar to generate custom outreach</div>`)
        }
      </div>
      ${type === 'BLUR' ? 
        `<a href="#" onclick="alert('Visit HY Digital Studio to unlock Advanced AI Targeting.'); return false;" style="color: #ff2e4c; font-size: 10px; text-decoration: underline; font-weight:bold;">UNLOCK PRO VERSION</a>` : ''
      }
    </div>
  `;

  // DOM INJECTION STRATEGY
  if (PLATFORM === 'HN') {
    const subtextRow = postEl.nextElementSibling;
    const parent = postEl.parentElement;
    if (parent && subtextRow) {
      const tr = document.createElement('tr');
      tr.className = 'ls-hud-row';
      const td = document.createElement('td');
      td.setAttribute('colspan', '3');
      td.appendChild(div);
      tr.appendChild(td);
      parent.insertBefore(tr, subtextRow.nextSibling);
    } else {
      postEl.appendChild(div);
    }
  } else {
    // To avoid breaking LinkedIn's React DOM reconciliation (which causes messages to disappear),
    // we do NOT insert elements as array siblings to main post content.
    // Instead, we append it deep inside the header block safely.
    const actorBlock = postEl.querySelector('.update-components-actor, .feed-shared-actor');
    if (actorBlock) {
      if (actorBlock.style.display !== 'block' && actorBlock.style.display !== '') {
         actorBlock.style.display = 'block'; // Ensure block display so child aligns nicely
      }
      div.style.marginTop = '12px';
      actorBlock.appendChild(div);
    } else {
      // Ultimate safe fallback: append at the end so it doesn't shift React indices
      postEl.appendChild(div);
    }
  }

  if (replies) {
    div.querySelectorAll('.ls-snipe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        const replyText = replies[type] || replies.Professional;
        btn.innerText = 'Engaging...';
        simulateRPA(postEl, replyText).then(() => {
          btn.innerText = '✅ Sniped';
        });
      });
    });
  }
}

function getActiveEditor(postEl) {
  if (PLATFORM === 'X') {
    const testidEditor = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (testidEditor) return testidEditor;
    const contentEditableDiv = document.querySelector('div[contenteditable="true"]');
    if (contentEditableDiv && contentEditableDiv.getAttribute('role') === 'textbox') {
      return contentEditableDiv;
    }
    return document.querySelector('[role="textbox"]');
  } else if (PLATFORM === 'LinkedIn') {
    const qlEditor = postEl.querySelector('.ql-editor') || document.querySelector('.ql-editor');
    if (qlEditor) return qlEditor;
    const contentEditableDiv = postEl.querySelector('div[contenteditable="true"]') || document.querySelector('div[contenteditable="true"]');
    if (contentEditableDiv) return contentEditableDiv;
    return postEl.querySelector('[role="textbox"]') || document.querySelector('[role="textbox"]');
  } else if (PLATFORM === 'Reddit') {
    return document.querySelector('shreddit-composer div[contenteditable="true"]') || 
           document.querySelector('div[contenteditable="true"]') ||
           document.querySelector('textarea');
  } else if (PLATFORM === 'HN') {
    return document.querySelector('textarea[name="text"]');
  }
  return document.querySelector('[contenteditable="true"], [role="textbox"]');
}

// ── RPA ──
async function simulateRPA(postEl, text) {
  if (PLATFORM === 'Reddit') {
    let permalink = postEl.getAttribute('permalink');
    if (!permalink) {
      const commentLink = postEl.querySelector('a[href*="/comments/"]');
      if (commentLink) {
        const href = commentLink.getAttribute('href') || '';
        permalink = href.startsWith('http') ? new URL(href).pathname : href;
      }
    }

    if (permalink) {
      if (!permalink.startsWith('/')) permalink = '/' + permalink;
      const detailUrl = 'https://www.reddit.com' + permalink;
      chrome.storage.local.set({
        leadsniper_pending_reply: {
          url: permalink,
          text: text
        }
      }, () => {
        console.log('[LeadSniper] Saved pending reply. Redirecting...');
        window.location.href = detailUrl;
      });
    }
    return;
  }

  if (PLATFORM === 'HN') {
    const id = postEl.getAttribute('id');
    if (id) {
      const detailUrl = `https://news.ycombinator.com/item?id=${id}`;
      chrome.storage.local.set({
        leadsniper_pending_reply: {
          url: `item?id=${id}`,
          text: text
        }
      }, () => {
        console.log('[LeadSniper] Saved HN pending reply. Redirecting...');
        window.location.href = detailUrl;
      });
    }
    return;
  }

  if (PLATFORM === 'X') {
    const replyBtn = postEl.querySelector('[data-testid="reply"]');
    if (replyBtn) replyBtn.click();
    await new Promise(r => setTimeout(r, 600));
    
    const inputArea = getActiveEditor(postEl);
    if (!inputArea) {
      console.error('[LeadSniper] RPA: Input editor not found.');
      return;
    }
    inputArea.focus();
    // Humanized RPA Delay
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    if (!inputArea.textContent.includes(text.substring(0, 5))) {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      inputArea.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }
    inputArea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ', keyCode: 32 }));
  } else {
    // LinkedIn
    const commentBtn = postEl.querySelector('button[aria-label*="Comment"], button[aria-label*="评论"], button[aria-label*="comment"]');
    if (commentBtn) commentBtn.click();
    await new Promise(r => setTimeout(r, 800));
    
    const inputArea = getActiveEditor(postEl);
    if (!inputArea) {
      console.error('[LeadSniper] RPA: Input editor not found.');
      return;
    }
    inputArea.focus();
    // Humanized RPA Delay
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    inputArea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ', keyCode: 32 }));
  }
}

// ── RADAR ──
function updateRadar(statusText) {
  let radar = document.getElementById('ls-radar');
  if (!radar) {
    radar = document.createElement('div');
    radar.id = 'ls-radar';
    radar.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; z-index: 10000;
      background: rgba(10,10,15,0.9); border: 1px solid #ff2e4c;
      padding: 8px 15px; border-radius: 20px; color: #ff2e4c;
      font-family: monospace; font-size: 11px;
      box-shadow: 0 0 15px rgba(255,46,76,0.3); pointer-events: none;
      display: flex; align-items: center; gap: 8px;
    `;
    document.body.appendChild(radar);
  }
  radar.innerHTML = `<span style="width:6px;height:6px;background:#ff2e4c;border-radius:50%;display:inline-block;"></span> LeadSniper [${PLATFORM}]: ${statusText} | Total: ${TOTAL_SCANNED}`;
}

const radarStyle = document.createElement('style');
radarStyle.innerHTML = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`;
document.head.appendChild(radarStyle);

// ── MASTER SWITCH & AUTO-HUNTER BOT ──
let IS_ACTIVE = true;
let CURRENT_NICHE = "";
let INTENT_KEYWORDS = [];

let IS_AUTO_HUNTER = false;
let IS_SCROLL_PAUSED = false;
let scrollTimer = null;
let huntBanner = null;

function startAutoScroll() {
  if (scrollTimer) clearInterval(scrollTimer);
  scrollTimer = setInterval(() => {
    if (IS_AUTO_HUNTER && !IS_SCROLL_PAUSED && EXTENSION_ALIVE && IS_ACTIVE) {
      window.scrollBy({
        top: 250,
        behavior: 'smooth'
      });
    }
  }, 1800);
}

function stopAutoScroll() {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

function playRadarLockBeep() {
  if (IS_MUTE_SOUND) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.25);
    
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 150);
  } catch(e) {}
}

function showLockBanner(postId, score, name, textSnippet) {
  if (huntBanner) huntBanner.remove();
  
  huntBanner = document.createElement('div');
  huntBanner.id = 'ls-hunter-lock-banner';
  huntBanner.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 100000; background: rgba(10,10,15,0.95);
    border: 2px solid #ff2e4c; border-radius: 8px; padding: 15px 25px;
    color: white; font-family: monospace; font-size: 13px;
    box-shadow: 0 0 30px rgba(255,46,76,0.6), inset 0 0 15px rgba(255,46,76,0.2);
    display: flex; flex-direction: column; gap: 8px; min-width: 450px;
    animation: ls-slide-down 0.4s ease-out;
  `;
  
  if (!document.getElementById('ls-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'ls-banner-styles';
    style.innerHTML = `
      @keyframes ls-slide-down {
        0% { top: -100px; opacity: 0; }
        100% { top: 20px; opacity: 1; }
      }
      @keyframes ls-border-flash {
        0%, 100% { border-color: #ff2e4c; box-shadow: 0 0 20px rgba(255,46,76,0.6); }
        50% { border-color: #00ff9d; box-shadow: 0 0 25px rgba(0,255,157,0.8); }
      }
    `;
    document.head.appendChild(style);
  }
  
  huntBanner.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <span style="color:#ff2e4c; font-weight:bold; font-size:14px; text-shadow:0 0 10px rgba(255,46,76,0.5)">🎯 TARGET INTENT LOCKED [Score: ${score}]</span>
      <span style="color:#ff9800; font-size:10px; background:rgba(255,152,0,0.1); border:1px solid #ff9800; padding:2px 6px; border-radius:3px; font-weight:bold; text-transform:uppercase;">Scroll Bot Paused</span>
    </div>
    <div style="color:#aaa; font-size:11px; margin-top:2px;">
      <b>Target:</b> u/${name} | <b>Lead:</b> "${textSnippet.substring(0, 75)}..."
    </div>
    <div style="display:flex; gap:10px; margin-top:6px; justify-content:flex-end; width:100%;">
      <button id="ls-banner-jump-btn" style="background:#ff2e4c; border:none; color:white; padding:5px 12px; border-radius:4px; font-family:monospace; font-size:11px; cursor:pointer; font-weight:bold; transition:all 0.2s;">JUMP TO TARGET</button>
      <button id="ls-banner-resume-btn" style="background:#222; border:1px solid #444; color:#00ff9d; padding:5px 12px; border-radius:4px; font-family:monospace; font-size:11px; cursor:pointer; font-weight:bold; transition:all 0.2s;">⚡ RESUME PATROL</button>
    </div>
  `;
  
  document.body.appendChild(huntBanner);
  
  document.getElementById('ls-banner-jump-btn').addEventListener('click', () => {
    const el = document.querySelector(`[data-ls-id="${postId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.animation = 'ls-border-flash 1.5s infinite';
      setTimeout(() => { el.style.animation = ''; }, 6000);
    }
  });
  
  document.getElementById('ls-banner-resume-btn').addEventListener('click', () => {
    resumeAutoHunterPatrol();
  });
}

function resumeAutoHunterPatrol() {
  IS_SCROLL_PAUSED = false;
  if (huntBanner) {
    huntBanner.remove();
    huntBanner = null;
  }
  console.log('[LeadSniper] Auto-Hunter resumed patrol.');
}

const DEFAULT_INTENT_KEYWORDS = [
  'recommend', 'looking for', 'anyone know', 'alternative to', 'need a',
  'help with', 'suggest', 'tool for', 'software', 'app', 'platform',
  'saas', 'crm', 'automation', 'workflow', 'leads', 'struggle',
  'problem', 'issue', 'how to', 'tips for', 'advice', 'guide', 'freelance'
];

function buildKeywords(nicheText) {
  const words = nicheText.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['struggling', 'with', 'founders', 'seeking', 'growth', 'tools', 'help', 'and', 'for', 'the', 'this', 'that', 'from', 'your', 'about'].includes(w));
  
  INTENT_KEYWORDS = Array.from(new Set([...DEFAULT_INTENT_KEYWORDS, ...words]));
  console.log('🎯 [LeadSniper] Rebuilt active keywords:', INTENT_KEYWORDS);
}

function updateNicheAndKeywords() {
  try {
    chrome.storage.local.get(['leadsniper_niche'], (res) => {
      if (chrome.runtime.lastError || !res) return;
      CURRENT_NICHE = res.leadsniper_niche || "AI Automation and SaaS Growth";
      buildKeywords(CURRENT_NICHE);
    });
  } catch(e) {}
}

// Initial load of keywords
updateNicheAndKeywords();

try {
  chrome.storage.local.get(['leadsniper_active', 'leadsniper_autohunter', 'leadsniper_mute_sound', 'leadsniper_blacklist'], (res) => {
    if (chrome.runtime.lastError) return;
    IS_ACTIVE = res.leadsniper_active !== false;
    updateRadar(IS_ACTIVE ? "READY" : "OFF");
    
    IS_AUTO_HUNTER = res.leadsniper_autohunter === true;
    if (IS_AUTO_HUNTER) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    IS_MUTE_SOUND = res.leadsniper_mute_sound === true;
    buildBlacklist(res.leadsniper_blacklist);
  });
  
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.leadsniper_active) {
      IS_ACTIVE = changes.leadsniper_active.newValue !== false;
      const radar = document.getElementById('ls-radar');
      if (radar) radar.style.display = IS_ACTIVE ? 'flex' : 'none';
      if (IS_ACTIVE && IS_AUTO_HUNTER) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    }
    if (changes.leadsniper_niche) {
      CURRENT_NICHE = changes.leadsniper_niche.newValue || "AI Automation and SaaS Growth";
      buildKeywords(CURRENT_NICHE);
    }
    if (changes.leadsniper_autohunter) {
      IS_AUTO_HUNTER = changes.leadsniper_autohunter.newValue === true;
      if (IS_AUTO_HUNTER) {
        startAutoScroll();
      } else {
        stopAutoScroll();
        if (huntBanner) {
          huntBanner.remove();
          huntBanner = null;
        }
      }
    }
    if (changes.leadsniper_mute_sound) {
      IS_MUTE_SOUND = changes.leadsniper_mute_sound.newValue === true;
    }
    if (changes.leadsniper_blacklist) {
      buildBlacklist(changes.leadsniper_blacklist.newValue);
    }
  });
} catch(e) {
  EXTENSION_ALIVE = false;
}

function matchLocalKeywords(text) {
  const lowerText = text.toLowerCase();
  return INTENT_KEYWORDS.some(kw => lowerText.includes(kw));
}

// ── POST PROCESSOR ──
function processPost(post) {
  if (!EXTENSION_ALIVE) return 0;
  if (post.hasAttribute('data-ls')) return 0;
  post.setAttribute('data-ls', 'scanning');
  
  const postId = Date.now() + '-' + Math.floor(Math.random()*10000);
  post.setAttribute('data-ls-id', postId);

  post.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, textarea, .ls-snipe-btn')) return;
    safeSendMessage({ type: 'SELECT_TARGET_IN_PANEL', id: postId });
    const origBg = post.style.backgroundColor;
    post.style.backgroundColor = 'rgba(0, 255, 157, 0.1)';
    setTimeout(() => { post.style.backgroundColor = origBg; }, 300);
  });

  let text = "";
  try { text = extractText(post); } catch(e) { return 0; }

  if (text.length < CONFIG.MIN_LENGTH) {
    post.removeAttribute('data-ls');
    return 0;
  }

  let authorName = "Target", profileUrl = "", authorBio = "";
  try {
    const a = extractAuthor(post);
    authorName = a.authorName;
    profileUrl = a.profileUrl;
    authorBio = a.authorBio || "";
  } catch(e) {}

  // Local Blacklist Filter
  if (BLACKLIST_KEYWORDS.length > 0) {
    const lowerText = text.toLowerCase();
    const hasBlacklisted = BLACKLIST_KEYWORDS.some(kw => lowerText.includes(kw));
    if (hasBlacklisted) {
      console.log(`[LeadSniper] << Blacklisted Post (Bypassed): ${authorName}`);
      post.setAttribute('data-ls', 'blacklisted');
      post.style.borderLeft = "2px dashed #ff2e4c";
      post.style.opacity = "0.3";
      return 1;
    }
  }

  // Local Keyword Pre-Filter
  if (!matchLocalKeywords(text)) {
    console.log(`[LeadSniper] << Cold Post (Bypassed AI): ${authorName}`);
    post.setAttribute('data-ls', 'cold');
    post.style.borderLeft = "2px solid #333";
    post.style.opacity = "0.45";
    return 1;
  }

  post.style.borderLeft = "2px solid #ff9800";
  post.style.opacity = "0.9";
  updateRadar("SCANNING...");

  console.log(`[LeadSniper] >> AI: ${authorName} (${text.substring(0, 40)}...)`);

  safeSendMessage({ type: 'ANALYZE_POST', id: postId, text, authorName, profileUrl, authorBio }, (response) => {
    TOTAL_SCANNED++;
    if (!response || response.error) {
      post.style.borderLeft = "2px solid #666";
      updateRadar("IDLE");
      return;
    }
    if (response.locked) {
      post.setAttribute('data-ls', 'locked');
      post.style.borderLeft = "4px solid #333";
      post.style.opacity = "1";
      // Inject locked mosaic box
      injectHUD(post, 99, "BLUR:This is highly actionable intelligence about " + authorName + " and their company. They are dealing with specific scaling limits and are actively asking for recommendations. This is a massive opportunity if properly engaged with correct value proposition.", null, null, 'BLUR');
    } else if (response.Confidence_Score >= 75 && response.Category === 'COMMERCIAL_LEAD') {
      post.setAttribute('data-ls', 'hot');
      post.style.borderLeft = "4px solid #ff2e4c";
      post.style.opacity = "1";
      injectHUD(post, response.Confidence_Score, response.Intelligence_Summary || response.Pain_Point_Analysis, response.Enriched_Profile, response.Replies, 'HOT');
      
      // AUTO-HUNTER LOCK TRIGGER
      if (IS_AUTO_HUNTER && response.Confidence_Score >= 85) {
        IS_SCROLL_PAUSED = true;
        playRadarLockBeep();
        showLockBanner(postId, response.Confidence_Score, authorName, text);
      }
    } else {
      post.setAttribute('data-ls', 'news'); // Use 'news' as the catch-all blue class
      post.style.borderLeft = "3px solid #00e5ff"; // Blue
      post.style.opacity = "0.9";
      injectHUD(post, response.Confidence_Score, response.Intelligence_Summary || response.Pain_Point_Analysis, null, null, 'POTENTIAL');
    }
    updateRadar("IDLE");
  });
  return 1;
}

// ══════════════════════════════════════════════════════════
//  SCANNING ENGINES — Platform-specific
// ══════════════════════════════════════════════════════════

function scanX() {
  return document.querySelectorAll('article[data-testid="tweet"]');
}

function scanLinkedIn() {
  // ─── SELF-DIAGNOSTIC (runs once) ───
  if (!scanLinkedIn._diagnosed) {
    scanLinkedIn._diagnosed = true;
    const diag = {
      'data-urn': document.querySelectorAll('[data-urn]').length,
      'data-id': document.querySelectorAll('[data-id]').length,
      'feed-shared-update-v2': document.querySelectorAll('.feed-shared-update-v2').length,
      'occludable-update': document.querySelectorAll('.occludable-update').length,
      'update-components': document.querySelectorAll('[class*="update-components"]').length,
      'profile-links': document.querySelectorAll('a[href*="/in/"]').length,
    };
    console.log('[LeadSniper] LinkedIn DOM Diagnostic:', JSON.stringify(diag));
    
    // Determine which strategy to use
    if (diag['data-urn'] > 0) {
      scanLinkedIn._strategy = 'data-urn';
    } else if (diag['feed-shared-update-v2'] > 0) {
      scanLinkedIn._strategy = 'feed-shared';
    } else if (diag['occludable-update'] > 0) {
      scanLinkedIn._strategy = 'occludable';
    } else if (diag['data-id'] > 0) {
      scanLinkedIn._strategy = 'data-id';
    } else {
      scanLinkedIn._strategy = 'bruteforce';
    }
    console.log('[LeadSniper] Using LinkedIn strategy:', scanLinkedIn._strategy);
  }
  
  let candidates;
  
  switch (scanLinkedIn._strategy) {
    case 'data-urn':
      // Most reliable: LinkedIn marks posts with data-urn="urn:li:activity:..."
      candidates = document.querySelectorAll('[data-urn*="urn:li:activity"]');
      break;
    case 'feed-shared':
      candidates = document.querySelectorAll('.feed-shared-update-v2');
      break;
    case 'occludable':
      candidates = document.querySelectorAll('.occludable-update');
      break;
    case 'data-id':
      candidates = document.querySelectorAll('[data-id*="urn:li:activity"]');
      break;
    case 'bruteforce':
    default:
      // Nuclear option: find all elements containing a profile link + buttons
      // and use the smallest enclosing container
      candidates = findLinkedInPostsByStructure();
      break;
  }
  
  if (!candidates || candidates.length === 0) {
    // Strategy didn't work, re-diagnose on next scan
    scanLinkedIn._diagnosed = false;
    // Try bruteforce as immediate fallback
    candidates = findLinkedInPostsByStructure();
  }
  
  // Filter to only top-level post containers (avoid nesting)
  const posts = [];
  if (candidates) {
    for (const c of candidates) {
      if (c.hasAttribute('data-ls')) continue;
      
      // CRITICAL: Ensure this is not a comment block or nested inside one
      if (c.closest('.comments-comments-list, .comments-comment-item, .update-components-comments, .feed-shared-update-v2__comments-container') || c.classList.contains('comments-comment-item')) {
        continue;
      }

      // Don't process if a parent is already a candidate
      let dominated = false;
      for (const p of posts) {
        if (p.contains(c)) { dominated = true; break; }
      }
      if (!dominated) posts.push(c);
    }
  }
  
  return posts;
}

function findLinkedInPostsByStructure() {
  // Find posts by structural properties instead of class names.
  // Every LinkedIn post has: a profile link (/in/) + Like/Comment buttons
  const profileLinks = document.querySelectorAll('main a[href*="/in/"]');
  const seen = new Set();
  const results = [];
  
  for (const link of profileLinks) {
    // Walk up to find the post boundary:
    // It's the ancestor that contains BOTH the link AND social action buttons
    let el = link.parentElement;
    let postContainer = null;
    let depth = 0;
    
    while (el && depth < 15) {
      // Check if this element looks like a post container:
      // It should have buttons (social actions) and reasonable text length
      const textLen = el.textContent?.length || 0;
      const hasButtons = el.querySelectorAll('button').length >= 2;
      
      if (hasButtons && textLen > 100 && textLen < 5000) {
        postContainer = el;
        break; // Take the smallest matching container
      }
      
      el = el.parentElement;
      depth++;
    }
    
    if (postContainer && !seen.has(postContainer)) {
      seen.add(postContainer);
      results.push(postContainer);
    }
  }
  
  return results;
}

function findRedditSearchPostsByStructure() {
  const postLinks = document.querySelectorAll('a[href*="/comments/"]');
  const seen = new Set();
  const results = [];
  
  for (const link of postLinks) {
    let el = link.parentElement;
    let postContainer = null;
    let depth = 0;
    
    while (el && depth < 12) {
      const tagName = el.tagName.toLowerCase();
      
      const isCard = tagName === 'article' || 
                     tagName === 'reddit-feed-search-post' || 
                     tagName === 'shreddit-post' ||
                     el.getAttribute('data-testid') === 'sdui-post-unit' ||
                     el.getAttribute('data-testid') === 'post-container' ||
                     (tagName === 'faceplate-tracker' && el.getAttribute('data-click-id') === 'search_results_post') ||
                     (tagName === 'faceplate-tracker' && !el.parentElement.closest('faceplate-tracker'));
                     
      if (isCard) {
        postContainer = el;
        break;
      }
      
      if (tagName.includes('-') && tagName !== 'faceplate-tracker' && tagName !== 'faceplate-number' && tagName !== 'faceplate-timeago' && tagName !== 'faceplate-hovercard') {
        postContainer = el;
        break;
      }
      
      el = el.parentElement;
      depth++;
    }
    
    if (!postContainer) {
      let temp = link;
      for (let i = 0; i < 4; i++) {
        if (temp.parentElement) temp = temp.parentElement;
      }
      postContainer = temp;
    }
    
    if (postContainer && !seen.has(postContainer) && !postContainer.closest('.ls-hud')) {
      if (postContainer.textContent.length > 50) {
        seen.add(postContainer);
        results.push(postContainer);
      }
    }
  }
  return results;
}

function scanReddit() {
  const posts = Array.from(document.querySelectorAll('shreddit-post, reddit-feed-search-post, [post-title], [data-testid="sdui-post-unit"], [data-testid="post-container"]'));
  const searchPosts = findRedditSearchPostsByStructure();
  const rawSet = new Set([...posts, ...searchPosts]);
  
  // Deduplicate nested containers to avoid double scanning
  const filtered = [];
  for (const el of rawSet) {
    let dominated = false;
    for (const other of rawSet) {
      if (other !== el && other.contains(el)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) {
      filtered.push(el);
    }
  }
  return filtered;
}

function scanHN() {
  return document.querySelectorAll('tr.athing');
}

function scanPosts() {
  if (!IS_ACTIVE || !PLATFORM || !EXTENSION_ALIVE) return;

  // Check if extension is still alive
  if (!isExtensionAlive()) {
    EXTENSION_ALIVE = false;
    observer.disconnect();
    updateRadar('⚠️ REFRESH PAGE');
    return;
  }

  if (!document.getElementById('ls-radar')) updateRadar("IDLE");

  let posts;
  if (PLATFORM === 'X') {
    posts = scanX();
  } else if (PLATFORM === 'LinkedIn') {
    posts = scanLinkedIn();
  } else if (PLATFORM === 'Reddit') {
    posts = scanReddit();
  } else if (PLATFORM === 'HN') {
    posts = scanHN();
  }

  let found = 0;
  for (const post of posts) {
    found += processPost(post);
  }

  if (found > 0) console.log(`[LeadSniper] Found ${found} new posts on ${PLATFORM}.`);
}

// ── MUTATION OBSERVER ──
let throttleTimer;
const observer = new MutationObserver(() => {
  if (!EXTENSION_ALIVE) { observer.disconnect(); return; }
  clearTimeout(throttleTimer);
  throttleTimer = setTimeout(scanPosts, CONFIG.THROTTLE);
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial scan (delayed to let page render)
setTimeout(scanPosts, 3000);
// Second scan for lazy-loaded content
setTimeout(scanPosts, 6000);

// Detail Page Pending Reply Auto-Injector (Reddit & HN)
try {
  if (PLATFORM === 'Reddit' || PLATFORM === 'HN') {
    const currentUrl = window.location.href;
    chrome.storage.local.get(['leadsniper_pending_reply'], (res) => {
      if (chrome.runtime.lastError || !res || !res.leadsniper_pending_reply) return;
      const pending = res.leadsniper_pending_reply;
      if (currentUrl.includes(pending.url)) {
        console.log('[LeadSniper] Found pending reply for this page! Waiting for editor...');
        let attempts = 0;
        const interval = setInterval(() => {
          const editor = getActiveEditor(document.body);
          if (editor) {
            clearInterval(interval);
            editor.focus();
            // Humanized RPA Delay
            setTimeout(() => {
              document.execCommand('selectAll', false, null);
              document.execCommand('insertText', false, pending.text);
              console.log('[LeadSniper] Successfully auto-injected pending reply.');
              chrome.storage.local.remove('leadsniper_pending_reply');
            }, 500 + Math.random() * 1000);
          }
          attempts++;
          if (attempts > 30) clearInterval(interval); // stop after 15s
        }, 500);
      }
    });
  }
} catch(e) {}
