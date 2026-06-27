import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Groq } from "groq-sdk";
import https from "https";

// ---------------------------------------------------------------------------
// WORLD CUP 2026 — COMPREHENSIVE ANALYST BRIEFING
// This is injected into every AI prompt so the model has rich real-world
// context instead of relying solely on generic training knowledge.
// ---------------------------------------------------------------------------
const WC_2026_CONTEXT = `
## FIFA WORLD CUP 2026 — ANALYST BRIEFING

**Format:** 48 teams, 12 groups of 4. Top 2 from each group + 8 best 3rd-place finishers
advance to the Round of 32. Then R32 → R16 → QF → SF → 3rd-place play-off → Final.
**Hosts:** USA (11 venues), Mexico (3 venues), Canada (2 venues).
**Key Venues:** MetLife Stadium NJ (Final, 82k), AT&T Stadium Dallas, SoFi Stadium LA,
Lincoln Financial Field Philadelphia, NRG Stadium Houston, Estadio Azteca Mexico City,
BMO Field Toronto, BC Place Vancouver.
**Final:** MetLife Stadium, East Rutherford NJ — July 19, 2026.

---

## TEAM PROFILES — TOP CONTENDERS

### 🇦🇷 ARGENTINA | FIFA Rank #1 | Reigning World Champions (2022)
Manager: Lionel Scaloni. Formation: 4-3-3 → 4-4-2 in defensive shape.
Key Players:
  - Lionel Messi (SS/CF, Inter Miami) — deepens into pockets, world's best dead-ball
  - Julián Álvarez (CF, Atlético Madrid) — relentless pressing, clinical finishing
  - Alexis Mac Allister (CM, Liverpool) — engine of the press, box-to-box quality
  - Rodrigo De Paul (CM) — press catalyst, 10-km-per-game engine
  - Emiliano Martínez (GK) — elite shot-stopper, penalty-save specialist (WC 2022 hero)
  - Nicolás Otamendi + Lisandro Martínez (CB) — aerial threat at set pieces
Strengths: Compact defensive block, Messi's late runs into pockets unlocking low blocks,
  Álvarez's explosive pressing traps, lethal on corners (Otamendi/L. Martínez aerial duels).
Weakness: Messi fatigue management over a 7-game format; right-back depth below elite level;
  can be exposed on right side when Messi tucks inside.
xG Profile: Typically generate 1.4–2.1 xG per 90 in tournament football. Set pieces add ~0.3.
WC History: 3 titles (1978, 1986, 2022). Runners-up 2014. QF 2010, 2006.

### 🇫🇷 FRANCE | FIFA Rank #2
Manager: Didier Deschamps. Formation: 4-3-3 → 4-5-1 mid-block.
Key Players:
  - Kylian Mbappé (CF, Real Madrid) — fastest attacker in the world, 1v1 specialist
  - Antoine Griezmann (SS) — elite off-ball runner, 46 international goals, spatial intelligence
  - Aurélien Tchouaméni (DM, Real Madrid) — press trigger, elite progressive passer
  - William Saliba (CB, Arsenal) — ball-playing center-back, best recovery runner in squad
  - Mike Maignan (GK, AC Milan) — elite shot-stopper, sweeper-keeper
  - Marcus Thuram (CF, Inter) — physical hold-up, depth option
Strengths: Best forward in the world in Mbappé; devastating on counter at pace;
  world-class depth at every position; Griezmann's work-rate presses top defensive lines.
Weakness: Can be passive in possession; Mbappé's defensive contribution inconsistent;
  occasional right-side defensive gap when Mbappé stays high.
xG Profile: Generate 1.8–2.6 xG per 90 when pressing high; 1.2–1.6 in mid-block.
WC History: 2 titles (1998, 2018). Runners-up 2006, 2022. QF 2014.

### 🇪🇸 SPAIN | FIFA Rank #3 | Euro 2024 Champions
Manager: Luis de la Fuente. Formation: 4-3-3 / 4-2-3-1 positional.
Key Players:
  - Lamine Yamal (RW, Barcelona) — born 2007, Euro 2024 winner aged 17; direct, 1v1 elite
  - Pedri (CM, Barcelona) — elite third-man combinations, best under-pressure receiver
  - Rodri (DM, Man City) — 2024 Ballon d'Or, elite press-breaker, 10km+ per 90
  - Álvaro Morata (ST) — pressing leader, hold-up play, aerial threat
  - Dani Carvajal (RB, Real Madrid) — overlapping runs, delivery quality
  - Unai Simón (GK, Athletic) — commanding sweeper-keeper
Strengths: Best positional unit in world football; PPDA typically 6–8 (elite pressing);
  Yamal-Pedri-Rodri triangle generates high-quality chances; incredible squad depth.
Weakness: Morata can go cold in front of goal; Rodri fatigue after long season;
  can be caught on counter when committing Carvajal high.
xG Profile: Dominate possession (60–68%); generate 1.6–2.4 xG per 90.
WC History: 1 title (2010). 0 titles since. Euro 2008, 2012, 2024.

### 🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENGLAND | FIFA Rank #4
Manager: Gareth Southgate. Formation: 4-2-3-1 / 3-4-3.
Key Players:
  - Jude Bellingham (AM, Real Madrid) — box-to-box, late runs, Champions League winner
  - Harry Kane (ST, Bayern Munich) — all-time England scorer, elite link-up and finishing
  - Phil Foden (LW/AM, Man City) — creative, presses intelligently, elite in small spaces
  - Bukayo Saka (RW, Arsenal) — direct, draws fouls, delivery quality
  - Declan Rice (DM, Arsenal) — elite ball-winner, progressive passer, set-piece delivery
  - Jordan Pickford (GK) — commanding, penalty specialist
Strengths: Incredible squad depth; Bellingham's late box entries hard to track;
  Rice–Bellingham double pivot elite in transition; Kane's movement creates pockets for Foden.
  Best set-piece delivery + aerial combination in the tournament.
Weakness: History of underperforming in knockout stages under pressure
  (lost Euro 2021 + 2024 finals); Southgate's conservative tendencies at key moments.
xG Profile: 1.6–2.2 xG per 90. Set pieces contribute 0.4+ per game.
WC History: 1 title (1966). SF 2018. Final Euro 2024.

### 🇧🇷 BRAZIL | FIFA Rank #5
Manager: Carlo Ancelotti. Formation: 4-2-3-1 / 4-3-3 high-press.
Key Players:
  - Vinicius Jr (LW, Real Madrid) — Champions League winner, elite dribbler, direct
  - Rodrygo (RW, Real Madrid) — clinical inside-right runs, Champions League pedigree
  - Bruno Guimarães (DM, Newcastle) — elite ball-winner, progressive, physical
  - Marquinhos (CB, PSG) — captain, aerial dominance, leader in defensive shape
  - Alisson (GK, Liverpool) — widely regarded as world's best goalkeeper
  - Raphinha (AM, Barcelona) — set-piece delivery, pressing work rate
Strengths: Explosive wide play through Vinicius; world-class goalkeeping;
  Ancelotti's man-management of elite egos; strong defensive structure in 4-2 block.
Weakness: Historical WC psychological fragility (1982, 1994 pens, 2014 Mineirazo, 2022 pens);
  midfield creativity depth weaker without Neymar; can be passive against physical opponents.
xG Profile: 1.8–2.5 xG per 90 when pressing; rely heavily on wide overloads.
WC History: 5 titles (1958, 1962, 1970, 1994, 2002). Last won 24 years ago.

### 🇵🇹 PORTUGAL | FIFA Rank #6
Manager: Roberto Martínez. Formation: 4-3-3 / 4-2-3-1.
Key Players:
  - Cristiano Ronaldo (ST, Al-Nassr) — likely final World Cup; still a set-piece/penalty threat
  - Bruno Fernandes (AM, Man United) — creative hub, direct, excellent range of passing
  - Bernardo Silva (AM, Man City) — elite technical dribbler, presses intelligently
  - Rúben Dias (CB, Man City) — elite positional defender, leader
  - Rafael Leão (LW, AC Milan) — devastating pace on the left
  - Diogo Costa (GK, Porto) — elite shot-stopper, sweeper-keeper
Strengths: Goalscoring depth beyond Ronaldo now; solid defensive structure;
  Bernardo Silva's creativity in tight spaces; Leão's pace on break.
Weakness: Over-reliance on Ronaldo's positioning in build-up disrupts spacing;
  historically struggle to control games against top-4 sides.
xG Profile: 1.4–2.0 xG per 90. Heavy reliance on wide areas and Fernandes long-shots.
WC History: 0 titles. Best: 3rd place 1966, SF 2006. QF 2022 (lost to Morocco).

### 🇳🇱 NETHERLANDS | FIFA Rank #7
Manager: Ronald Koeman. Formation: 4-3-3 / 5-3-2 defensive.
Key Players:
  - Virgil van Dijk (CB, Liverpool) — elite aerial defender, dominant presence
  - Cody Gakpo (LW, Liverpool) — direct, clinical, dangerous on left channel
  - Tijjani Reijnders (CM, AC Milan) — dynamic box-to-box, elite transition speed
  - Xavi Simons (CM, PSG) — creative, progressive, builds from deep
  - Memphis Depay (ST) — experienced, penalty threat
  - Bart Verbruggen (GK) — commanding shot-stopper
Strengths: Defensive solidity via Van Dijk; rapid transition through midfield;
  aerial dominance at both ends; deep squad options.
Weakness: Can be disjointed in complex build-up patterns; Frenkie de Jong fitness concerns;
  relies heavily on Van Dijk being available.
xG Profile: 1.3–1.9 xG per 90. Strength in counter-attack transitions (high xG quality).
WC History: Runners-up 1974, 1978, 2010. SF 2014.

### 🇩🇪 GERMANY | FIFA Rank #12
Manager: Julian Nagelsmann. Formation: 4-2-3-1 / 4-3-3 press.
Key Players:
  - Jamal Musiala (AM, Bayern) — elite technical dribbler, press-resistant, creative
  - Florian Wirtz (AM, Bayer Leverkusen) — creative genius, key passes, direct runs
  - Joshua Kimmich (DM/RB) — elite ball-winner, press trigger, set-piece delivery
  - Kai Havertz (CF, Arsenal) — intelligent movement, aerial ability, links well
  - Nico Schlotterbeck (CB) — aggressive, progressive from deep
  - Manuel Neuer (GK) — sweeper-keeper, voice of experience
Strengths: World-class young talent (Musiala + Wirtz duo is elite); gegenpressing intensity;
  deep squad options; Kimmich's leadership and range of play.
Weakness: Defensive consistency (exited 2022 in groups); transitional exposure when pressing;
  Neuer age concerns.
xG Profile: 1.7–2.4 xG per 90 when pressing effectively. High xG variance match-to-match.
WC History: 4 titles (1954, 1974, 1990, 2014). Eliminated in group 2018, R16 2022.

### 🇲🇦 MOROCCO | FIFA Rank #14
Manager: Walid Regragui. Formation: 5-3-2 / 4-3-3 defensive block.
Key Players:
  - Achraf Hakimi (RB/RWB, PSG) — elite overlapping threat, delivery quality
  - Hakim Ziyech (AM, Galatasaray) — creative, long-range shooting, unpredictable
  - Youssef En-Nesyri (ST, Fenerbahçe) — aerial threat, clinical on limited chances
  - Sofyan Amrabat (DM, Fiorentina) — elite physical midfielder, press-breaking
  - Bono (GK, Sevilla) — elite shot-stopper, penalty specialist
Strengths: Best organized defense in 2022 WC (only 1 goal conceded in 6 games);
  elite set-piece defending; devastating on counter through Hakimi; African/Arab pride factor.
Weakness: Limited creativity against organized defenses; can be overly passive;
  struggle to control possession vs elite sides.
xG Profile: Concede ~0.6–0.9 xG per 90. Generate only 0.8–1.2 xG but are elite in conversion.
WC History: 4th place 2022 — first African/Arab team to reach WC semi-final.

### 🇺🇸 USA (HOST) | FIFA Rank #13
Manager: Gregg Berhalter. Formation: 4-3-3 / 4-2-3-1 high-press.
Key Players:
  - Christian Pulisic (LW/CAM, AC Milan) — captain, most dangerous, direct, strong finisher
  - Tyler Adams (CM, Bournemouth) — elite press-catalyst, physicality, technical ability
  - Gio Reyna (AM, Dortmund) — creative, key passes, injury-risk
  - Ricardo Pepi (ST, PSV) — prolific scorer for club, physical hold-up play
  - Weston McKennie (CM, Juventus) — box-to-box, aerial, engine
  - Matt Turner (GK, Nottingham Forest) — reliable shot-stopper
Strengths: Enormous home crowd advantage (all USA venues sell out);
  physical pressing intensity; Pulisic's quality in key moments; young, hungry squad.
Weakness: Lack of elite tournament experience; can crumble under knockout-stage pressure
  as hosts; squad relies on Pulisic and Reyna both being fit.
xG Profile: 1.3–1.8 xG per 90. Very dependent on set pieces and wide overloads.
WC History: 3rd place 1930; R16 2022 (beat Iran, lost to Netherlands).

### 🇯🇵 JAPAN | FIFA Rank #18
Manager: Hajime Moriyasu. Formation: 4-2-3-1 / intense gegenpressing.
Key Players:
  - Kaoru Mitoma (LW, Brighton) — elite direct dribbler, extremely dangerous 1v1
  - Wataru Endo (DM, Liverpool) — elite ball-winner, reading of the game
  - Takumi Minamino (AM, Monaco) — movement, pressing, technical quality
  - Ritsu Dōan (RW, SC Freiburg) — clinical, set-piece delivery
Strengths: Elite pressing traps that disrupted Germany (4-1) and Spain (2-1) in WC 2022;
  disciplined shape; high work-rate; tactical sophistication and discipline.
Weakness: Physical size disadvantage vs European/CONMEBOL sides;
  struggle to control games vs elite pressing teams; limited squad depth.
WC History: R16 x3 (2002, 2010, 2022). Upset Germany and Spain in 2022 groups.

### 🇭🇷 CROATIA | FIFA Rank #10
Manager: Zlatko Dalić. Formation: 4-3-3 / 4-5-1 defensive.
Key Players:
  - Luka Modrić (CM, Real Madrid) — aging but still elite vision and passing range
  - Mateo Kovačić (CM, Man City) — excellent in small spaces, ball retention
  - Bruno Petković (ST) — aerial, physical hold-up
  - Dominik Livaković (GK) — penalty specialist, elite reflexes
Strengths: Elite midfield organization; Modrić's experience and set-piece delivery;
  Livaković's penalty heroics; resilience in knockout football.
Weakness: Modrić (40) age factor impacts high-press situations; limited forward options.
WC History: Runners-up 2018; 3rd place 1998, 2022.

### 🇨🇴 COLOMBIA | FIFA Rank #11
Manager: Néstor Lorenzo. Formation: 4-2-3-1 / counter-attacking.
Key Players:
  - James Rodríguez (CM) — creative playmaker, set-piece delivery, experience
  - Luis Díaz (LW, Liverpool) — explosive, direct dribbling, Champions League quality
  - Falcao (ST) — experienced target man, clinical inside the box
  - Dávinson Sánchez (CB) — aerial dominance, aggressive defending
Strengths: Luis Díaz's pace and directness causes problems for any back line;
  James's creative range; strong defensive organization.
WC History: QF 2014 (James Golden Boot); R16 2018.

### 🇺🇾 URUGUAY | FIFA Rank #15
Manager: Marcelo Bielsa. Formation: 4-3-3 / physical, direct.
Key Players:
  - Darwin Núñez (ST, Liverpool) — elite pace and physicality, brilliant mover
  - Federico Valverde (CM, Real Madrid) — dynamic box-to-box, goals from deep
  - Rodrigo Bentancur (CM, Spurs) — tenacious ball-winner, progressive
  - José María Giménez (CB) — aerial warrior, aggressive
Strengths: Physical intensity under Bielsa; Darwin Núñez's explosive pace
  destroys deep defensive lines; Valverde is a match-winner from midfield.
WC History: 2 titles (1930, 1950). 4th place 2010.

### 🇳🇬 NIGERIA | FIFA Rank #30
Manager: José Peseiro. Formation: 4-2-3-1 / counter-attacking.
Key Players:
  - Victor Osimhen (ST, Galatasaray) — elite physical striker, top-class aerial
  - Wilfred Ndidi (DM, Leicester) — elite ball-winner, defensive shield
  - Samuel Chukwueze (RW, AC Milan) — direct, quick, dangerous 1v1
Strengths: Osimhen is a genuine world-class center-forward;
  rapid counter-attacking threat; physical intensity.

### 🇸🇳 SENEGAL | FIFA Rank #20
Manager: Aliou Cissé. Formation: 4-2-3-1 / physical, direct.
Key Players:
  - Sadio Mané (ST/LW, Al-Nassr) — veteran leader, clinical, still world-class movement
  - Édouard Mendy (GK, Rennes) — elite shot-stopper
  - Ismaïla Sarr (RW, Marseille) — pace and directness on right flank
Strengths: Mané's big-game experience; physical intensity; organized shape.
WC History: QF 2002; R16 2022.

### 🇲🇽 MEXICO (HOST) | FIFA Rank #16
Formation: 4-3-3 counter-press. Key Players: Santiago Giménez (ST, AC Milan — prolific scorer),
Hirving Lozano (RW), Edson Álvarez (DM, West Ham). Strengths: Fanatical home support
(especially Azteca); Giménez at peak powers; experienced group-stage performers.
Weakness: Notorious 5-consecutive-R16 curse since 1994; struggles beyond group stage.

### 🇨🇦 CANADA (HOST) | FIFA Rank #41
Formation: 4-3-3 physical press. Key Players: Alphonso Davies (LW, Bayern Munich — elite pace
and crossing), Jonathan David (ST, Lille — elite striker, 30+ club goals per season),
Tajon Buchanan (RW, Inter). Strengths: Davies is a genuine world-class threat;
David is among the world's best strikers; home support in Toronto and Vancouver.

---

## TACTICAL METRICS GLOSSARY (reference these naturally in analysis)

xG (Expected Goals): Shot quality probability (0–1 per shot). Match typical range: 0.8–2.5 total.
PPDA (Passes Allowed Per Defensive Action): Pressing intensity. Under 8 = elite press. Over 12 = passive.
Progressive Passes per 90: Forward ball movement. Elite midfielders: 8+.
Aerial Duel Win %: Above 60% = dominant aerial side. Key for set-piece threat.
High Press Regain %: % possession won in opponent's final third. Elite: 25%+.
Counter-attack Speed: Time from regain to shot. Direct teams: 8–12s. Possession teams: 18–25s.
Set-piece Goal %: WC 2022 — ~27% of all goals from set pieces. England/Germany highest converters.

---

## WC 2026 BRACKET NOTE
With 48 teams, the tournament has more rounds than ever. Fatigue management is critical —
teams may play 7 games across 38 days. Squad depth (particularly in full-back positions and
forward depth beyond the first-choice striker) is a tournament differentiator.
`;

// ---------------------------------------------------------------------------
// Helper: HTTPS request to football-data.org
// ---------------------------------------------------------------------------
function fetchFootballData(pathStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.football-data.org",
      path: pathStr,
      method: "GET",
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // -------------------------------------------------------------------------
  // LIVE DATA ENDPOINTS (football-data.org)
  // -------------------------------------------------------------------------
  app.get("/api/matches", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY)
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    try {
      const data = await fetchFootballData("/v4/competitions/WC/matches");
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch matches." });
    }
  });

  app.get("/api/standings", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY)
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    try {
      const data = await fetchFootballData("/v4/competitions/WC/standings");
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch standings." });
    }
  });

  app.get("/api/scorers", async (req, res) => {
    if (!process.env.FOOTBALL_DATA_API_KEY)
      return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY is missing." });
    try {
      const data = await fetchFootballData("/v4/competitions/WC/scorers");
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch scorers." });
    }
  });

  // -------------------------------------------------------------------------
  // AI MATCH PREDICTION  (dramatically improved prompt)
  // -------------------------------------------------------------------------
  app.post("/api/predict", async (req, res) => {
    const { teamA, teamB, stage } = req.body;
    if (!teamA || !teamB)
      return res.status(400).json({ error: "Missing teams" });
    if (!process.env.GROQ_API_KEY)
      return res.status(500).json({ error: "GROQ_API_KEY is missing." });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // IMPROVED PROMPT: rich context + chain-of-thought reasoning + structured JSON
    const prompt = `${WC_2026_CONTEXT}

---

## MATCH ANALYSIS REQUEST

You are the lead tactical analyst for the WC 2026 broadcast team. Analyze:

  **${teamA}** vs **${teamB}**
  Stage / Venue: ${stage || "FIFA World Cup 2026"}

Using the team profiles above and your deep football knowledge, think through this match step by step:

STEP 1 — TACTICAL SETUP: What formation will each team realistically deploy? How do their styles interact?
STEP 2 — KEY POSITIONAL BATTLE: Which single positional or individual matchup is most decisive?
STEP 3 — xG PROJECTION: Given each team's typical threat profile and defensive solidity, what xG range is realistic for each side?
STEP 4 — MOMENTUM & TOURNAMENT CONTEXT: Who has momentum? Is fatigue or squad rotation a factor at this stage?
STEP 5 — PREDICTED SCORE: Based on the above, what is the most likely scoreline?

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "scoreA": <integer — predicted goals for ${teamA}>,
  "scoreB": <integer — predicted goals for ${teamB}>,
  "analysis": "<3–5 sentences of sharp tactical analysis. Name specific players, reference formations (e.g. '4-3-3 vs 4-2-3-1'), mention pressing intensity, xG, or a key tactical dynamic. Authoritative and specific — avoid generic filler.>",
  "keyBattle": "<The single most decisive individual or positional matchup. Example: 'Mbappé (CF) vs Van Dijk (CB) — pace on the left channel is the key duel.' or 'Bellingham's late box runs vs Martínez's holding line'>",
  "xGProjection": "<Example: 'xG: ${teamA} 1.7 — ${teamB} 0.9 | ${teamA} edge in high-press zones'>",
  "confidence": "<'high', 'medium', or 'low' — based on how clear the tactical picture is and how evenly matched the teams are>"
}`;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      let predictionData = {
        scoreA: 0,
        scoreB: 0,
        analysis: "Prediction unavailable.",
        keyBattle: "",
        xGProjection: "",
        confidence: "medium",
      };
      try {
        predictionData = JSON.parse(
          response.choices[0]?.message?.content || "{}"
        );
      } catch (e) {
        console.error("Failed to parse prediction JSON", e);
      }
      res.json(predictionData);
    } catch (error: any) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // -------------------------------------------------------------------------
  // AI TACTICAL CHAT  (dramatically improved system prompt)
  // -------------------------------------------------------------------------
  app.post("/api/tactical-chat", async (req, res) => {
    const { prompt, context, history } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    if (!process.env.GROQ_API_KEY)
      return res.status(500).json({ error: "GROQ_API_KEY is missing." });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // IMPROVED SYSTEM PROMPT: persona + full WC 2026 knowledge base
    const systemPrompt = `You are Alex, the lead tactical analyst for the official 2026 FIFA World Cup broadcast desk. You have encyclopedic knowledge of all 48 squads, their managers, formations, and statistical profiles.

${WC_2026_CONTEXT}

## LIVE TOURNAMENT DATA (latest results from this session):
${context && context.length > 0 ? context : "Tournament is underway — latest results not yet available."}

## YOUR ANALYST PERSONA:
- You think in systems: formations, pressing triggers, positional play, transitions, set pieces
- You use specific metrics naturally: xG, PPDA, progressive passes, aerial win %, PPDA
- You name specific players and their tactical role within their system
- You give decisive opinions with clear reasoning — never hedge with "it could go either way"
- You know every WC 2026 squad deeply: starting XIs, key substitutes, injury concerns
- You reference historical WC results when relevant to make a point

## STRICT RESPONSE RULES:
- Maximum 175 words — be dense and punchy, not padded
- Lead with the direct answer or sharpest insight — never open with "Great question!" or any preamble
- Name specific players and teams — never speak in generalities
- Include at least one specific metric (xG, PPDA, win %, etc.) per response
- If asked about something unrelated to WC 2026 football, briefly note it and redirect
- Write like a Sky Sports or ESPN analyst with 30 seconds to make a sharp point on live TV`;

    // Build message history for multi-turn conversation
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Include prior conversation turns if provided
    if (history && Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        // last 3 exchanges
        if (turn.role === "user")
          messages.push({ role: "user", content: turn.text });
        else if (turn.role === "ai")
          messages.push({ role: "assistant", content: turn.text });
      }
    }
    messages.push({ role: "user", content: prompt });

    try {
      const response = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.75,
        max_tokens: 300,
      });
      res.json({
        reply:
          response.choices[0]?.message?.content || "Response unavailable.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Chat failed" });
    }
  });

  // -------------------------------------------------------------------------
  // AI WIN PROBABILITY  (NEW endpoint — replaces hardcoded Insights data)
  // -------------------------------------------------------------------------
  app.post("/api/win-probability", async (req, res) => {
    if (!process.env.GROQ_API_KEY)
      return res.status(500).json({ error: "GROQ_API_KEY is missing." });

    const { standings, completedMatches } = req.body;

    // Summarize standings for the prompt context
    const standingsSummary =
      standings && standings.length > 0
        ? standings
            .slice(0, 6)
            .map(
              (g: any) =>
                `${g.name}: ${g.teams
                  .slice(0, 2)
                  .map((t: any) => `${t.team.name} (${t.points}pts, GD:${t.gd >= 0 ? "+" : ""}${t.gd})`)
                  .join(", ")}`
            )
            .join(" | ")
        : "Group stage in progress — full standings not yet available.";

    const completedSummary =
      completedMatches && completedMatches.length > 0
        ? completedMatches
            .slice(0, 8)
            .map(
              (m: any) =>
                `${m.teamA} ${m.scoreA}–${m.scoreB} ${m.teamB}`
            )
            .join("; ")
        : "Results not available.";

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `${WC_2026_CONTEXT}

---

## WIN PROBABILITY COMPUTATION

You are running a Monte Carlo tournament simulation for the 2026 FIFA World Cup.

**Current Group Stage Standings:**
${standingsSummary}

**Recent Match Results:**
${completedSummary}

Compute updated tournament win probability estimates for exactly 6 top contenders. Factor in:
- Squad quality and depth relative to this 48-team field
- Current form in the tournament (results above)
- Likely bracket path and potential upcoming opponents
- Historical WC performance patterns and psychological factors
- Home advantage (USA, Mexico, Canada all have meaningful crowd edges)
- Key injury/fitness considerations for top players

Probabilities must sum to approximately 55–70% (the rest goes to the broader field).

Return ONLY valid JSON (no markdown):
{
  "probabilities": [
    { "team": "Country Name", "flag": "🏳️", "prob": 18.5, "trend": "up" },
    ...exactly 6 teams, sorted by prob descending...
  ],
  "methodology": "One sentence summarizing the simulation's key weighting factors.",
  "fieldProb": 32.5
}

Valid trend values: "up", "down", "stable".
Flags: use actual flag emoji (🇫🇷 🇦🇷 🇧🇷 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🇪🇸 🇩🇪 🇵🇹 🇳🇱 🇲🇦 🇺🇸 🇯🇵 🇭🇷 🇨🇴 🇺🇾 🇳🇬).`;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      let result = {
        probabilities: [
          { team: "France", flag: "🇫🇷", prob: 19.2, trend: "stable" },
          { team: "Argentina", flag: "🇦🇷", prob: 17.8, trend: "stable" },
          { team: "Brazil", flag: "🇧🇷", prob: 14.1, trend: "stable" },
          { team: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", prob: 12.4, trend: "stable" },
          { team: "Spain", flag: "🇪🇸", prob: 10.9, trend: "stable" },
          { team: "Germany", flag: "🇩🇪", prob: 7.3, trend: "stable" },
        ],
        methodology: "Based on FIFA rankings, squad depth, and current form.",
        fieldProb: 18.3,
      };
      try {
        result = JSON.parse(response.choices[0]?.message?.content || "{}");
      } catch (e) {
        console.error("Failed to parse win probability JSON", e);
      }
      res.json(result);
    } catch (error) {
      console.error("Win probability error:", error);
      res.status(500).json({ error: "Failed to compute win probabilities" });
    }
  });

  // -------------------------------------------------------------------------
  // Vite / Static serving
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
