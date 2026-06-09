const API_KEY = 'sk-7d97a68e6967406db9ecf35fa986313a';
const API_URL = 'https://api.deepseek.com/chat/completions';

async function testIntentEngine() {
  console.log("🚀 Testing Intent Engine...");
  
  const niche = "B2B SaaS founders struggling with customer churn, seeking automation or growth tools... maybe they want to build something but lack dev resources, feeling lost in the weeds.";
  const postText = "Man, this whole month has been a disaster. We launched our new pricing tier but churn went up by 15%. I'm spending all my time manually trying to save accounts instead of building the product. Anyone know a good way to automate customer success before I lose my mind? Not looking for another dashboard, just need it done.";

  const prompt = `You are a cold-blooded B2B Lead Analyzer. 
Target Niche: "${niche}".

CRITICAL DISTINCTION:
- "COMMERCIAL_LEAD" (80-100): Author is a BUSINESS OWNER/DECISION MAKER seeking a solution, better tool, or complaining about service quality. Calculate a precise 0-100 Deal Closing Potential Score based on dynamic urgency and explicit pain points.
- "INDUSTRY_NEWS" (40-79): Industry analysis, education, or peer-sharing.
- "CASUAL_ART" (0-39): Personal rants, art, job-seeking, or financial distress.

LETHAL RULES:
1. NO SELLERS/AFFILIATES: If the author RECOMMENDS a tool, praises a specific service, or shares a link (e.g., "X keeps conversions real"), ASSUME THEY ARE SELLING IT. Buyers complain, Sellers recommend. Score 0-20, Category MUST be INDUSTRY_NEWS or CASUAL_ART.
2. NO THOUGHT LEADERS: If the author is PREACHING, giving advice, acting like an expert (e.g., "Here is why your SaaS fails", "Most founders do X wrong"), they are a CONSULTANT/SELLER. They are selling their expertise, NOT buying tools. Score 0-30, Category MUST be INDUSTRY_NEWS.
3. NO JOBSEEKERS: If the author is looking for a role, Score 0-15.
4. NO PHILOSOPHERS: If the author asks rhetorical questions ("Are you feeling the pressure of this shift? I want to hear..."), it's engagement-bait. Score 0-20.

Output ONLY valid JSON:
{
  "Confidence_Score": 0-100, 
  "Category": "COMMERCIAL_LEAD" | "INDUSTRY_NEWS" | "CASUAL_ART",
  "Pain_Point_Analysis": "Detail why they have budget/potential vs why they are just looking for a job or promo."
}`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.3,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: postText }
        ]
      })
    });
    
    if (!res.ok) {
        console.error("API Error", res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log("🎯 Raw Data:", data.choices[0].message.content);
    
    // Test Enrich
    const enrichPrompt = `You are a tactical B2B infiltrator and master outreach scriptwriter. 
Post: "${postText}"
Profile Bio: "Building NextGen tools. Ex-FAANG."
Company Info: "Acme SaaS"

Provide a deep commercial intent analysis. Output ONLY TRUE JSON:
{
  "Intelligence_Summary": "1-sentence clear tactical intel on how to approach.",
  "Replies": {
    "Professional": "An extremely professional, value-driven reply.",
    "Humor": "A witty cold humor reply to break the pattern.",
    "Director": "A director-mindset reply framed as storytelling/visionary angle."
  }
}`;
    
    const res2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.3,
        messages: [
          { role: 'system', content: enrichPrompt },
          { role: 'user', content: "Enrich Target" }
        ]
      })
    });

    const data2 = await res2.json();
    console.log("🧬 Enrich Data:", data2.choices[0].message.content);

  } catch(e) {
    console.error(e);
  }
}

testIntentEngine();
