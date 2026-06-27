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
  aiPrediction?: string;
  aiScoreA?: number;
  aiScoreB?: number;
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
