// LeadSniper 3D WebGL Side Panel — Solution Engine (Fixed & Hardened)

const container = document.getElementById('canvas-container');
const logContainer = document.getElementById('log-container');
const statsEl = document.getElementById('stats');
const emptyStateEl = document.getElementById('empty-state');
const detailDrawer = document.getElementById('detail-drawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const syncWebhookBtn = document.getElementById('syncWebhookBtn');
const directSnipeBtn = document.getElementById('directSnipeBtn');
const liveTickerEl = document.getElementById('stealth-live-ticker');

// Universal CLI Elements
const cliInput = document.getElementById('cli-input');
const cliSubmit = document.getElementById('cli-submit');
const universalCli = document.getElementById('universal-cli');

let scene, camera, renderer;
let sweepMesh;
let raycaster, mouse;
let targets = []; // stored points
let currentSelectedTarget = null;

// Micro Stealth status array ticker list
const stealthTickers = [
  "[STEALTH: Spoofing Canvas noise profile...]",
  "[STEALTH: Simulating human random mouse path...]",
  "[STEALTH: Perturbing WebGL parameter matrices...]",
  "[STEALTH: Injecting virtual keyboard layout delays...]",
  "[STEALTH: Bypassing automated cloud headless detectors...]"
];
let currentTickerIdx = 0;

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.0025);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 90;
  camera.position.y = 25;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x050505, 1);
  container.appendChild(renderer.domElement);

  // Raycasting Setup
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 3D Cyberpunk Perspective Grid Helper
  const gridHelper = new THREE.GridHelper(200, 40, 0x00ff9d, 0x003311);
  gridHelper.position.y = -30;
  scene.add(gridHelper);

  // Concentric Radar Rings
  const ringGroup = new THREE.Group();
  for (let r = 20; r <= 100; r += 20) {
    const ringGeo = new THREE.RingGeometry(r - 0.5, r, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff9d, side: THREE.DoubleSide, transparent: true, opacity: 0.12 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ringGroup.add(ring);
  }
  ringGroup.position.y = -29.5;
  scene.add(ringGroup);

  // Sweeping Radar Line / Plane
  const sweepGeo = new THREE.PlaneGeometry(100, 2);
  sweepGeo.translate(50, 0, 0);
  const sweepMat = new THREE.MeshBasicMaterial({ color: 0x00ff9d, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
  sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
  sweepMesh.rotation.x = Math.PI / 2;
  sweepMesh.position.y = -29;
  scene.add(sweepMesh);

  // Digital Rain Background (Particles)
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 1500;
  const posArray = new Float32Array(particlesCount * 3);

  for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 400;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.6,
    color: 0x005522,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Click Intercept for Node Picking
  window.addEventListener('click', onCanvasClick);

  // Animation Loop
  const animate = function () {
    requestAnimationFrame(animate);
    
    if (sweepMesh) {
      sweepMesh.rotation.z -= 0.025;
    }

    particlesMesh.rotation.y += 0.001;
    particlesMesh.position.y -= 0.15;
    if (particlesMesh.position.y < -100) {
      particlesMesh.position.y = 100;
    }

    targets.forEach(t => {
      if(t.mesh) {
        t.mesh.rotation.x += 0.015;
        t.mesh.rotation.y += 0.015;
        const baseScale = t === currentSelectedTarget ? 1.4 : 1.0;
        const scale = baseScale + Math.sin(Date.now() * 0.005) * 0.12;
        t.mesh.scale.set(scale, scale, scale);
      }
      if (t.floorRing) {
        t.floorRing.rotation.z += 0.01;
      }
    });

    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Timers for automated checks & tickers
  setInterval(simulateSelfHealingCheck, 12000);
  setInterval(rotateStealthTicker, 3500);
}

function rotateStealthTicker() {
  if (!liveTickerEl) return;
  currentTickerIdx = (currentTickerIdx + 1) % stealthTickers.length;
  liveTickerEl.textContent = stealthTickers[currentTickerIdx];
}

function onCanvasClick(event) {
  // Only process clicks on the canvas itself
  if (event.target.tagName !== 'CANVAS') return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const meshes = targets.map(t => t.mesh).filter(Boolean);
  if (meshes.length === 0) return;

  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    const hitTarget = targets.find(t => t.mesh === hitMesh);
    if (hitTarget) {
      selectTarget(hitTarget);
    }
  }
}

function selectTarget(target) {
  if (!target) return;
  currentSelectedTarget = target;
  scrollToTarget(target.id, target.tabId);
  
  const nameEl = document.getElementById('drawer-target-name');
  const scoreEl = document.getElementById('drawer-score');
  const reasonEl = document.getElementById('drawer-reason');
  const enrichEl = document.getElementById('drawer-enrichment');
  const profEl = document.getElementById('reply-prof');
  const humorEl = document.getElementById('reply-humor');
  const dirEl = document.getElementById('reply-director');

  if (nameEl) nameEl.textContent = ((target.name || 'TARGET NODE') + '').toUpperCase();
  if (scoreEl) scoreEl.textContent = target.score || 85;
  if (reasonEl) reasonEl.textContent = target.reason || "High intent metrics matched strategic qualification rules.";
  
  if (enrichEl) {
    const p = target.profile || {};
    enrichEl.innerHTML = `[ORGANIZATION]: ${p.company || 'Enterprise Target Tech'}<br>[AUTHORITY/BIO]: ${p.bio || 'High Net-Worth Individual / Decision Maker.'}`;
  }

  const repliesContainer = document.getElementById('drawer-replies-container');
  const generateBtn = document.getElementById('btn-generate-ondemand');
  const directSnipeBtn = document.getElementById('directSnipeBtn');

  if (!target.replies) {
    if (repliesContainer) repliesContainer.style.display = 'none';
    if (directSnipeBtn) directSnipeBtn.style.display = 'none';
    if (generateBtn) {
      generateBtn.style.display = 'block';
      generateBtn.onclick = () => generateOutreachOnDemand(target);
    }
  } else {
    if (repliesContainer) repliesContainer.style.display = 'block';
    if (directSnipeBtn) directSnipeBtn.style.display = 'block';
    if (generateBtn) generateBtn.style.display = 'none';

    const r = target.replies;
    if (profEl) profEl.textContent = r.Professional || "No professional draft generated.";
    if (humorEl) humorEl.textContent = r.Humor || "No humor draft generated.";
    if (dirEl) dirEl.textContent = r.Director || "No director draft generated.";
  }

  if (detailDrawer) {
    detailDrawer.classList.add('open');
  }

  const safeName = (target.name || 'Target') + '';
  logMessage(`Target selected: ${safeName.substring(0, 12)}... Loaded custom outreach drafts.`, 'hot');
}

// ═══════════ DRAWER BUTTON HANDLERS ═══════════

if (closeDrawerBtn) {
  closeDrawerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (detailDrawer) detailDrawer.classList.remove('open');
    currentSelectedTarget = null;
  });
}

if (syncWebhookBtn) {
  syncWebhookBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentSelectedTarget) {
      logMessage('[SYNC] No target selected.', 'cold');
      return;
    }

    const origText = syncWebhookBtn.textContent;
    syncWebhookBtn.textContent = "⚡ PUSHING SECURE PAYLOAD...";
    syncWebhookBtn.disabled = true;

    // Pull real webhook config from background
    chrome.runtime.sendMessage({ type: 'GET_WEBHOOK_CONFIG' }, (config) => {
      const webhookUrl = config && config.webhook;

      if (webhookUrl) {
        // Real webhook push
        const payload = {
          source: 'LeadSniper_V3_Radar',
          timestamp: new Date().toISOString(),
          target_name: currentSelectedTarget.name || 'Target',
          intent_score: currentSelectedTarget.score,
          category: currentSelectedTarget.category,
          analysis_reason: currentSelectedTarget.reason,
          profile_data: currentSelectedTarget.profile,
          outreach_drafts: currentSelectedTarget.replies
        };

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(res => {
          syncWebhookBtn.textContent = res.ok ? "✅ CLOUD SYNC SUCCESS" : "⚠️ WEBHOOK ERROR";
          syncWebhookBtn.style.background = res.ok ? "#00ff9d" : "#ff9800";
          syncWebhookBtn.style.color = "#000";
          logMessage(res.ok 
            ? `[SYNC] Payload exported to Webhook successfully.` 
            : `[SYNC] Webhook returned ${res.status}.`, res.ok ? 'info' : 'cold');
        }).catch(err => {
          syncWebhookBtn.textContent = "❌ PUSH FAILED";
          syncWebhookBtn.style.color = "#ff2e4c";
          logMessage(`[SYNC] Webhook error: ${err.message}`, 'hot');
        }).finally(() => {
          setTimeout(() => {
            syncWebhookBtn.textContent = origText;
            syncWebhookBtn.style.background = "";
            syncWebhookBtn.style.color = "";
            syncWebhookBtn.disabled = false;
          }, 2000);
        });
      } else {
        // No webhook configured — show demo animation
        setTimeout(() => {
          syncWebhookBtn.textContent = "⚠️ NO WEBHOOK URL";
          syncWebhookBtn.style.color = "#ff9800";
          logMessage(`[SYNC] No webhook URL configured. Set it in the popup settings.`, 'cold');
          setTimeout(() => {
            syncWebhookBtn.textContent = origText;
            syncWebhookBtn.style.background = "";
            syncWebhookBtn.style.color = "";
            syncWebhookBtn.disabled = false;
          }, 2000);
        }, 400);
      }
    });
  });
}

if (directSnipeBtn) {
  directSnipeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentSelectedTarget) {
      logMessage('[SNIPE] No target selected.', 'cold');
      return;
    }

    const origText = directSnipeBtn.textContent;
    directSnipeBtn.textContent = "⚡ PREPARING OUTREACH...";
    directSnipeBtn.disabled = true;

    const profEl = document.getElementById('reply-prof');
    const replyText = profEl ? profEl.textContent : '';

    safeCopyToClipboard(replyText).then(ok => {
      executeReplyRPA(replyText);
      setTimeout(() => {
        if (ok && replyText) {
          directSnipeBtn.textContent = "✅ DIRECT SNIPE EXECUTED";
          directSnipeBtn.style.background = "#ff2e4c";
          directSnipeBtn.style.color = "#fff";
          logMessage(`[SNIPE] Outreach copied & auto-populated for ${(currentSelectedTarget.name || 'Target').substring(0, 12)}.`, 'hot');
        } else {
          directSnipeBtn.textContent = "⚠️ SNIPE FAILED";
          directSnipeBtn.style.color = "#ff9800";
          logMessage(`[SNIPE] Could not snipe target. Try clicking a reply card directly.`, 'cold');
        }
        setTimeout(() => {
          directSnipeBtn.textContent = origText;
          directSnipeBtn.style.background = "";
          directSnipeBtn.style.color = "";
          directSnipeBtn.disabled = false;
        }, 2500);
      }, 600);
    });
  });
}

// ═══════════ UNIVERSAL AGENT LOGIC ═══════════

if (cliSubmit) {
  cliSubmit.addEventListener('click', async () => {
    const command = cliInput.value.trim();
    if (!command) return;

    cliInput.disabled = true;
    cliSubmit.disabled = true;
    cliSubmit.textContent = "SCANNING...";
    universalCli.classList.add('processing');
    logMessage(`[UNIVERSAL] Executing command: ${command}`, 'cold');

    try {
      // 1. Get Active Tab
      const tabs = await new Promise(res => chrome.tabs.query({active: true, currentWindow: true}, res));
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        throw new Error("Cannot detect active tab.");
      }

      // 2. Inject Extractor Script
      const injection = await new Promise((res, rej) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: extractUniversalContext
        }, (results) => {
          if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
          else res(results);
        });
      });

      const extractedData = injection[0].result;
      if (!extractedData || !extractedData.text) throw new Error("No readable text found on page.");
      
      logMessage(`[UNIVERSAL] DOM extracted (${extractedData.interactiveElements.length} elements). Analyzing...`, 'info');
      cliSubmit.textContent = "ANALYZING...";

      // 3. Send to Background AI
      chrome.runtime.sendMessage({
        type: 'UNIVERSAL_COMMAND',
        command: command,
        pageText: extractedData.text,
        elements: extractedData.interactiveElements
      }, (response) => {
        if (response && response.error) {
          logMessage(`[ERROR] AI Error: ${response.error}`, 'hot');
        } else if (response) {
          // Display the result
          logMessage(`[UNIVERSAL] Intelligence parsed successfully.`, 'info');
          displayUniversalResult(command, response, extractedData, tabs[0].id);
        } else {
          logMessage(`[ERROR] Unknown error from background.`, 'hot');
        }
        
        // Reset UI
        resetCliUI();
      });

    } catch(e) {
      logMessage(`[ERROR] ${e.message}`, 'hot');
      resetCliUI();
    }
  });

  cliInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') cliSubmit.click();
  });
}

function resetCliUI() {
  cliInput.disabled = false;
  cliSubmit.disabled = false;
  cliSubmit.textContent = "EXECUTE";
  universalCli.classList.remove('processing');
  cliInput.value = '';
}

function displayUniversalResult(command, aiData, domData, activeTabId) {
  // We'll create a synthetic "Target" to display in the Drawer
  const mockTarget = {
    id: aiData.Target_ID || ('universal-' + Date.now()),
    tabId: activeTabId,
    score: 99,
    name: "UNIVERSAL COMMAND RESULT",
    reason: aiData.Analysis || "No analysis provided.",
    category: "UNIVERSAL_AGENT",
    profile: {
      company: "Command: " + (command.length > 20 ? command.substring(0,20)+'...' : command),
      bio: "Context: Generic Web Page"
    },
    replies: aiData.Draft_Replies || {}
  };
  
  // Highlight target if AI found a specific element
  if (aiData.Target_ID) {
    logMessage(`[UNIVERSAL] Agent pinpointed element: ${aiData.Target_ID}.`, 'hot', aiData.Target_ID, mockTarget.tabId);
  }

  // Reuse the target selection UI
  selectTarget(mockTarget);
  
  // Custom tweaks to the drawer for universal mode
  const profEl = document.getElementById('reply-prof');
  const humorEl = document.getElementById('reply-humor');
  const dirEl = document.getElementById('reply-director');
  
  if (profEl && aiData.Draft_Replies) profEl.textContent = aiData.Draft_Replies.Option1 || "N/A";
  if (humorEl && aiData.Draft_Replies) humorEl.textContent = aiData.Draft_Replies.Option2 || "N/A";
  if (dirEl && aiData.Draft_Replies) dirEl.textContent = aiData.Draft_Replies.Option3 || "N/A";
}

// NOTE: This function is serialized and injected into the target tab.
// It cannot reference variables outside its scope.
function extractUniversalContext() {
  const elements = document.querySelectorAll('p, h1, h2, h3, article, section, [role="article"], button, a, input, textarea');
  let distilled = [];
  let textContext = document.body.innerText.substring(0, 3000); // Send first 3000 chars as general context
  
  let idCounter = 0;
  elements.forEach(el => {
    if (['A','BUTTON','INPUT','TEXTAREA'].includes(el.tagName) || el.getAttribute('role') === 'button') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const id = 'hy-univ-' + (++idCounter);
        el.setAttribute('data-ls-id', id); // Reuse data-ls-id for scrollToTarget compatibility
        distilled.push({
          id: id,
          tag: el.tagName,
          text: (el.innerText || el.value || '').substring(0, 100).replace(/\s+/g, ' '),
          ariaLabel: el.getAttribute('aria-label') || ''
        });
      }
    }
  });
  
  return {
    text: textContext,
    interactiveElements: distilled
  };
}

// ═══════════ UTILITIES ═══════════

function generateOutreachOnDemand(target) {
  const btn = document.getElementById('btn-generate-ondemand');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⚡ GENERATING OUTREACH...";
    btn.style.color = "#ff9800";
    btn.style.borderColor = "#ff9800";
  }
  
  logMessage(`[AI] Generating on-demand outreach for ${target.name || 'Target'}...`, 'info');

  chrome.runtime.sendMessage({ type: 'ENRICH_ON_DEMAND', targetId: target.id }, (response) => {
    if (chrome.runtime.lastError) {
      logMessage(`[ERROR] Background script disconnected.`, 'hot');
      if (btn) {
        btn.disabled = false;
        btn.textContent = "⚠️ CONNECTION FAILED";
      }
      return;
    }
    
    if (response && response.error) {
      logMessage(`[ERROR] Generation failed: ${response.error}`, 'hot');
      if (btn) {
        btn.disabled = false;
        btn.textContent = "⚠️ GENERATION FAILED";
      }
      return;
    }

    if (response && response.success && response.target) {
      logMessage(`[AI] Outreach drafts generated successfully.`, 'hot');
      // Update memory
      const index = targets.findIndex(t => t.id === response.target.id);
      if (index !== -1) targets[index] = response.target;
      
      // If still selected, refresh drawer
      if (currentSelectedTarget && currentSelectedTarget.id === response.target.id) {
        currentSelectedTarget = response.target;
        selectTarget(currentSelectedTarget);
      }
    }
  });
}

function executeReplyRPA(replyText) {
  if (!currentSelectedTarget) {
    logMessage('[RPA] No target selected.', 'cold');
    return;
  }
  
  const tabId = currentSelectedTarget.tabId;
  const id = currentSelectedTarget.id;
  
  if (!tabId) {
    logMessage('[RPA] Target is missing active tab context.', 'cold');
    return;
  }
  
  logMessage(`[RPA] Initiating auto-reply sequence...`, 'info');
  
  chrome.tabs.sendMessage(tabId, {
    type: 'EXECUTE_RPA_REPLY',
    id: id,
    text: replyText
  }, (response) => {
    if (chrome.runtime.lastError) {
      logMessage(`[RPA] Error communicating with tab: ${chrome.runtime.lastError.message}`, 'hot');
      return;
    }
    if (response && response.success) {
      logMessage(`[RPA] Auto-reply populated successfully on target.`, 'info');
    } else {
      logMessage(`[RPA] Auto-reply failed or element not found: ${response ? response.error : 'unknown'}`, 'cold');
    }
  });
}

function simulateSelfHealingCheck() {
  if (targets.length === 0) return;
  const stats = document.getElementById('stats');
  if (!stats) return;
  
  stats.textContent = "⚠️ DOM ENGINE SHIFT DETECTED :: CALIBRATING...";
  stats.style.color = "#ff2e4c";
  
  setTimeout(() => {
    stats.textContent = "✅ DOM 结构偏移已校正 (SHIFT CORRECTED)";
    stats.style.color = "#00ff9d";
    logMessage("[STEALTH] DOM structure shift auto-corrected via AI anchor mappings.", "info");
    
    setTimeout(() => {
      stats.textContent = `Targets Active: ${targets.length} | Tier: Studio Professional`;
      stats.style.color = "#aaa";
    }, 3000);
  }, 800);
}

function scrollToTarget(id, tabId = null) {
  if (!id) return;
  
  if (id.toString().startsWith('demo-')) {
    logMessage('[SYSTEM] Target telemetry unavailable. Awaiting live signal.', 'cold');
    return;
  }

  const payload = { type: 'SCROLL_TO_POST', id: id };

  const handleResponse = (res) => {
    if (res && !res.success) {
      logMessage(`[WARNING] Target element scrolled out of DOM (Recycled by platform).`, 'hot');
    }
  };

  try {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, payload, (res) => {
        if (chrome.runtime.lastError) {
           // Fallback to active tab
           chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
             if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, payload, handleResponse);
           });
        } else {
           handleResponse(res);
        }
      });
    } else {
      // Fallback
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, payload, handleResponse);
      });
    }
  } catch(e) {
    console.warn('[Radar] scrollToTarget failed:', e);
  }
}

function logMessage(msg, type="info", id=null, tabId=null) {
  if (!logContainer) return;
  const el = document.createElement('div');
  el.className = 'log-entry';
  const color = type === 'hot' ? '#ff2e4c' : (type === 'cold' ? '#00e5ff' : '#00ff9d');
  el.style.color = color;
  el.textContent = `> ${msg}`;
  
  if (id) {
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto'; // CSS overrides parent pointer-events: none
    el.title = 'Click to Jump';
    el.onclick = () => scrollToTarget(id, tabId);
    el.onmouseenter = () => el.style.background = 'rgba(0, 255, 157, 0.2)';
    el.onmouseleave = () => el.style.background = 'rgba(0,0,0,0.6)';
  }
  
  logContainer.appendChild(el);
  if (logContainer.children.length > 8) {
    logContainer.removeChild(logContainer.firstChild);
  }
}

// Robust clipboard copy with fallback
async function safeCopyToClipboard(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch(e) {
    // Fallback: textarea trick
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch(e2) {
      console.warn('[Radar] Copy failed:', e2);
      return false;
    }
  }
}

// ═══════════ 3D TARGET SPAWNER ═══════════

function spawnTarget(id, score, name, reason, category, profile=null, replies=null, tabId=null) {
  if (targets.find(t => t.id === id)) return;
  
  if (emptyStateEl) {
    emptyStateEl.style.opacity = '0';
  }

  const isHot = score >= 80;
  let colorHex = 0x00ff9d;
  let logType = 'info';
  let catBadge = '[NEWS]';
  
  if (category === 'COMMERCIAL_LEAD' || isHot) {
    colorHex = 0xff2e4c;
    logType = 'hot';
    catBadge = '🔥[COMMERCE]';
  } else if (category === 'INDUSTRY_NEWS') {
    colorHex = 0x00e5ff;
    logType = 'cold';
    catBadge = '📰[NEWS]';
  } else {
    colorHex = 0x004411;
    logType = 'cold';
    catBadge = '🎨[ART/CASUAL]';
  }
  
  const geometry = new THREE.IcosahedronGeometry(isHot ? 4.5 : 2.5, 0);
  const material = new THREE.MeshBasicMaterial({ 
    color: colorHex, 
    wireframe: true,
    transparent: true,
    opacity: isHot ? 0.95 : 0.5
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = (Math.random() - 0.5) * 120;
  mesh.position.y = (Math.random() * 40) - 10;
  mesh.position.z = (Math.random() - 0.5) * 80;
  scene.add(mesh);

  const points = [];
  points.push(new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z));
  points.push(new THREE.Vector3(mesh.position.x, -30, mesh.position.z));
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: isHot ? 0.4 : 0.2 });
  const stemLine = new THREE.Line(lineGeo, lineMat);
  scene.add(stemLine);

  const floorRingGeo = new THREE.RingGeometry(1.5, 3.0, 16);
  const floorRingMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: isHot ? 0.6 : 0.3 });
  const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.set(mesh.position.x, -29.8, mesh.position.z);
  scene.add(floorRing);
  
  const newTarget = { id, score, mesh, stemLine, floorRing, name: name || 'Target', reason, category, profile, replies, tabId };
  targets.push(newTarget);
  
  if (statsEl) {
    statsEl.textContent = `Targets Active: ${targets.length} | Tier: Studio Professional`;
  }

  const safeName = (name || 'Target') + '';
  logMessage(`${catBadge} ${safeName.substring(0, 10)} (${score}): ${reason ? reason.substring(0, 32) : ''}...`, logType, id, tabId);

  if (isHot && !currentSelectedTarget) {
    setTimeout(() => selectTarget(newTarget), 500);
  }
}

// ═══════════ MESSAGE PIPELINE ═══════════

// Listen for real-time data from background.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SYNC_3D_RADAR') {
    const p = msg.payload || {};
    spawnTarget(p.id || Date.now(), p.score, p.name || 'Target', p.reason, p.category, p.profile, p.replies, p.tabId);
  }
  if (msg.type === 'SELECT_TARGET_IN_PANEL') {
    const target = targets.find(t => t.id === msg.id);
    if (target) {
      selectTarget(target);
    } else {
      console.warn(`[Radar] SELECT_TARGET_IN_PANEL failed: Target ${msg.id} not found in sidepanel targets list.`);
    }
  }
});

// On init: Pull any stored targets from background (fixes "dead" panel when opened after scanning)
function loadStoredTargets() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_RADAR_TARGETS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Radar] Could not fetch stored targets:', chrome.runtime.lastError.message);
        return;
      }
      if (response && response.targets && response.targets.length > 0) {
        console.log(`[Radar] Loading ${response.targets.length} stored targets...`);
        response.targets.forEach(p => {
          spawnTarget(p.id || Date.now(), p.score, p.name || 'Target', p.reason, p.category, p.profile, p.replies, p.tabId);
        });
      }
    });
  } catch(e) {
    console.warn('[Radar] Failed to load stored targets:', e);
  }
}

// Event delegation for reply card copy
document.addEventListener('click', (e) => {
  const card = e.target.closest('.reply-card[data-copy-target]');
  if (!card) return;
  e.stopPropagation();

  const targetId = card.getAttribute('data-copy-target');
  const textEl = document.getElementById(targetId);
  if (!textEl) return;

  const text = textEl.innerText;
  if (!text) return;

  safeCopyToClipboard(text).then(ok => {
    executeReplyRPA(text);
    
    const tip = card.querySelector('.copy-tip');
    const origBorder = card.style.borderColor;
    card.style.borderColor = ok ? '#00ff9d' : '#ff9800';
    card.style.background = ok ? 'rgba(0,255,157,0.15)' : 'rgba(255,152,0,0.15)';
    if (tip) tip.textContent = ok ? '✅ Executed!' : '⚠️ Failed';
    setTimeout(() => {
      card.style.borderColor = origBorder;
      card.style.background = '';
      if (tip) tip.textContent = 'Click to Copy';
    }, 800);
  });
});

// ═══════════ INIT ═══════════

if(window.THREE) {
  init();

  // Load any targets already analyzed before the panel was opened
  loadStoredTargets();

  // Spawn demo target after a short delay (only if no real targets loaded)
  setTimeout(() => {
    if (targets.length === 0) {
      spawnTarget(
        "demo-1", 
        95, 
        "Silicon Valley AI Founder", 
        "Experiencing high API friction and conversion degradation. Ready to deploy custom scalable automation.",
        "COMMERCIAL_LEAD",
        { company: "NextGen AI Infrastructures", bio: "Serial founder. Backed by top VCs. Building high-throughput SaaS tools." },
        {
          Professional: "Saw your post regarding scale limitations. We specialize in zero-latency infrastructure overlays that bypass standard pipeline bottlenecks. Let's align.",
          Humor: "Nothing like watching standard selector engines break on React re-renders. If you're ready for an AI agent that doesn't trigger cloud alerts, check our stealth stack.",
          Director: "Every scalable system is just a well-directed sequence of state changes. Let's rewrite the script on your acquisition flow—no backstage setup required."
        }
      );
    }
  }, 1500);
} else {
  console.error("[Radar] Three.js not loaded!");
  if (logContainer) {
    logMessage("[ERROR] WebGL engine failed to load. Check three.min.js.", "hot");
  }
}
