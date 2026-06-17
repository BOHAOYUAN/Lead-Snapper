# LeadSnapper V2.0 User Manual

**Author:** Bohao Yuan (HY Digital Studio)  
**Website:** [bohaoyuan.github.io/Lead-Snapper](https://bohaoyuan.github.io/Lead-Snapper/)

---

## 0. A Quick Note

Hey, I'm Bohao, the developer of LeadSnapper.

I built this extension for a very simple reason: **I was sick and tired of manually scrolling through Twitter and LinkedIn every single day to find B2B clients**. My hands were about to fall off, and my efficiency was garbage.

So I thought, why not let AI do the heavy lifting for me? That's how LeadSnapper was born.

In V2.0, we have evolved from a pure browser extension into a **24/7 AI Sales Employee** system. By adding a lightweight local desktop host, we now support local SQLite databases, Excel auto-exports, push notifications directly to your phone (Bark/Telegram), and a pocket-sized PWA Mobile Remote control dashboard.

This isn't some corporate product from a massive company; it's just a tool built by me, a solo developer. **The code is transparent, and your data is stored entirely on your own machine. I can never touch it.** If you trust me, use it. If you don't, feel free to audit the code.

Here's how to install and use it. I'll keep it as straightforward as possible.

---

## 1. What You Get After Purchase

Once your payment is successful, you will receive a ZIP release archive: `LeadSnapper_V2_Release.zip`

Unzip it, and you'll find:

- `desktop_controller.exe` — Standalone, console-free local desktop background host.
- `register.bat` — Registry script launcher to connect the Chrome extension to your local agent.
- `register_native.ps1` — PowerShell native registration script helper.
- `com.hyb.leadsnapper.json` — Chrome/Edge native messaging configuration file.
- `How-to-Install.html` — An offline installation guide (designed to look quite nice).
- `LeadSnapper-Documentation.md` — This user manual.
- `LeadSnapper_Secure.zip` — Obfuscated browser extension package.

**100% private, local-first architecture. No remote tracking, zero subscriptions.**

---

## 2. Installation Steps (Step-by-Step)

### STEP 01: Extract the Package
Extract the downloaded zip archive (`LeadSnapper_V2_Release.zip`) to a safe, persistent folder on your computer, e.g. `Documents/LeadSnapper`.

### STEP 02: Register the Desktop Host
Double-click **`register.bat`** in the extracted directory. This automatically registers the local messaging host in the Windows Registry (HKCU) for Chrome and Edge browsers.
*Note: This security moat is necessary to let your browser extension communicate securely with the local background host (`desktop_controller.exe`).*

### STEP 03: Open Extension Manager
1. Open Chrome or Edge browser.
2. In the address bar, type `chrome://extensions/` (or `edge://extensions/` for Edge) and press Enter.
3. Toggle **"Developer mode"** in the top-right corner.

### STEP 04: Load the Extension
1. Unzip the `LeadSnapper_Secure.zip` package locally.
2. Click **"Load unpacked"** in the top-left of the extensions page.
3. Select the extracted extension folder (the one containing `manifest.json`).
4. Pin **LeadSnapper** to your browser toolbar.

---

## 3. Privacy & Security (Your Biggest Concern)

**In short: Your data is yours. I can never touch it.**

- Your accounts, API keys, captured leads, history... everything is stored directly in your browser's local client storage (`chrome.storage.local`) and your local SQLite database at `~/.leadsnapper/leads.db`. Nothing is uploaded to my servers.
- During AI scans, your data is sent directly from your browser to DeepSeek or OpenAI. It does not go through any intermediate server of mine.
- You bring your own API key (BYOK). You pay DeepSeek or OpenAI directly for what you use. I don't charge any markup.

**No hidden fees, no data leaks, no middleman.**

---

## 4. First-Time Setup: Activation & Configuration

Click the LeadSnapper icon in your toolbar to open the Control Center.

### A. Activate Your License Key

You'll receive a License Key in your email after purchase (processed via Dodo Payments).

- Paste your License Key in the "License & Model" card.
- Click the "Initialize System" button.
- The Control Center will automatically display your tier: 
  - **LTD Starter ($199)**
  - **LTD Pro ($388)**
  - **LTD Enterprise ($588)**
- *Demo Bypass Keys:* You can use bypass keys for offline testing:
  - `LS-BYPASS-BASIC` unlocks **Starter** tier.
  - `LS-BYPASS-PRO` unlocks **Pro** tier.
  - `LS-BYPASS-ENTERPRISE` unlocks **Enterprise** tier.

### B. Configure Your API Key (DeepSeek or OpenAI)

LeadSnapper is optimized for **DeepSeek-V3** by default, but it is compatible with any OpenAI-compatible API.

- Paste your API key (obtained from the DeepSeek or OpenAI console) into the API Key input field.
- Click the "Test" button to run a diagnostic test.
- When you see "Test Passed", you're good to go!

**Advanced Options (No need to touch these unless you want to):**
- Base URL: Defaults to `https://api.deepseek.com/chat/completions`
- Model: Defaults to `deepseek-chat`. You can also change it to `gpt-4o` or `gpt-4o-mini`.

---

## 5. Define Your Target Customer Profile

Want the AI to know who to look for and how to write the responses? Fill out these fields:

**Target Customers & Pain Points**  
> Example: B2B SaaS founders struggling with high customer churn who are actively searching for growth tools...

**Your Value Proposition**  
> Example: LeadSnapper — A local-first B2B social intent tracker that automatically detects prospects and generates outreach replies...

**RAG Case Studies (Business Cases)**
> E.g. `[Case 1: Lead Gen] We find verified email addresses with 98% delivery rates.`
> The local RAG engine parses these brackets and dynamically matches the best case study to inject into the AI drafts.

**AI Outreach Style** (Choose one):
- 💻 **Geek:** Highly technical, detailed, and analytical.
- 🤝 **Warm:** Consultative, friendly, and approachable.
- 👔 **Executive:** ROI-focused, brief, and highly professional.

---

## 6. Run Modes

### 1. AUTO-HUNTER Mode (Standard Mode)

Just browse your social feeds normally. LeadSnapper works in the background to scan every post you scroll past, determining if the author shows active buying intent.
*Best for:* When you are browsing social media yourself and want an AI "copilot" to highlight high-potential prospects on the fly.

### 2. AUTO-PILOT Mode (PRO & Enterprise Tier Only)

Semi-automated mode. The AI automatically analyzes intent, shows evaluation results, and drafts outreach replies for you.
*Safety Mechanisms:*
- Simulates human typing speeds and random delays to minimize anti-scraping risks.
- Only handles copying drafts or typing them into the inputs; **you must click "Send" yourself** to pass anti-bot limits.
- If something goes wrong, click the red 🛑 **Emergency Stop** button. AUTO-PILOT will halt immediately and trigger a 30-minute cooling period.

---

## 7. Filtering Rules & Safety Limits

Adjust these in the "Filters & Limits" card:

**Auto-Fill Score Threshold (70–95)**  
> Only posts scoring above this threshold will be flagged as "High Intent Leads". **Recommended: 85**.

**Local Keyword Blacklist**  
> Enter words you want to ignore, separated by commas (e.g. `crypto, giveaway`).

**Daily Draft Limits:**
- **Starter Tier ($199):** Up to 50 drafts per day.
- **Pro Tier ($388) & Enterprise ($588):** Unlimited daily drafts (the UI displays "Unlimited").

---

## 8. 3D Radar Sidebar (Core Workspace)

Click the "OPEN 3D RADAR" button in the Control Center to open a sleek sidebar.

- **3D Radar Grid**: Each qualified lead is represented by a floating particle. Higher intent scores mean larger and more visible pulses. Click a particle to inspect.
- **Stealth Dashboard**: Displays real-time anti-fingerprinting metrics (canvas noise fingerprint rotation, residential IP status, etc.).
- **Live Console Logs**: Scrolls DOM scanning status, parsing details, and native webhook logs.
- **Universal Command Line**: Type natural language commands like `"Extract profile info"` or `"Draft custom reply"`, then click EXECUTE.

---

## 9. Local Desktop Agent & PWA Mobile Remote

In V2.0, you can control your sales pipeline while away from your PC.

### A. Turn on Native Connection
In the "Desktop Native Controller" card inside the popup panel:
1. Turn on the **Enable Native Connection** switch.
2. The Connection Status badge will turn green showing **CONNECTED** once it establishes communication with the running `desktop_controller.exe`.

### B. Mobile PWA Remote Control
1. Ensure `desktop_controller.exe` is running in your PC background.
2. Open your iPhone or Android browser, and navigate to your PC's local network IP address at port 8088 (e.g., `http://192.168.1.100:8088`).
3. Tap the browser share/option button and click **"Add to Home Screen"** to install the PWA Mobile Remote.
4. You can now remotely monitor active leads, inspect intent scores, copy generated AI replies, and sync to CRM.

### C. Push Notifications (Bark & Telegram)
Receive alerts on your phone the instant a hot lead (intent score ≥80) is captured:
- **Bark App (iOS):** Download Bark from the iOS App Store, copy your device key, and paste it into the **Bark Key** input.
- **Telegram Bot:** Create a bot via `@BotFather`, get your Bot Token, find your chat ID via `@userinfobot`, and fill out the fields.

---

## 10. CRM Sync (Webhook)

Export lead dossiers to Airtable, HubSpot, Notion, or custom workflows built via Make.com, Zapier, or n8n.

**How to set up:**
- Paste your webhook URL into the "Cloud CRM Sync" input field.
- Toggle "Auto Push" on to automatically sync hot leads upon detection.

---

## 11. Pro Anti-Ban Tips (Learned the Hard Way)

Even though LeadSnapper simulates human typing speeds, platform algorithms are strict. **Here are the rules to protect your accounts:**

1. **Never use automated clickers to send messages**  
   LeadSnapper only writes drafts and types them; clicking the final "Send" button is up to you. This is your best defense against automated detection.
2. **Manage your daily limits**  
   - X (Twitter): No more than 50 DMs/replies per day.  
   - LinkedIn: No more than 30 per day.
3. **For multi-profile operations, use anti-detect browsers**  
   Browsers like AdsPower or Multilogin, combined with high-quality residential proxies, are essential if you are scaling up.
4. **Verify if you are shadowbanned**  
   Open an Incognito window, log out of your social accounts, and check if your replies are visible to public users.

---

## 📬 Contact & Support

- **Merchant of Record:** Dodo Payments → support@dodopayments.com
- **Technical Support:** Bohao Yuan / HY Digital Studio → hy@hydigital.studio
- **Website:** [bohaoyuan.github.io/Lead-Snapper](https://bohaoyuan.github.io/Lead-Snapper/)

Go lock in some clients, and don't get your accounts banned!

—— Bohao
