const STORAGE_KEYS = {
  API_KEY:   'leadsniper_api_key',
  NICHE:     'leadsniper_niche',
  ENDPOINT:  'leadsniper_endpoint',
  MODEL:     'leadsniper_model',
  LICENSE:   'leadsniper_license',
  WEBHOOK:   'leadsniper_webhook',
  AUTO_SYNC: 'leadsniper_auto_sync',
  VALUE_PROP: 'leadsniper_value_prop',
  MUTE_SOUND: 'leadsniper_mute_sound',
  BLACKLIST: 'leadsniper_blacklist'
};

const $apiKey   = document.getElementById('apiKey');
const $licenseKey = document.getElementById('licenseKey');
const $niche    = document.getElementById('niche');
const $apiEndpoint = document.getElementById('apiEndpoint');
const $apiModel   = document.getElementById('apiModel');
const $webhookUrl = document.getElementById('webhookUrl');
const $autoSync   = document.getElementById('autoSyncWebhook');
const $saveBtn  = document.getElementById('saveBtn');
const $openBtn  = document.getElementById('openSidepanelBtn');
const $masterSwitch = document.getElementById('masterSwitch');
const $autoHunterSwitch = document.getElementById('autoHunterSwitch');
const $muteSoundSwitch = document.getElementById('muteSoundSwitch');
const $blacklistKeywords = document.getElementById('blacklistKeywords');
const $valueProp = document.getElementById('valueProp');
const $testConnBtn = document.getElementById('testConnBtn');
const $toast    = document.getElementById('toast');
const $statusDot = document.querySelector('.status-dot');

// Load values
chrome.storage.local.get(Object.values(STORAGE_KEYS), (result) => {
  $apiKey.value     = result[STORAGE_KEYS.API_KEY] || '';
  $licenseKey.value = result[STORAGE_KEYS.LICENSE] || '';
  $niche.value      = result[STORAGE_KEYS.NICHE]   || 'AI Automation and SaaS Growth';
  if ($valueProp)  $valueProp.value  = result[STORAGE_KEYS.VALUE_PROP] || '';
  if ($webhookUrl) $webhookUrl.value = result[STORAGE_KEYS.WEBHOOK] || '';
  if ($autoSync)   $autoSync.checked = result[STORAGE_KEYS.AUTO_SYNC] !== false; // default true
  if ($muteSoundSwitch) $muteSoundSwitch.checked = result[STORAGE_KEYS.MUTE_SOUND] === true;
  if ($blacklistKeywords) $blacklistKeywords.value = result[STORAGE_KEYS.BLACKLIST] || '';
  
  let endp = result[STORAGE_KEYS.ENDPOINT] || 'https://api.deepseek.com/chat/completions';
  if (endp.includes('openai.com')) endp = 'https://api.deepseek.com/chat/completions';
  $apiEndpoint.value = endp;
  
  let mod = result[STORAGE_KEYS.MODEL] || 'deepseek-chat';
  if (mod.includes('gpt-')) mod = 'deepseek-chat';
  $apiModel.value = mod;

  // Master Switch state
  chrome.storage.local.get('leadsniper_active', (res) => {
    const isActive = res.leadsniper_active !== false; 
    $masterSwitch.checked = isActive;
    updateStatusDot(isActive);
  });

  // Auto-Hunter switch state
  chrome.storage.local.get('leadsniper_autohunter', (res) => {
    const isAutoHunter = res.leadsniper_autohunter === true;
    if ($autoHunterSwitch) $autoHunterSwitch.checked = isAutoHunter;
  });
});

function updateStatusDot(active) {
  $statusDot.style.background = active ? '#00ff9d' : '#ff2e4c';
  $statusDot.style.boxShadow = active ? '0 0 8px #00ff9d' : '0 0 8px #ff2e4c';
}

$masterSwitch.addEventListener('change', () => {
  const active = $masterSwitch.checked;
  chrome.storage.local.set({ leadsniper_active: active });
  updateStatusDot(active);
  showToast(active ? '🛰️ SCANNER ONLINE' : '💤 SCANNER OFFLINE', !active);
});

if ($autoHunterSwitch) {
  $autoHunterSwitch.addEventListener('change', () => {
    const active = $autoHunterSwitch.checked;
    chrome.storage.local.set({ leadsniper_autohunter: active });
    showToast(active ? '⚡ AUTO-HUNTER BOT ONLINE' : '💤 AUTO-HUNTER BOT OFFLINE', !active);
  });
}

if ($muteSoundSwitch) {
  $muteSoundSwitch.addEventListener('change', () => {
    const active = $muteSoundSwitch.checked;
    chrome.storage.local.set({ [STORAGE_KEYS.MUTE_SOUND]: active });
    showToast(active ? '🔇 SOUND MUTED' : '🔊 SOUND ENABLED', false);
  });
}

if ($testConnBtn) {
  $testConnBtn.addEventListener('click', async () => {
    const apiKey = $apiKey.value.trim();
    const endpoint = $apiEndpoint.value.trim() || 'https://api.deepseek.com/chat/completions';
    const model = $apiModel.value.trim() || 'deepseek-chat';

    if (!apiKey) {
      showToast('❌ ENTER API KEY FIRST', true);
      return;
    }

    const origText = $testConnBtn.textContent;
    $testConnBtn.textContent = "⌛...";
    $testConnBtn.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Connection check' }],
          max_tokens: 1
        })
      });

      if (res.ok || res.status === 400) {
        $testConnBtn.textContent = "✅";
        $testConnBtn.style.color = "#00ff9d";
        showToast('✅ CONNECTION VERIFIED', false);
        setTimeout(() => {
          $testConnBtn.textContent = origText;
          $testConnBtn.style.color = "";
          $testConnBtn.disabled = false;
        }, 2000);
      } else if (res.status === 401 || res.status === 402 || res.status === 429) {
        $testConnBtn.textContent = "❌";
        $testConnBtn.style.color = "#ff2e4c";
        showToast('DeepSeek API Error: Insufficient Balance or Invalid Key.', true);
        setTimeout(() => {
          $testConnBtn.textContent = origText;
          $testConnBtn.style.color = "";
          $testConnBtn.disabled = false;
        }, 3000);
      } else if (res.status === 404) {
        $testConnBtn.textContent = "❌";
        $testConnBtn.style.color = "#ff2e4c";
        showToast('Network Error: Invalid Endpoint URL (404).', true);
        setTimeout(() => {
          $testConnBtn.textContent = origText;
          $testConnBtn.style.color = "";
          $testConnBtn.disabled = false;
        }, 3000);
      } else {
        $testConnBtn.textContent = "❌";
        $testConnBtn.style.color = "#ff2e4c";
        showToast('❌ AUTH FAILED', true);
        setTimeout(() => {
          $testConnBtn.textContent = origText;
          $testConnBtn.style.color = "";
          $testConnBtn.disabled = false;
        }, 2000);
      }
    } catch (err) {
      $testConnBtn.textContent = "❌";
      $testConnBtn.style.color = "#ff2e4c";
      showToast('❌ NETWORK ERROR', true);
      setTimeout(() => {
        $testConnBtn.textContent = origText;
        $testConnBtn.style.color = "";
        $testConnBtn.disabled = false;
      }, 2000);
    }
  });
}

$saveBtn.addEventListener('click', async () => {
  const apiKey     = $apiKey.value.trim();
  const licenseKey = $licenseKey.value.trim();
  const niche      = $niche.value.trim();
  const valueProp  = $valueProp ? $valueProp.value.trim() : '';
  const endpoint   = $apiEndpoint.value.trim() || 'https://api.deepseek.com/chat/completions';
  const model      = $apiModel.value.trim() || 'deepseek-chat';
  const webhook    = $webhookUrl ? $webhookUrl.value.trim() : '';
  const autoSync   = $autoSync ? $autoSync.checked : true;
  const blacklist  = $blacklistKeywords ? $blacklistKeywords.value.trim() : '';
  const muteSound  = $muteSoundSwitch ? $muteSoundSwitch.checked : false;

  if (!apiKey || !niche) {
    showToast('❌ PLEASE FILL API KEY & NICHE', true);
    return;
  }

  const origText = $saveBtn.textContent;

  if (licenseKey) {
    $saveBtn.textContent = "⚡ VERIFYING...";
    try {
      const response = await chrome.runtime.sendMessage({ 
          type: "ACTIVATE_EXT", 
          key: licenseKey 
      });
      if (!response.success) {
        $saveBtn.textContent = origText;
        showToast('❌ ' + response.error, true);
        return;
      }
    } catch(err) {
      $saveBtn.textContent = origText;
      showToast('❌ VERIFICATION FAILED', true);
      return;
    }
  }

  chrome.storage.local.set({
    [STORAGE_KEYS.API_KEY]:   apiKey,
    [STORAGE_KEYS.LICENSE]:   licenseKey,
    [STORAGE_KEYS.NICHE]:     niche,
    [STORAGE_KEYS.VALUE_PROP]: valueProp,
    [STORAGE_KEYS.ENDPOINT]:  endpoint,
    [STORAGE_KEYS.MODEL]:     model,
    [STORAGE_KEYS.WEBHOOK]:   webhook,
    [STORAGE_KEYS.AUTO_SYNC]: autoSync,
    [STORAGE_KEYS.BLACKLIST]:  blacklist,
    [STORAGE_KEYS.MUTE_SOUND]: muteSound
  }, () => {
    $saveBtn.textContent = origText;
    showToast('✅ SECURED & LOCKED', false);
  });
});

$openBtn.addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.sidePanel.open({ tabId: tabs[0].id });
    }
  });
});

const $intentSearchBtn = document.getElementById('intentSearchBtn');
if ($intentSearchBtn) {
  $intentSearchBtn.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEYS.NICHE], (result) => {
      const niche = result[STORAGE_KEYS.NICHE] || 'AI Automation and SaaS Growth';
      
      // 1. Open X/Twitter advanced search
      const queryX = `("recommendation" OR "looking for" OR "anyone know" OR "help me find" OR "suggest me") AND (${niche})`;
      const urlX = `https://x.com/search?q=${encodeURIComponent(queryX)}&f=live`;
      chrome.tabs.create({ url: urlX });

      // 2. Open Reddit advanced search
      const queryReddit = `("looking for" OR "recommend" OR "anyone know" OR "suggest" OR "alternative to") AND (${niche})`;
      const urlReddit = `https://www.reddit.com/search/?q=${encodeURIComponent(queryReddit)}&sort=new`;
      chrome.tabs.create({ url: urlReddit });
    });
  });
}

function showToast(msg, error) {
  $toast.textContent = msg;
  $toast.style.background = error ? '#ff2e4c' : '#00ff9d';
  $toast.style.color = error ? '#fff' : '#000';
  $toast.classList.add('show');
  setTimeout(() => $toast.classList.remove('show'), 2000);
}
