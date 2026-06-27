import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Groq } from "groq-sdk";
import https from "https";

// Helper to make https requests to football-data.org
function fetchFootballData(pathStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path: pathStr,
      method: 'GET',
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/matches", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY) {
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    }
    try {
      const data = await fetchFootballData('/v4/competitions/WC/matches');
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch matches." });
    }
  });

  app.get("/api/standings", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY) {
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    }
    try {
      const data = await fetchFootballData('/v4/competitions/WC/standings');
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch standings." });
    }
  });

  app.get("/api/scorers", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY) {
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    }
    try {
      const data = await fetchFootballData('/v4/competitions/WC/scorers');
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch scorers." });
    }
  });

  // AI Prediction Route
  app.post("/api/predict", async (req, res) => {
    try {
      const { teamA, teamB, stage } = req.body;
      
      if (!teamA || !teamB) {
        return res.status(400).json({ error: "Missing teams" });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "GROQ_API_KEY is missing. Please configure it in your AI Studio Secrets panel." });
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const prompt = `You are an elite soccer (football) data scientist and tactical analyst for a premium sports broadcasting network.
We have a match between ${teamA} and ${teamB} in the ${stage || 'World Cup'}. 
Provide a high-quality, punchy, 3-sentence prediction of how the match will go. 
You MUST return your response as a valid JSON object with the following structure:
{
  "scoreA": number, // your predicted score for ${teamA}
  "scoreB": number, // your predicted score for ${teamB}
  "analysis": "Your 3-sentence tactical analysis text here."
}
Incorporate references to Expected Goals (xG), pressing intensity, or specific tactical setups. Your tone should be decisive and authoritative.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" }
      });

      let predictionData = { scoreA: 0, scoreB: 0, analysis: "Prediction unavailable." };
      try {
        predictionData = JSON.parse(response.choices[0]?.message?.content || "{}");
      } catch (e) {
        console.error("Failed to parse prediction JSON", e);
      }

      res.json(predictionData);
    } catch (error: any) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // AI Tactical Chat Route
  app.post("/api/tactical-chat", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "GROQ_API_KEY is missing." });
      }

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const systemPrompt = `You are a world-class soccer tactical AI assistant, providing data-driven insights. 
Use this current tournament context:
${context}

Answer the user's query with a highly analytical response. Focus on tactics, Expected Goals (xG), momentum, pressing traps, and formations. Keep your answer under 150 words. Do not use filler words, be direct and authoritative.`;

      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
      });

      res.json({ reply: response.choices[0]?.message?.content || "Response unavailable." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Chat failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
