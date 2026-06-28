import React, { useState, useMemo } from 'react';
import { Match, Team } from '../types';
import { INITIAL_MATCHES } from '../data';
import { Lock, X, MapPin, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Matchup {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
  scoreA?: number | null;
  scoreB?: number | null;
  date?: string;
  stadium?: string;
}

interface Round {
  name: string;
  matchups: Matchup[];
}

interface KnockoutBracketProps {
  matches: Match[];
}

export const getTwemojiUrl = (emoji: string) => {
  const codePoints = Array.from(emoji).map(p => p.codePointAt(0)?.toString(16)).filter(Boolean).join('-');
  // special case for some emojis if needed, but standard flags work fine
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;
};

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ matches }) => {
  const [selectedMatch, setSelectedMatch] = useState<Matchup | null>(null);

  const bracketData = useMemo<Round[]>(() => {
    // 1. Get the 16 Round of 32 matches from the real data
    let r32Matches = matches.filter(m => m.stage && m.stage.includes('Round of 32'));
    
    // Fallback if no R32 matches found (e.g. API returned 2022 data)
    if (r32Matches.length < 16) {
      r32Matches = INITIAL_MATCHES.filter(m => m.stage && m.stage.includes('Round of 32'));
    }

    const desiredOrder = [
      'r32-1', 'r32-2', 'r32-3', 'r32-4', 
      'r32-5', 'r32-6', 'r32-7', 'r32-8',
      'r32-9', 'r32-10', 'r32-11', 'r32-12', 
      'r32-14', 'r32-16', 'r32-15', 'r32-13'
    ];
    r32Matches.sort((a, b) => desiredOrder.indexOf(a.id) - desiredOrder.indexOf(b.id));

    const baseR32 = r32Matches.length === 16 ? r32Matches : Array.from({ length: 16 }).map((_, i) => ({
      id: `r32-${i+1}`, teamA: null, teamB: null, date: 'TBD', stadium: 'TBD', scoreA: null, scoreB: null
    }));

    const roundOf32: Matchup[] = baseR32.map((m: any, i) => ({
      id: m.id || `r32-${i+1}`,
      teamA: m.teamA || null,
      teamB: m.teamB || null,
      scoreA: m.scoreA ?? (m.status === 'live' ? 0 : null),
      scoreB: m.scoreB ?? (m.status === 'live' ? 0 : null),
      date: m.date && m.time ? `${m.date} ${m.time}` : 'TBD',
      stadium: m.stage ? m.stage.replace('Round of 32 - ', '') : 'TBD'
    }));

    const roundOf16: Matchup[] = [
      { id: 'r16-1', teamA: null, teamB: null, date: '2026-07-04 13:00', stadium: 'NRG Stadium, Houston' },
      { id: 'r16-2', teamA: null, teamB: null, date: '2026-07-04 17:00', stadium: 'Lincoln Financial Field, Philadelphia' },
      { id: 'r16-3', teamA: null, teamB: null, date: '2026-07-05 16:00', stadium: 'MetLife Stadium, New York/NJ' },
      { id: 'r16-4', teamA: null, teamB: null, date: '2026-07-05 20:00', stadium: 'Estadio Azteca, Mexico City' },
      { id: 'r16-5', teamA: null, teamB: null, date: '2026-07-06 15:00', stadium: 'AT&T Stadium, Dallas' },
      { id: 'r16-6', teamA: null, teamB: null, date: '2026-07-06 20:00', stadium: 'Lumen Field, Seattle' },
      { id: 'r16-7', teamA: null, teamB: null, date: '2026-07-07 12:00', stadium: 'Mercedes-Benz Stadium, Atlanta' },
      { id: 'r16-8', teamA: null, teamB: null, date: '2026-07-07 16:00', stadium: 'BC Place, Vancouver' },
    ];

    const quarterFinals: Matchup[] = [
      { id: 'qf-1', teamA: null, teamB: null, date: '2026-07-09 16:00', stadium: 'Gillette Stadium, Boston' },
      { id: 'qf-2', teamA: null, teamB: null, date: '2026-07-10 15:00', stadium: 'SoFi Stadium, Los Angeles' },
      { id: 'qf-3', teamA: null, teamB: null, date: '2026-07-11 17:00', stadium: 'Hard Rock Stadium, Miami' },
      { id: 'qf-4', teamA: null, teamB: null, date: '2026-07-11 21:00', stadium: 'Arrowhead Stadium, Kansas City' },
    ];

    const semiFinals: Matchup[] = [
      { id: 'sf-1', teamA: null, teamB: null, date: '2026-07-14 15:00', stadium: 'AT&T Stadium, Dallas' },
      { id: 'sf-2', teamA: null, teamB: null, date: '2026-07-15 15:00', stadium: 'Mercedes-Benz Stadium, Atlanta' },
    ];

    const finalRound: Matchup[] = [
      { id: 'f-1', teamA: null, teamB: null, date: '2026-07-19 15:00', stadium: 'MetLife Stadium, New York/NJ' },
    ];

    return [
      { name: 'Round of 32', matchups: roundOf32 },
      { name: 'Round of 16', matchups: roundOf16 },
      { name: 'Quarter-Finals', matchups: quarterFinals },
      { name: 'Semi-Finals', matchups: semiFinals },
      { name: 'Final', matchups: finalRound },
    ];
  }, [matches]);

  return (
    <>
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar relative snap-x snap-mandatory">
        <div className="min-w-[1200px] flex justify-between gap-8 py-4 px-4 h-[1000px]">
          {bracketData.map((round, rIndex) => (
            <div key={round.name} className="flex flex-col flex-1 relative snap-center">
              <h3 className="text-center font-bold uppercase text-[11px] tracking-widest text-[#00B25B] mb-6 shrink-0 h-[20px]">
                {round.name}
              </h3>
              <div className="flex flex-col justify-around flex-1 relative z-10">
                {round.matchups.map((match, mIndex) => (
                  <div key={match.id} className="relative flex-1 flex flex-col justify-center w-full">
                    {/* Connectors */}
                    {rIndex > 0 && (
                       <div className="absolute top-1/2 -left-4 w-4 h-[2px] bg-white/20 -translate-y-1/2 -z-10"></div>
                    )}
                    {rIndex < bracketData.length - 1 && (
                       <>
                          <div className="absolute top-1/2 -right-4 w-4 h-[2px] bg-white/20 -translate-y-1/2 -z-10"></div>
                          {mIndex % 2 === 0 ? (
                             <div className="absolute top-1/2 -right-4 w-[2px] h-[50%] bg-white/20 -z-10"></div>
                          ) : (
                             <div className="absolute bottom-1/2 -right-4 w-[2px] h-[50%] bg-white/20 -z-10"></div>
                          )}
                       </>
                    )}
                    
                    <div 
                      onClick={() => setSelectedMatch(match)}
                      className="glass-panel p-2 rounded-xl border border-white/10 hover:border-[#00B25B]/50 hover:bg-white/10 transition-all cursor-pointer group bg-black/40 backdrop-blur-md"
                    >
                      <div className="flex flex-col gap-1">
                        <TeamRow team={match.teamA} score={match.scoreA} />
                        <div className="h-[1px] w-full bg-white/10 my-0.5"></div>
                        <TeamRow team={match.teamB} score={match.scoreB} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMatch(null)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 100 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel relative w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl border border-white/20 border-b-0 sm:border-b"
            >
              {/* Mobile drag handle indicator */}
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-30">
                <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
              </div>

              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#00B25B]/20 to-transparent pointer-events-none"></div>
              
              <button 
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 sm:top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="p-8 pt-12 sm:pt-10 flex flex-col items-center relative z-10 pb-12 sm:pb-8">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00B25B] mb-6">
                  Match Details
                </span>
                
                <div className="flex items-center justify-between w-full mb-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg text-4xl overflow-hidden">
                      {selectedMatch.teamA ? (
                        <img src={getTwemojiUrl(selectedMatch.teamA.flag)} alt={selectedMatch.teamA.name} className="w-10 h-10 object-contain" />
                      ) : (
                        '?'
                      )}
                    </div>
                    <span className="font-bold text-white text-sm">
                      {selectedMatch.teamA ? selectedMatch.teamA.name : 'TBD'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center px-4">
                    <span className="text-white/40 font-bold text-sm">VS</span>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg text-4xl overflow-hidden">
                      {selectedMatch.teamB ? (
                        <img src={getTwemojiUrl(selectedMatch.teamB.flag)} alt={selectedMatch.teamB.name} className="w-10 h-10 object-contain" />
                      ) : (
                        '?'
                      )}
                    </div>
                    <span className="font-bold text-white text-sm">
                      {selectedMatch.teamB ? selectedMatch.teamB.name : 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                    <CalendarDays size={16} className="text-[#00B25B]" />
                    <span className="text-sm font-medium text-white/80">{selectedMatch.date && selectedMatch.date !== 'TBD' ? new Date(selectedMatch.date.split(' ')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (selectedMatch.date.split(' ')[1] ? ' ' + selectedMatch.date.split(' ')[1] : '') : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                    <MapPin size={16} className="text-[#00B25B]" />
                    <span className="text-sm font-medium text-white/80">{selectedMatch.stadium || 'TBD'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const TeamRow = ({ team, score }: { team: Team | null, score?: number | null }) => {
  return (
    <div className="flex items-center justify-between h-7 px-1">
      <div className="flex items-center gap-2">
        {team ? (
          <>
            <img src={getTwemojiUrl(team.flag)} alt={team.name} className="w-4 h-4 object-contain" />
            <span className="text-[11px] font-bold text-white/90 truncate w-20">{team.name}</span>
          </>
        ) : (
          <>
            <div className="w-[16px] h-[16px] rounded-full bg-white/5 flex items-center justify-center">
               <Lock size={10} className="text-white/20" />
            </div>
            <span className="text-[11px] font-bold text-white/30 italic">TBD</span>
          </>
        )}
      </div>
      <div className={`text-[12px] font-bold tabular-nums ${score !== null && score !== undefined ? 'text-white' : 'text-white/20'}`}>
        {score !== null && score !== undefined ? score : '-'}
      </div>
    </div>
  );
};
