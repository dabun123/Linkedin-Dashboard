const express = require("express");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const router = express.Router();
const CACHE_PATH = path.join(__dirname, "../data/analysis_cache.json");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/analyze  { connections: [...] }
router.post("/", async (req, res) => {
  try {
    const { connections, forceRefresh } = req.body;

    if (!connections || connections.length === 0) {
      return res.status(400).json({ error: "No connections provided" });
    }

    // Mock mode - check FIRST, before cache
    if (req.query.mock === "true") {
      const mockAnalysis = {
        clusters: [
          { id: "healthcare", label: "Healthcare & Medicine", color: "#E91E63", count: 3, percentage: 20, description: "Doctors, nurses, medical professionals", topCompanies: ["Hospital", "Clinic"] },
          { id: "tech", label: "Technology & Engineering", color: "#378ADD", count: 5, percentage: 33, description: "Software engineers, developers, IT", topCompanies: ["Google", "Microsoft", "IBM", "Meta", "Stripe"] },
          { id: "education", label: "Education & Research", color: "#4CAF50", count: 2, percentage: 13, description: "Teachers, professors, researchers", topCompanies: ["McGill University", "University"] },
          { id: "finance", label: "Finance & Banking", color: "#FFC107", count: 2, percentage: 13, description: "Analysts, accountants, bankers", topCompanies: ["RBC", "TD Bank", "KPMG"] },
          { id: "sales", label: "Sales & Marketing", color: "#9C27B0", count: 3, percentage: 20, description: "Sales reps, marketers, BD", topCompanies: ["Consulting Agency"] },
        ],
        likes: [
          { tag: "Technology", confidence: 85, reason: "Strong tech representation" },
          { tag: "Healthcare", confidence: 70, reason: "Good healthcare connections" },
        ],
        dislikes: [
          { tag: "Government", confidence: 60, reason: "Few government connections" },
        ],
        insights: [
          "Your network is tech-heavy with diverse other industries",
          "Good mix of healthcare and finance professionals",
        ],
        topConnectors: [],
        connectionMap: {
          "John Smith": "tech",
          "Jane Doe": "tech",
          "Bob Wilson": "education",
          "Alice Brown": "finance",
          "Charlie Davis": "healthcare",
          "Diana Lee": "tech",
          "Eve Martinez": "finance",
          "Frank Chen": "education",
          "Grace Kim": "tech",
          "Henry Liu": "healthcare",
          "Ivy Patel": "tech",
          "Jack Thompson": "finance",
          "Kate Wong": "education",
          "Leo Garcia": "tech",
          "Mia Johnson": "sales",
        },
        totalConnections: connections.length,
        connectionNames: connections.map(c => c.name),
        analyzedAt: new Date().toISOString(),
      };
      return res.json(mockAnalysis);
    }

    // Serve from cache unless forceRefresh is true
    if (!forceRefresh && fs.existsSync(CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
      // Check if cached data is for the same connections by comparing first few names
      const cachedNames = cached.connectionNames?.slice(0, 5) || [];
      const currentNames = connections.slice(0, 5).map(c => c.name);
      const namesMatch = JSON.stringify(cachedNames) === JSON.stringify(currentNames);
      
      if (namesMatch) {
        return res.json({ ...cached, fromCache: true });
      }
    }

    // Build a compact summary for the LLM (avoid sending too many tokens)
    const sample = connections.slice(0, 200); // cap at 200
    const connectionSummary = sample
      .map((c) => `${c.name} | ${c.position || "unknown"} | ${c.company || "unknown"}`)
      .join("\n");

    const prompt = `You are analyzing a professional's LinkedIn connections to surface insights about their network.

Here are their connections (Name | Position | Company):
${connectionSummary}

Total connections: ${connections.length}
${connections.length > 200 ? `(Showing first 200 of ${connections.length} for analysis)` : ""}

Analyze this network and return ONLY a JSON object (no markdown, no extra text) with this exact shape:

{
  "clusters": [
    {
      "id": "engineering",
      "label": "Engineering & Dev",
      "color": "#378ADD",
      "count": 134,
      "percentage": 27,
      "description": "Software engineers, architects, and technical leads",
      "topCompanies": ["Stripe", "Google", "Meta"],
      "affinityScore": 85
    }
  ],
  "likes": [
    { "tag": "Open source", "confidence": 92, "reason": "Many connections at GitHub, OSS companies" }
  ],
  "dislikes": [
    { "tag": "Finance / Banking", "confidence": 78, "reason": "Very few connections in traditional finance" }
  ],
  "insights": [
    "Your network is heavily weighted toward early-stage tech",
    "Strong representation from AI/ML companies suggests interest in that space"
  ],
  "topConnectors": [
    { "name": "Alex Chen", "company": "Stripe", "position": "Senior Software Engineer", "reason": "Works at highly connected company" }
  ]
}

Rules:
- Clusters should be meaningful professional categories (5-8 clusters max)
- Count fields should add up to roughly the total connections provided
- Likes/dislikes are inferred from density — lots of connections in a space = like, very few = dislike
- Confidence is 0-100
- Also return a "connectionMap" object that maps each connection name to their cluster id
- Return ONLY the JSON object, nothing else`;

    const message = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
    let raw = message.choices[0].message.content.trim();
    let analysis;

    // Try multiple approaches to extract valid JSON
    try {
      // Try markdown code block
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        analysis = JSON.parse(raw);
      }
    } catch (e1) {
      try {
        // Try to find JSON object in the text
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          analysis = JSON.parse(match[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (e2) {
        throw new Error(`Invalid JSON from AI: ${raw.substring(0, 150)}`);
      }
    }
   
    const result = {
      ...analysis,
      totalConnections: connections.length,
      connectionNames: connections.map(c => c.name),
      analyzedAt: new Date().toISOString(),
    };

    // Cache to disk
    fs.writeFileSync(CACHE_PATH, JSON.stringify(result, null, 2));

    res.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    // Extract clean error message - handle Groq 429 errors that have nested JSON in message
    let errorMessage = err.message;
    try {
      // If error message looks like "429 {...}", try to parse it
      if (errorMessage.includes('{') && errorMessage.includes('"error"')) {
        const parsed = JSON.parse(errorMessage.substring(errorMessage.indexOf('{')));
        errorMessage = parsed.error?.message || errorMessage;
      }
    } catch (parseErr) {
      // Keep original message if parsing fails
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/analyze/cache  — return cached result if it exists
router.get("/cache", (req, res) => {
  if (fs.existsSync(CACHE_PATH)) {
    return res.json(JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")));
  }
  res.status(404).json({ error: "No cached analysis" });
});

module.exports = router;
