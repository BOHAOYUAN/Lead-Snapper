const STORAGE_KEYS = {
  API_KEY:     'leadsniper_api_key',
  NICHE:       'leadsniper_niche',
  ENDPOINT:    'leadsniper_endpoint',
  MODEL:       'leadsniper_model',
  LICENSE:     'leadsniper_license',
  WEBHOOK:     'leadsniper_webhook',
  AUTO_SYNC:   'leadsniper_auto_sync',
  VALUE_PROP:  'leadsniper_value_prop',
  MUTE_SOUND:  'leadsniper_mute_sound',
  BLACKLIST:   'leadsniper_blacklist',
  REPLY_STYLE: 'leadsniper_reply_style',
  DAILY_LIMIT: 'leadsniper_autopilot_daily_limit'
};

const $apiKey = document.getElementById('apiKey');
const $licenseKey = document.getElementById('licenseKey');
const $niche = document.getElementById('niche');
const $apiEndpoint = document.getElementById('apiEndpoint');
const $apiModel = document.getElementById('apiModel');
const $webhookUrl = document.getElementById('webhookUrl');
const $autoSync = document.getElementById('autoSyncWebhook');
const $saveBtn = document.getElementById('saveBtn');
const $openBtn = document.getElementById('openSidepanelBtn');
const $masterSwitch = document.getElementById('masterSwitch');
const $muteSoundSwitch = document.getElementById('muteSoundSwitch');
const $blacklistKeywords = document.getElementById('blacklistKeywords');
const $valueProp = document.getElementById('valueProp');
const $testConnBtn = document.getElementById('testConnBtn');
const $toast = document.getElementById('toast');
const $statusDot = document.getElementById('statusDot');

const $autoPilotThreshold = document.getElementById('autoPilotThreshold');
const $thresholdVal = document.getElementById('thresholdVal');
const $autoPilotLock = document.getElementById('autoPilotLock');
const $scramBtn = document.getElementById('scramBtn');
const $disclaimerModal = document.getElementById('disclaimerModal');
const $acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
const $scramCooldownText = document.getElementById('scramCooldownText');
const $lowThresholdWarning = document.getElementById('lowThresholdWarning');

const $modeHunterBtn = document.getElementById('modeHunterBtn');
const $modePilotBtn = document.getElementById('modePilotBtn');
const $decDrafts = document.getElementById('decDrafts');
const $incDrafts = document.getElementById('incDrafts');
const $draftsCount = document.getElementById('draftsCount');
const $usedDraftsSpan = document.getElementById('usedDraftsSpan');
const $maxDraftsSpan = document.getElementById('maxDraftsSpan');
const $draftProgressFill = document.getElementById('draftProgressFill');
const $styleTags = document.querySelectorAll('.style-tag');

let scramTimer = null;

function startScramCountdown(cooldownTime) {
  if (scramTimer) clearInterval(scramTimer);
  
  const updateTimer = () => {
    const remaining = cooldownTime - Date.now();
    if (remaining <= 0) {
      clearInterval(scramTimer);
      scramTimer = null;
      if ($scramCooldownText) $scramCooldownText.style.display = 'none';
      if ($scramBtn) $scramBtn.style.display = 'none';
      refreshLicenseUI();
    } else {
      if ($scramCooldownText) {
        $scramCooldownText.style.display = 'inline-block';
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        $scramCooldownText.innerHTML = `<i class="fas fa-hourglass-half"></i> ⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      if ($modePilotBtn) {
        $modePilotBtn.classList.remove('active');
      }
      if ($scramBtn) $scramBtn.style.display = 'none';
    }
  };
  
  updateTimer();
  scramTimer = setInterval(updateTimer, 1000);
}

// Load values
chrome.storage.local.get([...Object.values(STORAGE_KEYS), 'leadsniper_active', 'leadsniper_autohunter', 'leadsniper_scram_cooldown_until', 'leadsniper_disclaimer_accepted', 'leadsniper_autopilot_daily_count'], (result) => {
  $apiKey.value     = result[STORAGE_KEYS.API_KEY] || '';
  $licenseKey.value = result[STORAGE_KEYS.LICENSE] || '';
  $niche.value      = result[STORAGE_KEYS.NICHE]   || 'AI Automation and SaaS Growth';
  if ($valueProp)  $valueProp.value  = result[STORAGE_KEYS.VALUE_PROP] || '';
  if ($webhookUrl) $webhookUrl.value = result[STORAGE_KEYS.WEBHOOK] || '';
  if ($autoSync)   $autoSync.checked = result[STORAGE_KEYS.AUTO_SYNC] !== false; // default true
  if ($muteSoundSwitch) $muteSoundSwitch.checked = result[STORAGE_KEYS.MUTE_SOUND] === true;
  if ($blacklistKeywords) $blacklistKeywords.value = result[STORAGE_KEYS.BLACKLIST] || '';
  
  const currentStyle = result[STORAGE_KEYS.REPLY_STYLE] || 'Geek';
  $styleTags.forEach(tag => {
    if (tag.getAttribute('data-style') === currentStyle) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });

  let endp = result[STORAGE_KEYS.ENDPOINT] || 'https://api.deepseek.com/chat/completions';
  if (endp.includes('openai.com')) endp = 'https://api.deepseek.com/chat/completions';
  $apiEndpoint.value = endp;
  
  let mod = result[STORAGE_KEYS.MODEL] || 'deepseek-chat';
  if (mod.includes('gpt-')) mod = 'deepseek-chat';
  $apiModel.value = mod;

  // Master Switch state
  const isActive = result.leadsniper_active !== false; 
  if ($masterSwitch) $masterSwitch.checked = isActive;
  updateStatusDot(isActive);

  // Auto-Pilot switch and threshold state
  refreshLicenseUI();
});

function refreshLicenseUI() {
  chrome.storage.local.get([
    'leadsniper_autopilot', 
    'leadsniper_autohunter',
    'leadsniper_autopilot_threshold', 
    'leadsniper_license_valid', 
    'leadsniper_license_tier', 
    'leadsniper_scram_cooldown_until',
    'leadsniper_autopilot_daily_count',
    'leadsniper_autopilot_daily_limit'
  ], (res) => {
    const isAutoPilot = res.leadsniper_autopilot === true;
    const isAutoHunter = res.leadsniper_autohunter === true;
    const threshold = res.leadsniper_autopilot_threshold || 85;
    const hasLicense = res.leadsniper_license_valid === true;
    const tier = res.leadsniper_license_tier || 'basic';
    const cooldownUntil = res.leadsniper_scram_cooldown_until || 0;
    
    const dailyCount = res.leadsniper_autopilot_daily_count || 0;
    const dailyLimit = res.leadsniper_autopilot_daily_limit || 15;

    // Steppers UI sync
    if ($draftsCount) $draftsCount.textContent = dailyLimit;
    if ($maxDraftsSpan) $maxDraftsSpan.textContent = dailyLimit;
    if ($usedDraftsSpan) $usedDraftsSpan.textContent = dailyCount;
    if ($draftProgressFill) {
      let percent = (dailyCount / dailyLimit) * 100;
      if (percent > 100) percent = 100;
      $draftProgressFill.style.width = `${percent}%`;
      $draftProgressFill.style.background = dailyCount >= dailyLimit ? '#ef4444' : '#2563EB';
    }

    if ($lowThresholdWarning) {
      $lowThresholdWarning.style.display = threshold < 80 ? 'block' : 'none';
    }

    if (cooldownUntil > Date.now()) {
      startScramCountdown(cooldownUntil);
      return;
    } else {
      if ($scramCooldownText) $scramCooldownText.style.display = 'none';
    }

    const $tierBadgeText = document.getElementById('tierBadgeText');
    const $seatsBadge = document.getElementById('seatsBadge');
    const $upgradeBtn = document.getElementById('upgradeBtn');

    if (!hasLicense) {
      if ($modePilotBtn) $modePilotBtn.classList.remove('active');
      if ($autoPilotLock) $autoPilotLock.style.display = 'inline';
      if ($scramBtn) $scramBtn.style.display = 'none';
      
      if ($tierBadgeText) $tierBadgeText.textContent = "FREE TRIAL";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-exclamation-circle"></i> License Required`;
      if ($upgradeBtn) {
        $upgradeBtn.style.display = 'inline-block';
        $upgradeBtn.href = 'https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1';
      }
    } else if (tier === 'basic') {
      if ($modePilotBtn) $modePilotBtn.classList.remove('active');
      if ($autoPilotLock) {
        $autoPilotLock.style.display = 'inline';
        $autoPilotLock.title = "Upgrade to Pro to unlock Auto-Pilot";
      }
      if ($scramBtn) $scramBtn.style.display = 'none';

      if ($tierBadgeText) $tierBadgeText.textContent = "LTD BASIC ($199)";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-star-half-alt"></i> Basic Enabled`;
      if ($upgradeBtn) {
        $upgradeBtn.style.display = 'inline-block';
        $upgradeBtn.innerHTML = 'UPGRADE <i class="fas fa-arrow-right"></i>';
        $upgradeBtn.href = 'https://checkout.dodopayments.com/buy/pdt_0NgefvmouwvkPJZIU4slr?quantity=1';
      }
    } else {
      // Pro tier
      if ($autoPilotLock) $autoPilotLock.style.display = 'none';
      
      if ($modePilotBtn) {
        if (isAutoPilot) $modePilotBtn.classList.add('active');
        else $modePilotBtn.classList.remove('active');
      }
      if ($modeHunterBtn) {
        if (isAutoHunter) $modeHunterBtn.classList.add('active');
        else $modeHunterBtn.classList.remove('active');
      }

      if ($scramBtn) $scramBtn.style.display = isAutoPilot ? 'block' : 'none';

      if ($tierBadgeText) $tierBadgeText.textContent = "LTD PRO ($99)";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-star"></i> Elite Pro Active`;
      if ($upgradeBtn) $upgradeBtn.style.display = 'none';
    }

    if ($autoPilotThreshold) {
      $autoPilotThreshold.value = threshold;
      if ($thresholdVal) $thresholdVal.textContent = threshold;
    }
  });
}

function updateStatusDot(active) {
  if (!$statusDot) return;
  $statusDot.style.background = active ? '#10B981' : '#ef4444';
  $statusDot.style.boxShadow = active ? '0 0 8px #10B981' : '0 0 8px #ef4444';
}

if ($masterSwitch) {
  $masterSwitch.addEventListener('change', () => {
    const active = $masterSwitch.checked;
    chrome.storage.local.set({ leadsniper_active: active });
    updateStatusDot(active);
    showToast(active ? '🛰️ SCANNER ONLINE' : '💤 SCANNER OFFLINE', !active);
  });
}

if ($muteSoundSwitch) {
  $muteSoundSwitch.addEventListener('change', () => {
    const active = $muteSoundSwitch.checked;
    chrome.storage.local.set({ [STORAGE_KEYS.MUTE_SOUND]: active });
    showToast(active ? '🔇 SOUND MUTED' : '🔊 SOUND ENABLED', false);
  });
}

// Mode options segmented control listeners
if ($modeHunterBtn) {
  $modeHunterBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsniper_autohunter'], (res) => {
      const active = res.leadsniper_autohunter === true;
      if (active) {
        chrome.storage.local.set({ leadsniper_autohunter: false }, () => {
          refreshLicenseUI();
          showToast('💤 AUTO-HUNTER OFFLINE', true);
        });
      } else {
        chrome.storage.local.set({ leadsniper_autohunter: true, leadsniper_autopilot: false }, () => {
          refreshLicenseUI();
          showToast('⚡ AUTO-HUNTER ONLINE', false);
        });
      }
    });
  });
}

if ($modePilotBtn) {
  $modePilotBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsniper_autopilot', 'leadsniper_license_valid', 'leadsniper_license_tier', 'leadsniper_scram_cooldown_until'], (res) => {
      const hasLicense = res.leadsniper_license_valid === true;
      const tier = res.leadsniper_license_tier || 'basic';
      const cooldownUntil = res.leadsniper_scram_cooldown_until || 0;

      if (cooldownUntil > Date.now()) {
        showToast('⏳ COOLDOWN ACTIVE', true);
        return;
      }

      if (!hasLicense) {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1', '_blank');
        return;
      }
      if (tier === 'basic') {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgefvmouwvkPJZIU4slr?quantity=1', '_blank');
        return;
      }

      const active = res.leadsniper_autopilot === true;
      if (active) {
        chrome.storage.local.set({ leadsniper_autopilot: false }, () => {
          refreshLicenseUI();
          showToast('💤 AUTO-PILOT OFF', true);
        });
      } else {
        chrome.storage.local.get('leadsniper_disclaimer_accepted', (dRes) => {
          if (!dRes.leadsniper_disclaimer_accepted) {
            if ($disclaimerModal) $disclaimerModal.style.display = 'flex';
          } else {
            chrome.storage.local.set({ leadsniper_autopilot: true, leadsniper_autohunter: false }, () => {
              refreshLicenseUI();
              showToast('🛰️ AUTO-PILOT ON', false);
            });
          }
        });
      }
    });
  });
}

if ($acceptDisclaimerBtn) {
  $acceptDisclaimerBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      leadsniper_disclaimer_accepted: true,
      leadsniper_autopilot: true,
      leadsniper_autohunter: false
    }, () => {
      if ($disclaimerModal) $disclaimerModal.style.display = 'none';
      refreshLicenseUI();
      showToast('🛰️ AUTO-PILOT ON', false);
    });
  });
}

if ($disclaimerModal) {
  $disclaimerModal.addEventListener('click', (e) => {
    if (e.target === $disclaimerModal) {
      $disclaimerModal.style.display = 'none';
      refreshLicenseUI(); // Reverts switch state to OFF visually
    }
  });
}

if ($autoPilotThreshold) {
  $autoPilotThreshold.addEventListener('input', () => {
    const val = parseInt($autoPilotThreshold.value, 10);
    if ($thresholdVal) $thresholdVal.textContent = val;
    if ($lowThresholdWarning) {
      $lowThresholdWarning.style.display = val < 80 ? 'block' : 'none';
    }
  });
  $autoPilotThreshold.addEventListener('change', () => {
    chrome.storage.local.set({ leadsniper_autopilot_threshold: parseInt($autoPilotThreshold.value, 10) });
  });
}

// Stepper click handlers
if ($decDrafts) {
  $decDrafts.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEYS.DAILY_LIMIT], (res) => {
      let limit = res[STORAGE_KEYS.DAILY_LIMIT] || 15;
      if (limit > 5) {
        limit--;
        chrome.storage.local.set({ [STORAGE_KEYS.DAILY_LIMIT]: limit }, () => {
          refreshLicenseUI();
        });
      }
    });
  });
}

if ($incDrafts) {
  $incDrafts.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEYS.DAILY_LIMIT], (res) => {
      let limit = res[STORAGE_KEYS.DAILY_LIMIT] || 15;
      if (limit < 50) {
        limit++;
        chrome.storage.local.set({ [STORAGE_KEYS.DAILY_LIMIT]: limit }, () => {
          refreshLicenseUI();
        });
      }
    });
  });
}

// AI styles tag selectors
$styleTags.forEach(tag => {
  tag.addEventListener('click', () => {
    const style = tag.getAttribute('data-style');
    chrome.storage.local.set({ [STORAGE_KEYS.REPLY_STYLE]: style }, () => {
      $styleTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      showToast('🎨 STYLE UPDATED: ' + style, false);
    });
  });
});

if ($scramBtn) {
  $scramBtn.addEventListener('click', () => {
    const cooldownDuration = 30 * 60 * 1000;
    const cooldownTime = Date.now() + cooldownDuration;
    
    chrome.storage.local.set({
      leadsniper_autopilot: false,
      leadsniper_scram_cooldown_until: cooldownTime
    }, () => {
      refreshLicenseUI();
      chrome.runtime.sendMessage({ type: "SCRAM_KILL" });
      startScramCountdown(cooldownTime);
      showToast('🛑 EMERGENCY SCRAM TRIGGERED', true);
    });
  });
}

const documentUpgradeBtn = document.getElementById('upgradeBtn');
if (documentUpgradeBtn) {
  documentUpgradeBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsniper_license_tier'], (res) => {
      const tier = res.leadsniper_license_tier;
      if (tier === 'basic') {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgefvmouwvkPJZIU4slr?quantity=1', '_blank');
      } else {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1', '_blank');
      }
    });
  });
}

const buyLicenseBtn = document.getElementById('buyLicenseBtn');
if (buyLicenseBtn) {
  buyLicenseBtn.addEventListener('click', () => {
    window.open('https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1', '_blank');
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
    $testConnBtn.textContent = "...";
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
        $testConnBtn.textContent = "TEST";
        showToast('✅ CONNECTION VERIFIED', false);
      } else {
        $testConnBtn.textContent = "TEST";
        showToast('❌ CONNECTION FAILED', true);
      }
    } catch (err) {
      $testConnBtn.textContent = "TEST";
      showToast('❌ NETWORK ERROR', true);
    } finally {
      $testConnBtn.disabled = false;
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
  
  const activeStyleTag = document.querySelector('.style-tag.active');
  const style      = activeStyleTag ? activeStyleTag.getAttribute('data-style') : 'Geek';
  const dailyLimit = $draftsCount ? parseInt($draftsCount.textContent, 10) : 15;

  if (!apiKey || !niche) {
    showToast('❌ PLEASE FILL API KEY & NICHE', true);
    return;
  }

  const origText = $saveBtn.innerHTML;
  $saveBtn.innerHTML = "⌛ INITIALIZING...";
  $saveBtn.disabled = true;

  if (licenseKey) {
    try {
      const response = await chrome.runtime.sendMessage({ 
          type: "ACTIVATE_EXT", 
          key: licenseKey 
      });
      if (!response.success) {
        $saveBtn.innerHTML = origText;
        $saveBtn.disabled = false;
        showToast('❌ ' + response.error, true);
        return;
      }
    } catch(err) {
      $saveBtn.innerHTML = origText;
      $saveBtn.disabled = false;
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
    [STORAGE_KEYS.MUTE_SOUND]: muteSound,
    [STORAGE_KEYS.REPLY_STYLE]: style,
    [STORAGE_KEYS.DAILY_LIMIT]: dailyLimit
  }, () => {
    $saveBtn.innerHTML = origText;
    $saveBtn.disabled = false;
    refreshLicenseUI();
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
      
      const queryX = `("recommendation" OR "looking for" OR "anyone know" OR "help me find" OR "suggest me") AND (${niche})`;
      const urlX = `https://x.com/search?q=${encodeURIComponent(queryX)}&f=live`;
      chrome.tabs.create({ url: urlX });

      const queryReddit = `("looking for" OR "recommend" OR "anyone know" OR "suggest" OR "alternative to") AND (${niche})`;
      const urlReddit = `https://www.reddit.com/search/?q=${encodeURIComponent(queryReddit)}&sort=new`;
      chrome.tabs.create({ url: urlReddit });
    });
  });
}

function showToast(msg, error) {
  $toast.textContent = msg;
  $toast.style.background = error ? '#ef4444' : '#1E293B';
  $toast.style.color = '#F9FAFB';
  $toast.classList.add('show');
  setTimeout(() => $toast.classList.remove('show'), 2000);
}
