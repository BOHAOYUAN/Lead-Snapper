# LeadSniper 3.0 — B2B Social Intent Radar
## Official Setup, Fulfillment & User Manual

Welcome to **LeadSniper 3.0**, the premium browser-native B2B social intent tracking tool. 

LeadSniper functions as a secure, local-first human-AI co-pilot. It scans your active social media feeds (X/Twitter, LinkedIn, Reddit, and Hacker News) in real-time, qualifies B2B pain points using an intelligent local semantic scorer, and generates customized outreach drafts—all while maintaining 100% privacy by storing your credentials locally (BYOK - Bring Your Own Key).

This manual guides you through unzipping, installing, configuring, and executing LeadSniper. Use this document as your onboarding fulfillment guide.

---

## 1. 📦 Delivery Package Contents

When you purchase a license, you receive a secure package: `LeadSniper_Secure.zip`. Extracting this package reveals:
1. **`LeadSniper/` Extension Folder**: The core extension code directory containing the Chrome manifest, background scripts, 3D WebGL sidepanel assets, and styles.
2. **`How-to-Install.html`**: A visually stunning, bilingual, offline guide designed to walk you through loading the unpacked folder.

---

## 2. 📥 Step-by-Step Installation

LeadSniper is loaded directly via your browser's Developer Mode. This client-side loading method guarantees that no hidden executable binaries, installers, or remote trackers are run on your operating system.

### Chrome Browser
1. **Unzip the Package**: Extract `LeadSniper_Secure.zip` into a dedicated folder on your local drive (e.g., `Documents/LeadSniper`).
2. **Open Extensions Manager**: In Chrome, type the following path in the URL address bar and press Enter:
   ```txt
   chrome://extensions/
   ```
3. **Enable Developer Mode**: Turn **ON** the "Developer mode" switch in the top-right corner.
4. **Load Unpacked**: Click the **Load unpacked** button in the top-left corner.
5. **Select Folder**: Choose the extracted `LeadSniper/` folder (the parent folder containing `manifest.json`).
6. **Pin to Toolbar**: Click the puzzle piece icon next to your profile picture in Chrome and pin **LeadSniper** to your browser toolbar.

### Microsoft Edge Browser
1. **Unzip the Package**: Extract `LeadSniper_Secure.zip` to your local drive.
2. **Open Extensions Manager**: Enter the following in Edge's URL bar and press Enter:
   ```txt
   edge://extensions/
   ```
3. **Enable Developer Mode**: In the left sidebar, turn **ON** the "Developer mode" switch.
4. **Load Unpacked**: Click the **Load unpacked** button on the top menu.
5. **Select Folder**: Select the unzipped `LeadSniper/` folder.
6. **Pin to Toolbar**: Click the extensions eye-icon next to the address bar and ensure LeadSniper is pinned.

---

## 3. 🛡️ Bring Your Own Key (BYOK) & Privacy Policy

LeadSniper operates with a strict **local-first architecture**:
* **Zero Third-Party Databases**: Your credentials, leads, history, and system settings are saved exclusively in your browser's secure client storage (`chrome.storage.local`).
* **Direct AI Connection**: Scans connect directly to your chosen AI vendor's endpoint. There are no intermediary proxy servers. Your data belongs to you.
* **Cost Efficiency**: By using your own API keys, you pay raw API rates directly to the vendor (e.g., DeepSeek-V3 tokens cost a fraction of a cent per scan), avoiding SaaS markups.

---

## 4. ⚙️ Initial Configuration & Activation

To configure the extension, click the LeadSniper icon in your browser toolbar to open the **Control Center popup**.

### A. License Key Activation
Upon purchase from Dodo Payments, you will receive a secure license key via email.
1. Locate the **Authorization & Model** card in the popup.
2. Paste your **License Key** in the dedicated field.
3. Click the **BUY** button to activate (if not yet purchased, click to buy immediately).
4. The popup will automatically update to reflect your license tier: **LTD Basic ($199)** or **LTD Pro ($588)**.

### B. Connecting DeepSeek or OpenAI API Key
LeadSniper works out of the box with any OpenAI-compatible API, and is highly optimized for **DeepSeek-V3**.
1. Paste your API key (e.g., from DeepSeek or OpenAI) into the **API Key** input box.
2. Click **Test** to run a diagnostic connectivity scan.
3. The toast message will show **Test Passed** or return a detailed error.

*Optional Overrides (Advanced Configurations Panel)*:
* **Base URL (Endpoint)**: Defaults to `https://api.deepseek.com/chat/completions`.
* **Model**: Defaults to `deepseek-chat`. You can override this to `gpt-4o`, `gpt-4o-mini`, or any custom API model.

---

## 5. 🎯 Custom Profiling & Niche Targeting

To guide the Lead Qualification Scorer and ensure the AI drafts customized replies, fill out your target profile settings:

1. **Target Niche & Pain Point**: Explain who you are targetting and what they are struggling with.
   * *Example*: `B2B SaaS founders struggling with customer churn, seeking growth tools...`
2. **Your Value Proposition**: Define how your product solves this pain point.
   * *Example*: `LeadSniper: A browser-native B2B social intent tracking tool that captures leads and generates auto-replies...`
3. **AI Reply Style**: Select your outreach tone tag:
   * 💻 **Geek**: Tech-heavy, detail-oriented.
   * 🤝 **Warm**: Approachable, consultative, relation-focused.
   * 👔 **Executive**: Direct, ROI-focused, professional.

---

## 6. 🛰️ Operating Modes

Toggle your desired scanning mode in the **Running Mode** panel:

### 1. AUTO-HUNTER Mode (Scroll Bot)
* **How it works**: Simply scroll through your social media feeds. LeadSniper acts as a background agent, capturing every post you scroll past, parsing the DOM, and evaluating high-intent buyer signals.
* **Use Case**: Passive lead gathering. Perfect for manually reading your feed while letting AI identify and flag qualified targets.

### 2. AUTO-PILOT Mode (Pro Tier Only)
* **How it works**: A semi-autonomous co-pilot mode that automatically qualifications leads, displays intent details, and prepares responses.
* **Disclaimer Dialog**: Upon activation, you must accept the **Legal Liability Agreement**. Since replies are drafts drafted by AI, you must manually review all drafts before sending.
* **Safety Protocols**: LeadSniper simulates human keyboard typing behaviors and path delays to avoid trigger anti-bot protections. It will copy the draft or auto-type it but **never clicks "Send" automatically**. The human co-pilot retains 100% final validation and clicking control.
* **Emergency SCRAM Button**: If the bot behaves unexpectedly or you need to halt operations immediately, click the red **🛑 Emergency SCRAM** button. This instantly terminates Auto-Pilot and enforces a **30-minute system cooldown** lock.

---

## 7. 🔍 Filters, Thresholds & Safety Limits

Adjust the parameters under the **Filters & Limits** card to manage system safety:

* **Auto-Fill Score Threshold (70-95)**: Sets the minimum qualification score required to flag a lead as high intent (recommended: `85`).
  * ⚠️ *Low Threshold Warning*: Setting the threshold below `80` matches too many irrelevant posts, significantly increasing browser activity and account risk.
* **Local Keyword Blacklist**: Enter comma-separated keywords (e.g., `crypto, airdrop, giveaway`) to immediately skip and ignore posts containing spam.
* **Max Drafts / Day**:
  * **Basic LTD ($199)** is capped at **15 drafts/day**. Once reached, a red warning banner will prompt you to upgrade.
  * **Pro LTD ($588)** unlocks unlimited drafts.
  * ⚠️ *High-Volume Warning*: If you configure a limit exceeding `50 drafts/day`, a warning banner appears. Operating above 50 outreach actions per day increases account flagging risks on platforms like LinkedIn and X. We recommend spacing out activity.

---

## 8. 📊 Immersive 3D Radar Sidepanel

Click the **OPEN 3D RADAR** button in the Control Center to reveal the custom sidebar workspace.

### Core Interface
* **3D WebGL Canvas**: A responsive, concentric visual radar grid powered by Three.js. Each detected intent signal is plotted as a floating 3D particle node.
* **Dynamic Node Scale**: Particles pulse and scale in real-time based on their intent score. Click a node to pick it.
* **Stealth Dashboard Indicator**: Displays real-time spoofing metrics (e.g., *Spoofing Canvas noise*, *Rotating fingerprints*, *Residential IP status*).
* **Live System Logs**: A scrolling console outputting raw execution steps (e.g., DOM scans, webhook status).
* **Universal Command CLI**: Type natural language commands directly into the CLI input (e.g., `"Extract profile info"`, `"Draft custom reply"`) and click **EXECUTE**.

### Target Detail Drawer
When you click a node or trigger a post scan, the sidebar detail drawer slides open:
1. **Intent Qualification Score**: Shows the calculated B2B buyer rating (0-100).
2. **Strategic Reasoning**: Explains exactly *why* the post qualified or was rejected (e.g., "Buyer expresses active churn pain").
3. **Enriched Corporate Parameters**: Displays company name, bio, and authority profile details.
4. **Outreach Variant Drafts**: Displays 3 distinct AI-generated reply pitches (Highly Professional, Cold Humor, or Storytelling).
5. **Action Buttons**:
   * **Click a Draft Card**: Copies the specific draft to your clipboard.
   * **⚡ DIRECT SNIPE**: Copies the primary professional draft to your clipboard and auto-populates the reply box on the page.
   * **SYNC TO CRM**: Instantly pushes lead parameters to your configured CRM webhook.

---

## 9. 🔌 Cloud CRM Integration (Webhook)

LeadSniper supports exporting lead dossiers directly to your CRM pipelines (such as Airtable, HubSpot, Notion, or custom databases via automation tools like Make.com, Zapier, or n8n).

### Setup
1. Paste your automation or CRM endpoint URL in the **Cloud CRM Synchronization** input field.
   * *Example*: `https://api.yourcrm.com/webhook` or your custom `https://hook.us1.make.com/xxxx` endpoint.
2. Toggle **Auto** to automatically push qualified leads to your webhook. Or, keep it unchecked to push manually via the **SYNC TO CRM** button in the 3D Radar.

### Webhook JSON Payload Schema
When a lead is pushed, LeadSniper sends a secure HTTP `POST` request with the following JSON format:

```json
{
  "source": "LeadSniper_V3_Radar",
  "timestamp": "2026-06-09T18:27:14.000Z",
  "target_name": "John Doe",
  "intent_score": 92,
  "category": "COMMERCIAL_LEAD",
  "analysis_reason": "Decision-maker complaining about high customer churn and manual workflows, seeking an automation tool.",
  "profile_data": {
    "company": "Acme SaaS Inc.",
    "bio": "Founder of Acme SaaS. Ex-YCombinator. Building future-proof B2B software."
  },
  "outreach_drafts": {
    "Professional": "Hey John, sorry to hear about the churn increase. If you are looking to automate CS pipelines without complex dashboards, LeadSniper fits that description perfectly. Glad to give you a walk-through.",
    "Humor": "Hey John, pricing changes and 15% churn—nothing like manual account saving to start the day. If you want a quick shortcut to automate customer success before you lose your mind, let's chat.",
    "Director": "I saw your note on Acme SaaS and pricing friction. I've worked with B2B founders who automated this exact problem away in a week. Happy to show you how."
  }
}
```

---

## 10. ⚠️ Anti-Ban Safety Tips & Best Practices

Although LeadSniper uses human typist simulation, browser platform rules are strict. Follow these rules to protect your accounts:

1. **Avoid Auto-Sending Tools**: Never connect third-party macros that click "Send" for you. Always use LeadSniper's human co-pilot verification method.
2. **Limit Daily Outreach Volume**: Keep your daily drafts below `50` on X, and below `30` on LinkedIn.
3. **Use Anti-Fingerprint Browsers**: For heavy-duty operations or managing multiple outreach profiles, load LeadSniper inside anti-fingerprint browsers (like **AdsPower** or **Multilogin**) and use high-quality residential proxies.
4. **Shadowban Checks**: Regularly check your social profile replies inside an Incognito browser window. If you cannot see your replies while logged out, you may have been shadowbanned due to high activity. Reduce your quota and increase random delays.

---

## 📬 Support & Merchant Contacts
* **Merchant of Record**: Dodo Payments (support@dodopayments.com)
* **Technical Support**: Bohaoyuan, HY Digital Studio ([hy@hydigital.studio](mailto:hy@hydigital.studio))
* **Official Website**: [bohaoyuan.github.io/LeadSniper](https://bohaoyuan.github.io/LeadSniper/)
