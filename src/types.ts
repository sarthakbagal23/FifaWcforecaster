export type Team = {
  id: string;
  name: string;
  flag: string;
};

export type Player = {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  x: number; // 0-100 for x coordinate on pitch
  y: number; // 0-100 for y coordinate on pitch
};

export type MatchLineups = {
  teamA: Player[];
  teamB: Player[];
};

export type Match = {
  id: string;
  teamA: Team;
  teamB: Team;
  date: string;
  time: string;
  stage: string;
  scoreA?: number;
  scoreB?: number;
  status: 'upcoming' | 'live' | 'finished';
  userPrediction?: {
    scoreA: number;
    scoreB: number;
  };
  // Richer AI prediction fields from the improved /api/predict endpoint
  aiPrediction?: string;           // Full tactical analysis text
  aiScoreA?: number;               // AI predicted score for teamA
  aiScoreB?: number;               // AI predicted score for teamB
  aiKeyBattle?: string;            // e.g. "Bellingham vs Modrić in midfield"
  aiXGProjection?: string;         // e.g. "xG: England 1.7 — Croatia 0.9"
  aiConfidence?: 'high' | 'medium' | 'low';
  isAiLoading?: boolean;
  lineups?: MatchLineups;
};

export type GroupTeamStats = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export type Group = {
  name: string;
  teams: GroupTeamStats[];
};

// New type for the /api/win-probability response
export type WinProbabilityEntry = {
  team: string;
  flag: string;
  prob: number;
  trend: 'up' | 'down' | 'stable';
};

export type WinProbabilityResult = {
  probabilities: WinProbabilityEntry[];
  methodology: string;
  fieldProb: number;
};
