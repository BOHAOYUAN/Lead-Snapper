# LeadSnapper User Manual

**Author:** Bohao Yuan (HY Digital Studio)  
**Website:** [bohaoyuan.github.io/Lead-Snapper](https://bohaoyuan.github.io/Lead-Snapper/)

---

## 0. A Quick Note

Hey, I'm Bohao, the developer of LeadSnapper.

I built this extension for a very simple reason: **I was sick and tired of manually scrolling through Twitter and LinkedIn every single day to find B2B clients**. My hands were about to fall off, and my efficiency was garbage.

So I thought, why not let AI do the heavy lifting for me? That's how LeadSnapper was born.

This isn't some corporate product from a massive company; it's just a tool built by me, a solo developer. **The code is transparent, and your data is stored entirely on your own machine. I can't touch it.** If you trust me, use it. If you don't, feel free to audit the code.

Here's how to install and use it. I'll keep it as straightforward as possible.

---

## 1. What You Get After Purchase

Once your payment is successful, you will receive a ZIP archive: `LeadSnapper_Secure.zip`

Unzip it, and you'll find:

- `LeadSnapper/` folder — The full source code of the extension (manifest, background scripts, 3D panel, styling)
- `How-to-Install.html` — An offline installation guide (designed to look quite nice)

No hidden `.exe` files, no background installers, no remote tracking. **It is a pure browser extension.**

---

## 2. Installation Steps (Step-by-Step)

### Chrome Browser

1. Extract `LeadSnapper_Secure.zip` to a safe place, like `Documents/LeadSnapper`
2. Type `chrome://extensions/` in your browser address bar and press Enter
3. Enable **"Developer mode"** in the top-right corner
4. Click **"Load unpacked"** in the top-left corner
5. Select the `LeadSnapper/` folder you just extracted (the one containing `manifest.json`)
6. Once installed, click the puzzle icon in the top-right of your browser and pin LeadSnapper to your toolbar

### Edge Browser

The steps are virtually identical:

1. Extract the package locally
2. Type `edge://extensions/` in your address bar
3. Turn on "Developer mode" on the left sidebar
4. Click "Load unpacked"
5. Select the `LeadSnapper/` folder
6. Click the eye icon next to the address bar to pin the extension

---

## 3. Privacy & Security (Your Biggest Concern)

**In short: Your data is yours. I can never touch it.**

- Your accounts, API keys, captured leads, history... everything is stored directly in your browser's local client storage (`chrome.storage.local`). Nothing is uploaded to my servers.
- During AI scans, your data is sent directly from your browser to DeepSeek or OpenAI. It does not go through any intermediate server of mine.
- You bring your own API key. You pay DeepSeek or OpenAI directly for what you use. I don't charge any markup.

**No hidden fees, no data leaks, no middleman.**

---

## 4. First-Time Setup: Activation & Configuration

Click the LeadSnapper icon in your toolbar to open the Control Center.

### A. Activate Your License Key

You'll receive a License Key in your email after purchase (processed via Dodo Payments).

- Paste your License Key in the "License & Model" card
- Click the "Activate" button
- The Control Center will automatically display your tier: LTD Basic ($199) or LTD Pro ($588)

### B. Configure Your API Key (DeepSeek or OpenAI)

LeadSnapper is optimized for **DeepSeek-V3** by default, but it is compatible with any OpenAI-compatible API.

- Paste your API key (obtained from the DeepSeek or OpenAI console) into the API Key input field
- Click the "Test" button to run a diagnostic test
- When you see "Test Passed", you're good to go!

**Advanced Options (No need to touch these unless you want to):**
- Base URL: Defaults to `https://api.deepseek.com/chat/completions`
- Model: Defaults to `deepseek-chat`. You can also change it to `gpt-4o` or `gpt-4o-mini`.

---

## 5. Define Your Target Customer Profile

Want the AI to know who to look for and how to write the responses? Fill out these three fields:

**Target Customers & Pain Points**  
> Example: B2B SaaS founders struggling with high customer churn who are actively searching for growth tools...

**Your Value Proposition**  
> Example: LeadSnapper — A local-first B2B social intent tracker that automatically detects prospects and generates outreach replies...

**AI Outreach Style** (Choose one):
- 💻 **Geek:** Highly technical, detailed, and analytical.
- 🤝 **Warm:** Consultative, friendly, and approachable.
- 👔 **Executive:** ROI-focused, brief, and highly professional.

---

## 6. Two Run Modes

### 1. AUTO-HUNTER Mode (Standard Mode)

**How to use:** Just browse your social feeds normally. LeadSnapper works in the background to scan every post you scroll past, determining if the author shows active buying intent.

**Best for:** When you are browsing social media yourself and want an AI "copilot" to highlight high-potential prospects on the fly.

### 2. AUTO-PILOT Mode (PRO Tier Only)

**How to use:** Semi-automated mode. The AI automatically analyzes intent, shows evaluation results, and drafts outreach replies for you.

**A quick disclaimer pops up when you enable this for the first time:** AI-generated replies are only drafts. You must review and edit them before sending. **The tool will never automatically click the "Send" button.**

**Safety Mechanisms:**
- Simulates human typing speeds and random delays to minimize anti-scraping risks.
- Only handles copying drafts or typing them into the inputs; **you must click "Send" yourself**.
- If something goes wrong, click the red 🛑 **Emergency Stop** button. AUTO-PILOT will halt immediately and trigger a 30-minute cooling period.

---

## 7. Filtering Rules & Safety Limits

Adjust these in the "Filters & Limits" card:

**Auto-Fill Score Threshold (70–95)**  
> Only posts scoring above this threshold will be flagged as "High Intent Leads".  
> **Recommended: 85**. Setting it below 80 might scrape irrelevant posts and increase account flags.

**Local Keyword Blacklist**  
> Enter words you want to ignore, separated by commas. E.g., `crypto, airdrop, giveaway`  
> Any posts containing these keywords will be skipped automatically.

**Daily Draft Limits:**
- Basic Tier ($199): Up to 15 drafts per day. A red warning banner will suggest upgrading when reached.
- Pro Tier ($588): Unlimited drafts.

> ⚠️ Sending more than 50 messages/replies a day on Twitter/X or 30 on LinkedIn can easily get your account flagged as a bot. Keep it natural and spread them out.

---

## 8. 3D Radar Sidebar (Core Workspace)

Click the "OPEN 3D RADAR" button in the Control Center to open a sleek sidebar.

### What's inside the interface:

- **3D Radar Grid**: Each qualified lead is represented by a floating particle. Higher intent scores mean larger and more visible pulses. Click a particle to inspect.
- **Stealth Dashboard**: Displays real-time anti-fingerprinting metrics (canvas noise status, browser fingerprint rotation, residential IP status, etc.).
- **Live Console Logs**: Scrolls raw execution steps (DOM scanning status, parsing details, webhook response logs).
- **Universal Command Line**: Type natural language commands like `"Extract profile info"` or `"Draft custom reply"`, then click EXECUTE.

### Inspecting a Lead (Slides out a detail panel on the right):

- **Intent Score** (0–100)
- **Qualification Reason**: Why the AI qualified this post (e.g., "Decision-maker explicitly complains about high churn and seeks automation tools").
- **Company, Job Title, & Bio**
- **3 AI Outreach Drafts** (Professional, Humor, Executive)
- **Action Buttons**:
  - Click a draft → Copy to clipboard.
  - ⚡ **DIRECT SNIPE** → Copies the professional draft and automatically injects it into the active input box on the page.
  - **SYNC TO CRM** → Manually push this lead's dossier to your CRM.

---

## 9. CRM Sync (Webhook)

Export lead dossiers to Airtable, HubSpot, Notion, or custom workflows built via Make.com, Zapier, or n8n.

**How to set up:**

- Paste your webhook URL into the "Cloud CRM Sync" input field.
- Example: `https://api.yourcrm.com/webhook` or `https://hook.us1.make.com/xxxx`
- Toggle the "Auto Push" switch on to automatically sync hot leads upon detection. If toggled off, you'll need to manually click "SYNC TO CRM".

**Export JSON Payload Format:**

```json
{
  "source": "LeadSnapper_V3_Radar",
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
    "Professional": "Hey John, sorry to hear about the churn increase. If you are looking to automate CS pipelines without complex dashboards, LeadSnapper fits that description perfectly. Glad to give you a walk-through.",
    "Humor": "Hey John, pricing changes and 15% churn—nothing like manual account saving to start the day. If you want a quick shortcut to automate customer success before you lose your mind, let's chat.",
    "Director": "I saw your note on Acme SaaS and pricing friction. I've worked with B2B founders who automated this exact problem away in a week. Happy to show you how."
  }
}
```

---

## 10. Pro Anti-Ban Tips (Learned the Hard Way)

Even though LeadSnapper simulates human typing speeds, platform algorithms are strict. **Here are the rules I live by to protect my accounts:**

1. **Never use automated clickers to send messages**  
   LeadSnapper only writes drafts and types them; clicking the final "Send" button is up to you. This is your best defense against automated detection.

2. **Manage your daily limits**  
   - X (Twitter): No more than 50 DMs/replies per day.  
   - LinkedIn: No more than 30 per day.

3. **For multi-profile operations, use anti-detect browsers**  
   Browsers like AdsPower or Multilogin, combined with high-quality residential proxies, are essential if you are scaling up.

4. **Verify if you are shadowbanned**  
   Open an Incognito window, log out of your social accounts, and check if your replies are visible to public users.  
   If they are invisible, you went too fast. Slow down and let the account rest for a few days.

---

## 📬 Contact & Support

- **Merchant of Record:** Dodo Payments → support@dodopayments.com
- **Technical Support:** Bohao Yuan / HY Digital Studio → hy@hydigital.studio
- **Website:** [bohaoyuan.github.io/Lead-Snapper](https://bohaoyuan.github.io/Lead-Snapper/)

Send me an email if you run into any issues. I'll get back to you personally.

---

Go lock in some clients, and don't get your accounts banned!

—— Bohao
