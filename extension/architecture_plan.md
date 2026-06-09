# LeadSniper Architecture & Execution Plan

## Phase 1: The Command Center (Popup UI & Logic)
**Goal:** Create a secure and visually impactful config interface.

1. **`popup.html`**: A sleek, dark-mode/cyberpunk styled popup.
   - Requires an input field for `OpenAI API Key` (type="password").
   - Requires a textarea for `Target Niche & Pain Point`. (e.g., "SaaS Founders struggling with churn").
   - A "Lock in Target" (Save) button.
2. **`popup.js`**: 
   - Uses `chrome.storage.local` to securely save and load the configuration.
3. **`manifest.json`**: Update to include the `"action": {"default_popup": "popup.html"}` field.

## Phase 2: The Neural Link (Background Service Worker)
**Goal:** Act as the secure bridge to OpenAI, avoiding CORS and UI-thread blockages.

1. **`background.js`**:
   - Register a `chrome.runtime.onMessage.addListener`.
   - When a message is received from `content.js` containing text, retrieve the API Key and Niche from `chrome.storage.local`.
   - Construct the prompt and execute a `fetch` POST request to `https://api.openai.com/v1/chat/completions`.
   - Must demand a JSON response (`response_format: { type: "json_object" }`).
   - Send the AI's response back to `content.js`.
2. **`manifest.json`**: Update to include `"background": { "service_worker": "background.js" }`.

## Phase 3: The Visual Execution (Content Script Upgrade)
**Goal:** Feed data to the neural link and execute the visual highlighting.

1. **`content.js` (Update)**:
   - Within the existing `MutationObserver`, when tagging a post as `pending`:
     - Extract its text content (removing standard UI noise like "Share", "Reply").
     - Send the text via `chrome.runtime.sendMessage` to `background.js`.
   - Await the response.
   - If `Confidence_Score > 80`:
     - Change the internal state/tag to `analyzed_hot`.
     - Inject a distinct UI element (e.g., a glowing red border and a floating div displaying the `Pain_Point_Analysis`).
   - If the score is low:
     - Change the state to `analyzed_cold` and dim the post slightly using CSS opacity (reducing noise for the user).
