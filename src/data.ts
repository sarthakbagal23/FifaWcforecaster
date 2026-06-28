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
  par: t('par', 'Paraguay', '🇵🇾'),
  ecu: t('ecu', 'Ecuador', '🇪🇨'),
  // Others (CAF, AFC, CONCACAF, UEFA)
  jpn: t('jpn', 'Japan', '🇯🇵'),
  sen: t('sen', 'Senegal', '🇸🇳'),
  mar: t('mar', 'Morocco', '🇲🇦'),
  kor: t('kor', 'South Korea', '🇰🇷'),
  aus: t('aus', 'Australia', '🇦🇺'),
  nga: t('nga', 'Nigeria', '🇳🇬'),
  egy: t('egy', 'Egypt', '🇪🇬'),
  ksa: t('ksa', 'Saudi Arabia', '🇸🇦'),
  crc: t('crc', 'Costa Rica', '🇨🇷'),
  swe: t('swe', 'Sweden', '🇸🇪'),
  rsa: t('rsa', 'South Africa', '🇿🇦'),
  aut: t('aut', 'Austria', '🇦🇹'),
  bih: t('bih', 'Bosnia-Herz', '🇧🇦'),
  bel: t('bel', 'Belgium', '🇧🇪'),
  civ: t('civ', 'Ivory Coast', '🇨🇮'),
  nor: t('nor', 'Norway', '🇳🇴'),
  cod: t('cod', 'Congo DR', '🇨🇩'),
  cpv: t('cpv', 'Cape Verde', '🇨🇻'),
  sui: t('sui', 'Switzerland', '🇨🇭'),
  alg: t('alg', 'Algeria', '🇩🇿'),
  gha: t('gha', 'Ghana', '🇬🇭'),
};

export const GROUPS: Group[] = [
  {
    name: 'Group A',
    teams: [
      { team: TEAMS.mex, played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, points: 7 },
      { team: TEAMS.sen, played: 3, won: 1, drawn: 2, lost: 0, gf: 4, ga: 3, gd: 1, points: 5 },
      { team: TEAMS.cro, played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0, points: 4 },
      { team: TEAMS.kor, played: 3, won: 0, drawn: 0, lost: 3, gf: 2, ga: 6, gd: -4, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group B',
    teams: [
      { team: TEAMS.can, played: 3, won: 2, drawn: 1, lost: 0, gf: 4, ga: 1, gd: 3, points: 7 },
      { team: TEAMS.ger, played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 2, gd: 3, points: 6 },
      { team: TEAMS.jpn, played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, gd: -1, points: 4 },
      { team: TEAMS.mar, played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 6, gd: -5, points: 0 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group C',
    teams: [
      { team: TEAMS.fra, played: 3, won: 3, drawn: 0, lost: 0, gf: 7, ga: 1, gd: 6, points: 9 },
      { team: TEAMS.col, played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 4, gd: -1, points: 4 },
      { team: TEAMS.aus, played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 4, gd: -2, points: 3 },
      { team: TEAMS.egy, played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 4, gd: -3, points: 1 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group D',
    teams: [
      { team: TEAMS.eng, played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, points: 7 },
      { team: TEAMS.usa, played: 3, won: 1, drawn: 2, lost: 0, gf: 3, ga: 2, gd: 1, points: 5 },
      { team: TEAMS.nga, played: 3, won: 1, drawn: 0, lost: 2, gf: 4, ga: 5, gd: -1, points: 3 },
      { team: TEAMS.ksa, played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 4, gd: -3, points: 1 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group E',
    teams: [
      { team: TEAMS.arg, played: 3, won: 3, drawn: 0, lost: 0, gf: 6, ga: 1, gd: 5, points: 9 },
      { team: TEAMS.ita, played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 2, gd: 0, points: 4 },
      { team: TEAMS.crc, played: 3, won: 1, drawn: 0, lost: 2, gf: 2, ga: 4, gd: -2, points: 3 },
      { team: TEAMS.uru, played: 3, won: 0, drawn: 1, lost: 2, gf: 1, ga: 4, gd: -3, points: 1 },
    ].sort((a, b) => b.points - a.points || b.gd - a.gd)
  },
  {
    name: 'Group F',
    teams: [
      { team: TEAMS.bra, played: 3, won: 2, drawn: 1, lost: 0, gf: 5, ga: 2, gd: 3, points: 7 },
      { team: TEAMS.por, played: 3, won: 2, drawn: 0, lost: 1, gf: 4, ga: 2, gd: 2, points: 6 },
      { team: TEAMS.ned, played: 3, won: 1, drawn: 1, lost: 1, gf: 3, ga: 3, gd: 0, points: 4 },
      { team: TEAMS.esp, played: 3, won: 0, drawn: 0, lost: 3, gf: 1, ga: 6, gd: -5, points: 0 },
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
    id: 'r32-1',
    teamA: TEAMS.ger,
    teamB: TEAMS.par,
    date: '2026-06-29',
    time: '16:30',
    stage: 'Round of 32 - Gillette Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.ger, '4-2-3-1'), teamB: generateLineup(TEAMS.par, '4-4-2') }
  },
  {
    id: 'r32-2',
    teamA: TEAMS.civ,
    teamB: TEAMS.nor,
    date: '2026-06-30',
    time: '13:00',
    stage: 'Round of 32 - AT&T Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.civ, '4-3-3'), teamB: generateLineup(TEAMS.nor, '4-4-2') }
  },
  {
    id: 'r32-3',
    teamA: TEAMS.rsa,
    teamB: TEAMS.can,
    date: '2026-06-28',
    time: '15:00',
    stage: 'Round of 32 - Los Angeles Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.rsa, '4-4-2'), teamB: generateLineup(TEAMS.can, '4-3-3') }
  },
  {
    id: 'r32-4',
    teamA: TEAMS.bra,
    teamB: TEAMS.jpn,
    date: '2026-06-29',
    time: '13:00',
    stage: 'Round of 32 - NRG Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.bra, '4-3-3'), teamB: generateLineup(TEAMS.jpn, '4-2-3-1') }
  },
  {
    id: 'r32-5',
    teamA: TEAMS.esp,
    teamB: TEAMS.aut,
    date: '2026-07-02',
    time: '15:00',
    stage: 'Round of 32 - Los Angeles Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.esp, '4-3-3'), teamB: generateLineup(TEAMS.aut, '4-2-3-1') }
  },
  {
    id: 'r32-6',
    teamA: TEAMS.por,
    teamB: TEAMS.cro,
    date: '2026-07-02',
    time: '19:00',
    stage: 'Round of 32 - BMO Field',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.por, '4-3-3'), teamB: generateLineup(TEAMS.cro, '4-3-3') }
  },
  {
    id: 'r32-7',
    teamA: TEAMS.bel,
    teamB: TEAMS.sen,
    date: '2026-07-01',
    time: '16:00',
    stage: 'Round of 32 - Lumen Field',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.bel, '4-3-3'), teamB: generateLineup(TEAMS.sen, '4-2-3-1') }
  },
  {
    id: 'r32-8',
    teamA: TEAMS.usa,
    teamB: TEAMS.bih,
    date: '2026-07-01',
    time: '20:00',
    stage: 'Round of 32 - Levi\'s Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.usa, '4-3-3'), teamB: generateLineup(TEAMS.bih, '4-4-2') }
  },
  {
    id: 'r32-9',
    teamA: TEAMS.ned,
    teamB: TEAMS.mar,
    date: '2026-06-29',
    time: '21:00',
    stage: 'Round of 32 - Estadio BBVA',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.ned, '4-3-3'), teamB: generateLineup(TEAMS.mar, '4-3-3') }
  },
  {
    id: 'r32-10',
    teamA: TEAMS.fra,
    teamB: TEAMS.swe,
    date: '2026-06-30',
    time: '17:00',
    stage: 'Round of 32 - MetLife Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.fra, '4-3-3'), teamB: generateLineup(TEAMS.swe, '4-4-2') }
  },
  {
    id: 'r32-11',
    teamA: TEAMS.mex,
    teamB: TEAMS.ecu,
    date: '2026-06-30',
    time: '21:00',
    stage: 'Round of 32 - Estadio Azteca',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.mex, '4-3-3'), teamB: generateLineup(TEAMS.ecu, '4-4-2') }
  },
  {
    id: 'r32-12',
    teamA: TEAMS.eng,
    teamB: TEAMS.cod,
    date: '2026-07-01',
    time: '12:00',
    stage: 'Round of 32 - Mercedes-Benz Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.eng, '4-2-3-1'), teamB: generateLineup(TEAMS.cod, '4-3-3') }
  },
  {
    id: 'r32-13',
    teamA: TEAMS.aus,
    teamB: TEAMS.egy,
    date: '2026-07-03',
    time: '14:00',
    stage: 'Round of 32 - AT&T Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.aus, '4-4-2'), teamB: generateLineup(TEAMS.egy, '4-3-3') }
  },
  {
    id: 'r32-14',
    teamA: TEAMS.col,
    teamB: TEAMS.gha,
    date: '2026-07-03',
    time: '21:30',
    stage: 'Round of 32 - Arrowhead Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.col, '4-4-2'), teamB: generateLineup(TEAMS.gha, '4-3-3') }
  },
  {
    id: 'r32-15',
    teamA: TEAMS.sui,
    teamB: TEAMS.alg,
    date: '2026-07-02',
    time: '23:00',
    stage: 'Round of 32 - BC Place',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.sui, '4-2-3-1'), teamB: generateLineup(TEAMS.alg, '4-3-3') }
  },
  {
    id: 'r32-16',
    teamA: TEAMS.arg,
    teamB: TEAMS.cpv,
    date: '2026-07-03',
    time: '18:00',
    stage: 'Round of 32 - Hard Rock Stadium',
    status: 'upcoming',
    lineups: { teamA: generateLineup(TEAMS.arg, '4-3-3'), teamB: generateLineup(TEAMS.cpv, '4-2-3-1') }
  }
];
