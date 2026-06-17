const STORAGE_KEYS = {
  API_KEY:     'leadsnapper_api_key',
  NICHE:       'leadsnapper_niche',
  ENDPOINT:    'leadsnapper_endpoint',
  MODEL:       'leadsnapper_model',
  LICENSE:     'leadsnapper_license',
  WEBHOOK:     'leadsnapper_webhook',
  AUTO_SYNC:   'leadsnapper_auto_sync',
  VALUE_PROP:  'leadsnapper_value_prop',
  MUTE_SOUND:  'leadsnapper_mute_sound',
  BLACKLIST:   'leadsnapper_blacklist',
  REPLY_STYLE: 'leadsnapper_reply_style',
  DAILY_LIMIT: 'leadsnapper_autopilot_daily_limit',
  ULTRA_SNIPER: 'leadsnapper_ultra_sniper',
  MAX_AUTO_TABS: 'leadsnapper_ultra_max_tabs'
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

const $basicTierPill = document.getElementById('basicTierPill');
const $proTierPill = document.getElementById('proTierPill');
const $enterpriseTierPill = document.getElementById('enterpriseTierPill');
const $proLockIcon = document.getElementById('proLockIcon');
const $enterpriseLockIcon = document.getElementById('enterpriseLockIcon');
const $scarcityBadge = document.getElementById('scarcityBadge');
const $seatsLeft = document.getElementById('seatsLeft');
const $limitWarning = document.getElementById('limitWarning');
const $upgradeFromWarning = document.getElementById('upgradeFromWarning');
const $highVolumeWarning = document.getElementById('highVolumeWarning');

const $autoPilotThreshold = document.getElementById('autoPilotThreshold');
const $thresholdVal = document.getElementById('thresholdVal');
const $autoPilotLock = document.getElementById('autoPilotLock');
const $scramBtn = document.getElementById('scramBtn');
const $disclaimerModal = document.getElementById('disclaimerModal');
const $acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
const $scramCooldownText = document.getElementById('scramCooldownText');
const $lowThresholdWarning = document.getElementById('lowThresholdWarning');

const $ultraSniperSwitch = document.getElementById('ultraSniperSwitch');
const $ultraSniperWarning = document.getElementById('ultraSniperWarning');
const $ultraSniperSettings = document.getElementById('ultraSniperSettings');
const $ultraSniperLock = document.getElementById('ultraSniperLock');
const $decMaxTabsBtn = document.getElementById('decMaxTabsBtn');
const $incMaxTabsBtn = document.getElementById('incMaxTabsBtn');
const $maxTabsCount = document.getElementById('maxTabsCount');

const $modeHunterBtn = document.getElementById('modeHunterBtn');
const $modePilotBtn = document.getElementById('modePilotBtn');
const $decDrafts = document.getElementById('decDrafts');
const $incDrafts = document.getElementById('incDrafts');
const $draftsCount = document.getElementById('draftsCount');
const $usedDraftsSpan = document.getElementById('usedDraftsSpan');
const $maxDraftsSpan = document.getElementById('maxDraftsSpan');
const $draftProgressFill = document.getElementById('draftProgressFill');
const $styleTags = document.querySelectorAll('.style-tag');
const $ragCases = document.getElementById('ragCases');
const $nativeEnabledSwitch = document.getElementById('nativeEnabledSwitch');
const $nativeStatusBadge = document.getElementById('nativeStatusBadge');
const $barkKey = document.getElementById('barkKey');
const $tgToken = document.getElementById('tgToken');
const $tgChatId = document.getElementById('tgChatId');

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
        $scramCooldownText.innerHTML = `<i class="fas fa-hourglass-half"></i> \u23F3 ${minutes}:${seconds.toString().padStart(2, '0')}`;
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
chrome.storage.local.get([...Object.values(STORAGE_KEYS), 'leadsnapper_active', 'leadsnapper_autohunter', 'leadsnapper_scram_cooldown_until', 'leadsnapper_disclaimer_accepted', 'leadsnapper_autopilot_daily_count', 'leadsnapper_rag_cases', 'leadsnapper_native_enabled', 'leadsnapper_native_status', 'leadsnapper_bark_key', 'leadsnapper_tg_token', 'leadsnapper_tg_chat_id'], (result) => {
  $apiKey.value     = result[STORAGE_KEYS.API_KEY] || 'sk-7d97a68e6967406db9ecf35fa986313a';
  $licenseKey.value = result[STORAGE_KEYS.LICENSE] || '';
  $niche.value      = result[STORAGE_KEYS.NICHE]   || 'AI Automation and SaaS Growth';
  if ($ragCases) $ragCases.value = result.leadsnapper_rag_cases || '';
  if ($nativeEnabledSwitch) $nativeEnabledSwitch.checked = result.leadsnapper_native_enabled === true;
  updateNativeStatusUI(result.leadsnapper_native_status);
  if ($barkKey) $barkKey.value = result.leadsnapper_bark_key || '';
  if ($tgToken) $tgToken.value = result.leadsnapper_tg_token || '';
  if ($tgChatId) $tgChatId.value = result.leadsnapper_tg_chat_id || '';
  if ($valueProp)  $valueProp.value  = result[STORAGE_KEYS.VALUE_PROP] || '';
  let webhookVal = result[STORAGE_KEYS.WEBHOOK] || '';
  if (webhookVal === 'https://x.com/home' || webhookVal === 'https://api.hubspot.com/webhooks/leadsnapper') {
    webhookVal = '';
    chrome.storage.local.set({ [STORAGE_KEYS.WEBHOOK]: '' });
  }
  if ($webhookUrl) $webhookUrl.value = webhookVal;
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
  const isActive = result.leadsnapper_active !== false; 
  if ($masterSwitch) $masterSwitch.checked = isActive;
  updateStatusDot(isActive);

  // Ultra-Snapper init
  if ($ultraSniperSwitch) $ultraSniperSwitch.checked = result[STORAGE_KEYS.ULTRA_SNIPER] === true;
  if ($maxTabsCount) $maxTabsCount.textContent = result[STORAGE_KEYS.MAX_AUTO_TABS] || 10;

  // Auto-Pilot switch and threshold state
  refreshLicenseUI();
});

function updateNativeStatusUI(status) {
  if (!$nativeStatusBadge) return;
  if (status === 'connected') {
    $nativeStatusBadge.textContent = 'CONNECTED';
    $nativeStatusBadge.style.background = '#10B981';
    $nativeStatusBadge.style.color = 'white';
  } else {
    $nativeStatusBadge.textContent = 'DISCONNECTED';
    $nativeStatusBadge.style.background = '#cbd5e1';
    $nativeStatusBadge.style.color = '#475569';
  }
}

if ($nativeEnabledSwitch) {
  $nativeEnabledSwitch.addEventListener('change', () => {
    const enabled = $nativeEnabledSwitch.checked;
    chrome.storage.local.set({ leadsnapper_native_enabled: enabled }, () => {
      showToast(enabled ? '🔌 NATIVE SERVICE ENABLED' : '🔌 NATIVE SERVICE DISABLED', false);
      if (!enabled) {
        chrome.storage.local.set({ leadsnapper_native_status: 'disconnected' });
        updateNativeStatusUI('disconnected');
      }
    });
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.leadsnapper_native_status) {
    updateNativeStatusUI(changes.leadsnapper_native_status.newValue);
  }
});

function refreshLicenseUI() {
  chrome.storage.local.get([
    'leadsnapper_autopilot', 
    'leadsnapper_autohunter',
    'leadsnapper_autopilot_threshold', 
    'leadsnapper_license_valid', 
    'leadsnapper_license_tier', 
    'leadsnapper_scram_cooldown_until',
    'leadsnapper_autopilot_daily_count',
    'leadsnapper_autopilot_daily_limit'
  ], (res) => {
    const isAutoPilot = res.leadsnapper_autopilot === true;
    const isAutoHunter = res.leadsnapper_autohunter === true;
    const threshold = res.leadsnapper_autopilot_threshold || 85;
    const hasLicense = res.leadsnapper_license_valid === true;
    const tier = res.leadsnapper_license_tier || 'basic';
    const cooldownUntil = res.leadsnapper_scram_cooldown_until || 0;
    
    const dailyCount = res.leadsnapper_autopilot_daily_count || 0;
    const dailyLimit = res.leadsnapper_autopilot_daily_limit || 50;

    const isProOrEnterprise = hasLicense && (tier === 'pro' || tier === 'enterprise');

    // Steppers UI sync
    if (isProOrEnterprise) {
      if ($draftsCount) $draftsCount.textContent = "Unlimited";
      if ($maxDraftsSpan) $maxDraftsSpan.textContent = "Unlimited";
      if ($usedDraftsSpan) $usedDraftsSpan.textContent = dailyCount;
      if ($draftProgressFill) {
        $draftProgressFill.style.width = "0%";
      }
    } else {
      if ($draftsCount) $draftsCount.textContent = dailyLimit;
      if ($maxDraftsSpan) $maxDraftsSpan.textContent = dailyLimit;
      if ($usedDraftsSpan) $usedDraftsSpan.textContent = dailyCount;
      if ($draftProgressFill) {
        let percent = (dailyCount / dailyLimit) * 100;
        if (percent > 100) percent = 100;
        $draftProgressFill.style.width = `${percent}%`;
        $draftProgressFill.style.background = dailyCount >= dailyLimit ? '#ef4444' : '#2563EB';
      }
    }

    // Toggle daily limit warning strip
    if ($limitWarning) {
      if (!isProOrEnterprise && dailyCount >= dailyLimit) {
        $limitWarning.classList.remove('hidden');
      } else {
        $limitWarning.classList.add('hidden');
      }
    }

    // Toggle high-volume warning safety banner (>50 drafts/day)
    if ($highVolumeWarning) {
      if (!isProOrEnterprise && (dailyCount > 50 || dailyLimit > 50)) {
        $highVolumeWarning.style.display = 'block';
      } else {
        $highVolumeWarning.style.display = 'none';
      }
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

    if ($basicTierPill) $basicTierPill.classList.remove('active');
    if ($proTierPill) $proTierPill.classList.remove('active');
    if ($enterpriseTierPill) $enterpriseTierPill.classList.remove('active');
    if ($proLockIcon) $proLockIcon.style.display = 'inline';
    if ($enterpriseLockIcon) $enterpriseLockIcon.style.display = 'inline';
    if ($scarcityBadge) $scarcityBadge.style.display = 'block';

    if (!hasLicense) {
      if ($modePilotBtn) $modePilotBtn.classList.remove('active');
      if ($autoPilotLock) $autoPilotLock.style.display = 'inline';
      if ($ultraSniperLock) $ultraSniperLock.style.display = 'inline';
      if ($ultraSniperSwitch) $ultraSniperSwitch.disabled = true;
      if ($scramBtn) $scramBtn.style.display = 'none';
      
      if ($tierBadgeText) $tierBadgeText.textContent = "FREE TRIAL";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-exclamation-circle"></i> License Required`;
      if ($upgradeBtn) {
        $upgradeBtn.style.display = 'inline-block';
        $upgradeBtn.href = 'https://checkout.leadsnapper.com/buy/starter';
      }
    } else if (tier === 'basic') {
      if ($modePilotBtn) $modePilotBtn.classList.remove('active');
      if ($autoPilotLock) {
        $autoPilotLock.style.display = 'inline';
        $autoPilotLock.title = "Upgrade to Pro to unlock Auto-Pilot";
      }
      if ($ultraSniperLock) {
        $ultraSniperLock.style.display = 'inline';
      }
      if ($ultraSniperSwitch) {
        $ultraSniperSwitch.checked = false;
        $ultraSniperSwitch.disabled = true;
      }
      if ($scramBtn) $scramBtn.style.display = 'none';

      if ($basicTierPill) $basicTierPill.classList.add('active');

      if ($tierBadgeText) $tierBadgeText.textContent = "LTD STARTER ($199)";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-star-half-alt"></i> Starter Enabled`;
      if ($upgradeBtn) {
        $upgradeBtn.style.display = 'inline-block';
        $upgradeBtn.innerHTML = 'UPGRADE <i class="fas fa-arrow-right"></i>';
        $upgradeBtn.href = 'https://checkout.leadsnapper.com/buy/pro';
      }
    } else if (tier === 'pro') {
      if ($autoPilotLock) $autoPilotLock.style.display = 'none';
      if ($ultraSniperLock) $ultraSniperLock.style.display = 'none';
      if ($ultraSniperSwitch) $ultraSniperSwitch.disabled = false;
      
      if ($modePilotBtn) {
        if (isAutoPilot) $modePilotBtn.classList.add('active');
        else $modePilotBtn.classList.remove('active');
      }
      if ($modeHunterBtn) {
        if (isAutoHunter) $modeHunterBtn.classList.add('active');
        else $modeHunterBtn.classList.remove('active');
      }

      if ($proTierPill) $proTierPill.classList.add('active');
      if ($proLockIcon) $proLockIcon.style.display = 'none';
      if ($scarcityBadge) $scarcityBadge.style.display = 'none';

      if ($scramBtn) $scramBtn.style.display = isAutoPilot ? 'block' : 'none';

      const ultraChecked = $ultraSniperSwitch && $ultraSniperSwitch.checked;
      if ($ultraSniperWarning) $ultraSniperWarning.style.display = ultraChecked ? 'block' : 'none';
      if ($ultraSniperSettings) $ultraSniperSettings.style.display = ultraChecked ? 'flex' : 'none';

      if ($tierBadgeText) $tierBadgeText.textContent = "LTD PRO ($388)";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-star"></i> Pro Active`;
      if ($upgradeBtn) {
        $upgradeBtn.style.display = 'inline-block';
        $upgradeBtn.innerHTML = 'UPGRADE <i class="fas fa-arrow-right"></i>';
        $upgradeBtn.href = 'https://checkout.leadsnapper.com/buy/enterprise';
      }
    } else {
      // Enterprise tier
      if ($autoPilotLock) $autoPilotLock.style.display = 'none';
      if ($ultraSniperLock) $ultraSniperLock.style.display = 'none';
      if ($ultraSniperSwitch) $ultraSniperSwitch.disabled = false;
      
      if ($modePilotBtn) {
        if (isAutoPilot) $modePilotBtn.classList.add('active');
        else $modePilotBtn.classList.remove('active');
      }
      if ($modeHunterBtn) {
        if (isAutoHunter) $modeHunterBtn.classList.add('active');
        else $modeHunterBtn.classList.remove('active');
      }

      if ($enterpriseTierPill) $enterpriseTierPill.classList.add('active');
      if ($proLockIcon) $proLockIcon.style.display = 'none';
      if ($enterpriseLockIcon) $enterpriseLockIcon.style.display = 'none';
      if ($scarcityBadge) $scarcityBadge.style.display = 'none';

      if ($scramBtn) $scramBtn.style.display = isAutoPilot ? 'block' : 'none';

      const ultraChecked = $ultraSniperSwitch && $ultraSniperSwitch.checked;
      if ($ultraSniperWarning) $ultraSniperWarning.style.display = ultraChecked ? 'block' : 'none';
      if ($ultraSniperSettings) $ultraSniperSettings.style.display = ultraChecked ? 'flex' : 'none';

      if ($tierBadgeText) $tierBadgeText.textContent = "LTD ENTERPRISE ($588)";
      if ($seatsBadge) $seatsBadge.innerHTML = `<i class="fas fa-crown"></i> Enterprise Active`;
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
    chrome.storage.local.set({ leadsnapper_active: active });
    updateStatusDot(active);
    showToast(active ? '🛰\uFE0F SCANNER ONLINE' : '💤 SCANNER OFFLINE', !active);
  });
}

if ($muteSoundSwitch) {
  $muteSoundSwitch.addEventListener('change', () => {
    const active = $muteSoundSwitch.checked;
    chrome.storage.local.set({ [STORAGE_KEYS.MUTE_SOUND]: active });
    showToast(active ? '🔇 SOUND MUTED' : '🔊 SOUND ENABLED', false);
  });
}

if ($ultraSniperSwitch) {
  $ultraSniperSwitch.addEventListener('change', () => {
    chrome.storage.local.get(['leadsnapper_license_tier', 'leadsnapper_license_valid'], (res) => {
      const isProOrEnterprise = res.leadsnapper_license_valid && (res.leadsnapper_license_tier === 'pro' || res.leadsnapper_license_tier === 'enterprise');
      if (!isProOrEnterprise) {
        $ultraSniperSwitch.checked = false;
        window.open('https://checkout.leadsnapper.com/buy/pro', '_blank');
        return;
      }
      const active = $ultraSniperSwitch.checked;
      chrome.storage.local.set({ [STORAGE_KEYS.ULTRA_SNIPER]: active }, () => {
        refreshLicenseUI();
        showToast(active ? '🔥 ULTRA-SNIPER ENGAGED' : '💤 ULTRA-SNIPER OFF', false);
      });
    });
  });
}

if ($decMaxTabsBtn) {
  $decMaxTabsBtn.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEYS.MAX_AUTO_TABS], (res) => {
      let limit = res[STORAGE_KEYS.MAX_AUTO_TABS] || 10;
      if (limit > 1) {
        limit--;
        chrome.storage.local.set({ [STORAGE_KEYS.MAX_AUTO_TABS]: limit }, () => {
          if ($maxTabsCount) $maxTabsCount.textContent = limit;
        });
      }
    });
  });
}

if ($incMaxTabsBtn) {
  $incMaxTabsBtn.addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEYS.MAX_AUTO_TABS], (res) => {
      let limit = res[STORAGE_KEYS.MAX_AUTO_TABS] || 10;
      if (limit < 50) {
        limit++;
        chrome.storage.local.set({ [STORAGE_KEYS.MAX_AUTO_TABS]: limit }, () => {
          if ($maxTabsCount) $maxTabsCount.textContent = limit;
        });
      }
    });
  });
}

// Mode options segmented control listeners
if ($modeHunterBtn) {
  $modeHunterBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_autohunter'], (res) => {
      const active = res.leadsnapper_autohunter === true;
      if (active) {
        chrome.storage.local.set({ leadsnapper_autohunter: false }, () => {
          refreshLicenseUI();
          showToast('💤 AUTO-HUNTER OFFLINE', true);
        });
      } else {
        chrome.storage.local.set({ leadsnapper_autohunter: true, leadsnapper_autopilot: false }, () => {
          refreshLicenseUI();
          showToast('\uD83C\uDFAF AUTO-HUNTER ONLINE', false);
        });
      }
    });
  });
}

if ($modePilotBtn) {
  $modePilotBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_autopilot', 'leadsnapper_license_valid', 'leadsnapper_license_tier', 'leadsnapper_scram_cooldown_until'], (res) => {
      const hasLicense = res.leadsnapper_license_valid === true;
      const tier = res.leadsnapper_license_tier || 'basic';
      const cooldownUntil = res.leadsnapper_scram_cooldown_until || 0;

      if (cooldownUntil > Date.now()) {
        showToast('\u23F3 COOLDOWN ACTIVE', true);
        return;
      }

      if (!hasLicense) {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1', '_blank');
        return;
      }
      if (tier === 'basic') {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgefVmouwVkPJZIU4sIr?quantity=1', '_blank');
        return;
      }

      const active = res.leadsnapper_autopilot === true;
      if (active) {
        chrome.storage.local.set({ leadsnapper_autopilot: false }, () => {
          refreshLicenseUI();
          showToast('💤 AUTO-PILOT OFF', true);
        });
      } else {
        chrome.storage.local.get('leadsnapper_disclaimer_accepted', (dRes) => {
          if (!dRes.leadsnapper_disclaimer_accepted) {
            if ($disclaimerModal) $disclaimerModal.style.display = 'flex';
          } else {
            chrome.storage.local.set({ leadsnapper_autopilot: true, leadsnapper_autohunter: false }, () => {
              refreshLicenseUI();
              showToast('🛰\uFE0F AUTO-PILOT ON', false);
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
      leadsnapper_disclaimer_accepted: true,
      leadsnapper_autopilot: true,
      leadsnapper_autohunter: false
    }, () => {
      if ($disclaimerModal) $disclaimerModal.style.display = 'none';
      refreshLicenseUI();
      showToast('🛰\uFE0F AUTO-PILOT ON', false);
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
    chrome.storage.local.set({ leadsnapper_autopilot_threshold: parseInt($autoPilotThreshold.value, 10) });
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
      leadsnapper_autopilot: false,
      leadsnapper_scram_cooldown_until: cooldownTime
    }, () => {
      refreshLicenseUI();
      chrome.runtime.sendMessage({ type: "SCRAM_KILL" });
      startScramCountdown(cooldownTime);
      showToast('🛑 EMERGENCY SCRAM TRIGGERED', true);
    });
  });
}

const proModalOverlay = document.getElementById('proModalOverlay');
const proModalClose = document.getElementById('proModalClose');
const proModalCheckoutBtn = document.getElementById('proModalCheckoutBtn');

function showProModal() {
  if (proModalOverlay) proModalOverlay.style.display = 'flex';
}

if (proModalClose) {
  proModalClose.addEventListener('click', () => {
    proModalOverlay.style.display = 'none';
  });
}

if (proModalOverlay) {
  proModalOverlay.addEventListener('click', (e) => {
    if (e.target === proModalOverlay) {
      proModalOverlay.style.display = 'none';
    }
  });
}

if (proModalCheckoutBtn) {
  proModalCheckoutBtn.addEventListener('click', () => {
    window.open('https://checkout.dodopayments.com/buy/pdt_0NgefVmouwVkPJZIU4sIr?quantity=1', '_blank');
  });
}

const documentUpgradeBtn = document.getElementById('upgradeBtn');
if (documentUpgradeBtn) {
  documentUpgradeBtn.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_license_tier'], (res) => {
      const tier = res.leadsnapper_license_tier;
      if (tier === 'basic') {
        showProModal();
      } else {
        window.open('https://checkout.dodopayments.com/buy/pdt_0NgNoZpvOKdipx3cyM5dX?quantity=1', '_blank');
      }
    });
  });
}

const buyLicenseBtn = document.getElementById('buyLicenseBtn');
if (buyLicenseBtn) {
  buyLicenseBtn.addEventListener('click', () => {
    window.open('https://checkout.leadsnapper.com/buy/starter', '_blank');
  });
}

if ($proTierPill) {
  $proTierPill.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_license_tier'], (res) => {
      const tier = res.leadsnapper_license_tier;
      if (tier !== 'pro' && tier !== 'enterprise') {
        showProModal();
      }
    });
  });
}

if ($enterpriseTierPill) {
  $enterpriseTierPill.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_license_tier'], (res) => {
      const tier = res.leadsnapper_license_tier;
      if (tier !== 'enterprise') {
        window.open('https://checkout.leadsnapper.com/buy/enterprise', '_blank');
      }
    });
  });
}

if ($basicTierPill) {
  $basicTierPill.addEventListener('click', () => {
    chrome.storage.local.get(['leadsnapper_license_valid'], (res) => {
      const hasLicense = res.leadsnapper_license_valid === true;
      if (!hasLicense) {
        window.open('https://checkout.leadsnapper.com/buy/starter', '_blank');
      }
    });
  });
}

const upgradeFromWarning = document.getElementById('upgradeFromWarning');
if (upgradeFromWarning) {
  upgradeFromWarning.addEventListener('click', (e) => {
    e.preventDefault();
    showProModal();
  });
}

if ($testConnBtn) {
  $testConnBtn.addEventListener('click', async () => {
    const apiKey = $apiKey.value.trim();
    const endpoint = $apiEndpoint.value.trim() || 'https://api.deepseek.com/chat/completions';
    const model = $apiModel.value.trim() || 'deepseek-chat';

    if (!apiKey) {
      showToast('\u26A0 ENTER API KEY FIRST', true);
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
        showToast('\u2705 CONNECTION VERIFIED', false);
      } else {
        $testConnBtn.textContent = "TEST";
        showToast('\u274C CONNECTION FAILED', true);
      }
    } catch (err) {
      $testConnBtn.textContent = "TEST";
      showToast('\u26A0 NETWORK ERROR', true);
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
  const ultraSniper = $ultraSniperSwitch ? $ultraSniperSwitch.checked : false;
  const ultraMaxTabs = $maxTabsCount ? parseInt($maxTabsCount.textContent, 10) : 10;

  if (!apiKey || !niche) {
    showToast('⚠️ PLEASE FILL API KEY & NICHE', true);
    return;
  }

  const origText = $saveBtn.innerHTML;
  $saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i> INITIALIZING...`;
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

  const ragCasesVal = $ragCases ? $ragCases.value.trim() : '';
  const nativeEnabledVal = $nativeEnabledSwitch ? $nativeEnabledSwitch.checked : false;
  const barkKeyVal = $barkKey ? $barkKey.value.trim() : '';
  const tgTokenVal = $tgToken ? $tgToken.value.trim() : '';
  const tgChatIdVal = $tgChatId ? $tgChatId.value.trim() : '';

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
    [STORAGE_KEYS.DAILY_LIMIT]: dailyLimit,
    [STORAGE_KEYS.ULTRA_SNIPER]: ultraSniper,
    [STORAGE_KEYS.MAX_AUTO_TABS]: ultraMaxTabs,
    leadsnapper_rag_cases:    ragCasesVal,
    leadsnapper_native_enabled: nativeEnabledVal,
    leadsnapper_bark_key:     barkKeyVal,
    leadsnapper_tg_token:     tgTokenVal,
    leadsnapper_tg_chat_id:   tgChatIdVal
  }, () => {
    $saveBtn.innerHTML = origText;
    $saveBtn.disabled = false;
    refreshLicenseUI();
    showToast('🔒 SECURED & LOCKED', false);
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
  let isLaunching = false;
  $intentSearchBtn.addEventListener('click', () => {
    if (isLaunching) return;
    isLaunching = true;
    
    const origText = $intentSearchBtn.innerHTML;
    $intentSearchBtn.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i> SCANNING...`;
    $intentSearchBtn.disabled = true;
    $intentSearchBtn.style.opacity = '0.7';

    chrome.storage.local.get([STORAGE_KEYS.NICHE], (result) => {
      const niche = result[STORAGE_KEYS.NICHE] || 'AI Automation and SaaS Growth';
      
      const queryX = `("recommendation" OR "looking for" OR "anyone know" OR "help me find" OR "suggest me") AND (${niche})`;
      const urlX = `https://x.com/search?q=${encodeURIComponent(queryX)}&f=live`;
      chrome.tabs.create({ url: urlX });

      const queryReddit = `("looking for" OR "recommend" OR "anyone know" OR "suggest" OR "alternative to") AND (${niche})`;
      const urlReddit = `https://www.reddit.com/search/?q=${encodeURIComponent(queryReddit)}&sort=new`;
      chrome.tabs.create({ url: urlReddit });
      
      setTimeout(() => {
        isLaunching = false;
        $intentSearchBtn.innerHTML = origText;
        $intentSearchBtn.disabled = false;
        $intentSearchBtn.style.opacity = '1';
      }, 1800);
    });
  });
}

if ($upgradeFromWarning) {
  $upgradeFromWarning.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://checkout.leadsnapper.com/buy/pro', '_blank');
  });
}
function showToast(msg, error) {
  $toast.textContent = msg;
  $toast.style.background = error ? '#ef4444' : '#1E293B';
  $toast.style.color = '#F9FAFB';
  $toast.classList.add('show');
  setTimeout(() => $toast.classList.remove('show'), 2000);
}
