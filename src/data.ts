import { Match, Team, Group, Player, MatchLineups } from './types';

const generateLineup = (team: Team, formation: string): Player[] => {
  const players: Player[] = [];
  const [def, mid, fwd] = formation.split('-').map(Number);
  
  // GK
  players.push({ id: `${team.id}-1`, name: 'Goalkeeper', number: 1, position: 'GK', x: 10, y: 50 });
  
  // DEF
  for (let i = 0; i < def; i++) {
    players.push({ id: `${team.id}-d${i}`, name: `Defender ${i+1}`, number: i+2, position: 'DEF', x: 25, y: (100 / (def + 1)) * (i + 1) });
  }
  
  // MID
  for (let i = 0; i < mid; i++) {
    players.push({ id: `${team.id}-m${i}`, name: `Midfielder ${i+1}`, number: i+2+def, position: 'MID', x: 50, y: (100 / (mid + 1)) * (i + 1) });
  }
  
  // FWD
  for (let i = 0; i < fwd; i++) {
    players.push({ id: `${team.id}-f${i}`, name: `Forward ${i+1}`, number: i+2+def+mid, position: 'FWD', x: 75, y: (100 / (fwd + 1)) * (i + 1) });
  }
  
  return players;
};

const t = (id: string, name: string, flag: string): Team => ({ id, name, flag });

export const TEAMS = {
  // Hosts
  mex: t('mex', 'Mexico', '🇲🇽'),
  can: t('can', 'Canada', '🇨🇦'),
  usa: t('usa', 'USA', '🇺🇸'),
  // UEFA
  fra: t('fra', 'France', '🇫🇷'),
  eng: t('eng', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  esp: t('esp', 'Spain', '🇪🇸'),
  ger: t('ger', 'Germany', '🇩🇪'),
  por: t('por', 'Portugal', '🇵🇹'),
  ita: t('ita', 'Italy', '🇮🇹'),
  ned: t('ned', 'Netherlands', '🇳🇱'),
  cro: t('cro', 'Croatia', '🇭🇷'),
  // CONMEBOL
  arg: t('arg', 'Argentina', '🇦🇷'),
  bra: t('bra', 'Brazil', '🇧🇷'),
  col: t('col', 'Colombia', '🇨🇴'),
  uru: t('uru', 'Uruguay', '🇺🇾'),
  // Others (CAF, AFC, CONCACAF)
  jpn: t('jpn', 'Japan', '🇯🇵'),
  sen: t('sen', 'Senegal', '🇸🇳'),
  mar: t('mar', 'Morocco', '🇲🇦'),
  kor: t('kor', 'South Korea', '🇰🇷'),
  aus: t('aus', 'Australia', '🇦🇺'),
  nga: t('nga', 'Nigeria', '🇳🇬'),
  egy: t('egy', 'Egypt', '🇪🇬'),
  ksa: t('ksa', 'Saudi Arabia', '🇸🇦'),
  crc: t('crc', 'Costa Rica', '🇨🇷'),
};

export const GROUPS: Group[] = [
  {
    name: 'Group A (Mexico)',
    teams: [
      { team: TEAMS.mex, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, gd: 1, points: 3 },
      { team: TEAMS.cro, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: TEAMS.sen, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, gd: 0, points: 1 },
      { team: TEAMS.kor, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, gd: -1, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group B (Canada)',
    teams: [
      { team: TEAMS.can, played: 1, won: 1, drawn: 0, lost: 0, gf: 1, ga: 0, gd: 1, points: 3 },
      { team: TEAMS.ger, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.jpn, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.mar, played: 1, won: 0, drawn: 0, lost: 1, gf: 0, ga: 1, gd: -1, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group C',
    teams: [
      { team: TEAMS.fra, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.col, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.aus, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.egy, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group D (USA)',
    teams: [
      { team: TEAMS.usa, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.eng, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.nga, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { team: TEAMS.ksa, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  }
];

export const TOP_SCORERS = [
  { id: 'p1', name: 'K. Mbappé', team: TEAMS.fra, goals: 3, assists: 0, matches: 2 },
  { id: 'p2', name: 'S. Giménez', team: TEAMS.mex, goals: 2, assists: 1, matches: 2 },
  { id: 'p3', name: 'V. Osimhen', team: TEAMS.nga, goals: 2, assists: 0, matches: 1 },
  { id: 'p4', name: 'J. Bellingham', team: TEAMS.eng, goals: 1, assists: 2, matches: 1 },
  { id: 'p5', name: 'L. Messi', team: TEAMS.arg, goals: 1, assists: 1, matches: 1 },
  { id: 'p6', name: 'C. Pulisic', team: TEAMS.usa, goals: 1, assists: 1, matches: 1 },
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    teamA: TEAMS.can,
    teamB: TEAMS.mar,
    date: '2026-06-12',
    time: '72\'',
    stage: 'Group B - BMO Field, Toronto',
    scoreA: 1,
    scoreB: 0,
    status: 'live',
    lineups: {
      teamA: generateLineup(TEAMS.can, '4-4-2'),
      teamB: generateLineup(TEAMS.mar, '4-3-3')
    }
  },
  {
    id: 'm2',
    teamA: TEAMS.ger,
    teamB: TEAMS.jpn,
    date: '2026-06-12',
    time: '18:00',
    stage: 'Group B - BC Place, Vancouver',
    status: 'upcoming',
    lineups: {
      teamA: generateLineup(TEAMS.ger, '4-2-3-1'),
      teamB: generateLineup(TEAMS.jpn, '4-3-3')
    }
  },
  {
    id: 'm3',
    teamA: TEAMS.usa,
    teamB: TEAMS.eng,
    date: '2026-06-12',
    time: '21:00',
    stage: 'Group D - SoFi Stadium, Los Angeles',
    status: 'upcoming',
    lineups: {
      teamA: generateLineup(TEAMS.usa, '4-3-3'),
      teamB: generateLineup(TEAMS.eng, '4-2-3-1')
    }
  },
  {
    id: 'm4',
    teamA: TEAMS.fra,
    teamB: TEAMS.col,
    date: '2026-06-13',
    time: '12:00',
    stage: 'Group C - MetLife Stadium, New York/NJ',
    status: 'upcoming',
    lineups: {
      teamA: generateLineup(TEAMS.fra, '4-3-3'),
      teamB: generateLineup(TEAMS.col, '4-4-2')
    }
  },
  {
    id: 'm5',
    teamA: TEAMS.mex,
    teamB: TEAMS.kor,
    date: '2026-06-11',
    time: 'FT',
    stage: 'Group A - Estadio Azteca, Mexico City',
    scoreA: 2,
    scoreB: 1,
    status: 'finished',
    userPrediction: { scoreA: 2, scoreB: 0 },
    lineups: {
      teamA: generateLineup(TEAMS.mex, '4-3-3'),
      teamB: generateLineup(TEAMS.kor, '4-4-2')
    }
  },
  {
    id: 'm6',
    teamA: TEAMS.cro,
    teamB: TEAMS.sen,
    date: '2026-06-11',
    time: 'FT',
    stage: 'Group A - Estadio Akron, Guadalajara',
    scoreA: 1,
    scoreB: 1,
    status: 'finished',
    lineups: {
      teamA: generateLineup(TEAMS.cro, '4-3-3'),
      teamB: generateLineup(TEAMS.sen, '4-2-3-1')
    }
  }
];
