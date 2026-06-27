import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, PlayCircle, Loader2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onPredict: (matchId: string, scoreA: number, scoreB: number) => void;
  onGetAiInsight: (matchId: string) => Promise<void>;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPredict, onGetAiInsight }) => {
  const [expanded, setExpanded] = useState(false);
  const [scoreA, setScoreA] = useState(match.userPrediction?.scoreA?.toString() || '');
  const [scoreB, setScoreB] = useState(match.userPrediction?.scoreB?.toString() || '');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'forecast' | 'lineups' | 'heatmap'>('forecast');

  useEffect(() => {
    if (match.userPrediction) {
      setScoreA(match.userPrediction.scoreA.toString());
      setScoreB(match.userPrediction.scoreB.toString());
    }
  }, [match.userPrediction]);

  const isLive = match.status === 'live';

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scoreA !== '' && scoreB !== '') {
      onPredict(match.id, parseInt(scoreA, 10), parseInt(scoreB, 10));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!match.aiPrediction && !match.isAiLoading) {
      onGetAiInsight(match.id);
    }
  };

  return (
    <motion.div 
      layout
      className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-2xl mb-4 transition-all group flex flex-col overflow-hidden shadow-lg"
    >
      {/* FotMob Style Row */}
      <div 
        className="flex items-center px-4 py-4 sm:px-6 cursor-pointer select-none gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Time / Status */}
        <div className={`w-12 sm:w-16 text-center font-mono text-[11px] sm:text-[13px] font-bold ${isLive ? 'text-[#00B25B]' : 'text-white/50'}`}>
          {isLive ? (
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00B25B] rounded-full animate-pulse shadow-[0_0_8px_#00B25B]"></span>
              {match.time}
            </div>
          ) : (
            match.time
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl flex items-center justify-center w-8 h-8 drop-shadow-md bg-white/10 rounded-full p-1 border border-white/10">
                {match.teamA.flag?.startsWith('http') ? <img src={match.teamA.flag} alt={match.teamA.name} className="w-6 h-6 object-contain" /> : match.teamA.flag}
              </span>
              <span className="font-sans font-bold text-sm sm:text-base text-white/90 group-hover:text-white transition-colors">{match.teamA.name}</span>
            </div>
            <div className="flex items-center gap-4">
              {match.userPrediction?.scoreA !== undefined && (
                <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10" title="Your Prediction">
                  {match.userPrediction.scoreA}
                </span>
              )}
              <div className={`font-sans font-black text-base sm:text-lg w-6 text-right ${isLive ? 'text-[#00B25B]' : 'text-white'}`}>
                {match.status !== 'upcoming' && match.scoreA !== undefined ? match.scoreA : '-'}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl flex items-center justify-center w-8 h-8 drop-shadow-md bg-white/10 rounded-full p-1 border border-white/10">
                {match.teamB.flag?.startsWith('http') ? <img src={match.teamB.flag} alt={match.teamB.name} className="w-6 h-6 object-contain" /> : match.teamB.flag}
              </span>
              <span className="font-sans font-bold text-sm sm:text-base text-white/90 group-hover:text-white transition-colors">{match.teamB.name}</span>
            </div>
            <div className="flex items-center gap-4">
              {match.userPrediction?.scoreB !== undefined && (
                <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10" title="Your Prediction">
                  {match.userPrediction.scoreB}
                </span>
              )}
              <div className={`font-sans font-black text-base sm:text-lg w-6 text-right ${isLive ? 'text-[#00B25B]' : 'text-white'}`}>
                {match.status !== 'upcoming' && match.scoreB !== undefined ? match.scoreB : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="w-6 flex justify-end text-white/30 group-hover:text-white/70 transition-colors">
          <ChevronDown size={20} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Editorial/Predictor Area */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/20 border-t border-white/5 flex flex-col"
          >
            {/* Tabs */}
            <div className="flex gap-2 mx-4 mt-4 p-1 bg-white/5 rounded-xl border border-white/5">
              {(['forecast', 'lineups', 'heatmap'] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-all rounded-lg ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                 >
                   {tab === 'forecast' ? (match.status === 'finished' ? 'Stats' : 'Forecast') : tab}
                 </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
              {activeTab === 'forecast' && (
                <>
                  {/* Forecast Box (Editorial styling) */}
                  {match.status !== 'finished' ? (
                    <div className="flex-1 bg-white/5 p-5 sm:p-6 border border-white/10 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase mb-4 flex items-center justify-between tracking-widest text-white/70">
                          Your Forecast
                          {saved && <span className="text-[#00B25B] bg-[#00B25B]/10 border border-[#00B25B]/20 px-2 py-0.5 rounded-md">SAVED</span>}
                        </h4>
                        <div className="flex items-center justify-center gap-4 border-y border-white/10 py-6 relative">
                          <input 
                            type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)}
                            className="w-14 h-14 sm:w-16 sm:h-16 text-center text-3xl font-black bg-black/30 border border-white/10 text-white focus:outline-none focus:border-[#00B25B] focus:bg-[#00B25B]/10 transition-colors rounded-xl"
                          />
                          <span className="font-serif italic text-2xl text-white/50">-</span>
                          <input 
                            type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)}
                            className="w-14 h-14 sm:w-16 sm:h-16 text-center text-3xl font-black bg-black/30 border border-white/10 text-white focus:outline-none focus:border-[#00B25B] focus:bg-[#00B25B]/10 transition-colors rounded-xl"
                          />
                          {match.aiScoreA !== undefined && match.aiScoreB !== undefined && (
                            <button 
                              onClick={() => {
                                setScoreA(match.aiScoreA!.toString());
                                setScoreB(match.aiScoreB!.toString());
                              }}
                              className="absolute -bottom-3 bg-[#0D1117] border border-white/20 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-lg whitespace-nowrap"
                            >
                              Use AI Score: {match.aiScoreA}-{match.aiScoreB}
                            </button>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={handleSave}
                        disabled={scoreA === '' || scoreB === ''}
                        className={`w-full mt-6 py-3 text-[12px] font-bold uppercase tracking-widest transition-all rounded-xl ${saved ? 'bg-[#00B25B] text-white shadow-lg shadow-[#00B25B]/20' : (scoreA === '' || scoreB === '' ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30')}`}
                      >
                        {saved ? 'Forecast Confirmed ✓' : 'Confirm Forecast'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white/5 p-5 sm:p-6 border border-white/10 rounded-2xl">
                      <h4 className="text-[10px] font-bold uppercase mb-4 tracking-widest text-white/70">
                        Key Match Stats
                      </h4>
                      <div className="flex flex-col gap-4 border-y border-white/10 py-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right text-white">{(Math.random() * 2 + 0.5).toFixed(2)}</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/50">Expected Goals (xG)</span>
                          <span className="font-mono font-bold w-12 text-left text-white">{(Math.random() * 2 + 0.5).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right text-white">{Math.floor(Math.random() * 20 + 40)}%</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/50">Possession</span>
                          <span className="font-mono font-bold w-12 text-left text-white">{Math.floor(Math.random() * 20 + 40)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right text-white">{Math.floor(Math.random() * 8 + 2)}</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/50">Shots on Target</span>
                          <span className="font-mono font-bold w-12 text-left text-white">{Math.floor(Math.random() * 8 + 2)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                         <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Community Accuracy:</span>
                         <span className="font-mono text-[#00B25B] font-bold text-xs">{Math.floor(Math.random() * 30 + 50)}%</span>
                      </div>
                    </div>
                  )}

                  {/* AI Tactical Box */}
                  <div className="flex-1 bg-black/40 backdrop-blur-xl p-5 sm:p-6 border border-white/10 rounded-2xl shadow-lg flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-[11px] uppercase tracking-widest font-bold text-[#00B25B]">
                          Alex — Tactical Desk
                        </h4>
                        {match.aiConfidence && (
                          <span className={`text-[9px] uppercase font-bold tracking-widest ${
                            match.aiConfidence === 'high' ? 'text-[#00B25B]' :
                            match.aiConfidence === 'medium' ? 'text-yellow-400' : 'text-white/40'
                          }`}>
                            {match.aiConfidence} confidence
                          </span>
                        )}
                      </div>
                      {!match.aiPrediction && !match.isAiLoading && (
                        <button 
                          onClick={handleAiClick}
                          className="text-[10px] font-bold uppercase hover:text-[#00B25B] transition-colors border border-white/20 px-2 py-1 rounded bg-white/5"
                        >
                          Get Analysis
                        </button>
                      )}
                    </div>
                    
                    {match.isAiLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#00B25B]">
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <span className="font-mono text-[10px] uppercase font-bold mt-2">Consulting squad data...</span>
                      </div>
                    ) : match.aiPrediction ? (
                      <div className="space-y-4 flex-1">
                        {/* AI Score Prediction */}
                        {match.aiScoreA !== undefined && match.aiScoreB !== undefined && (
                          <div className="flex items-center justify-center gap-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">AI Prediction</span>
                            <span className="font-black text-2xl text-[#00B25B] font-mono tabular-nums">
                              {match.aiScoreA} – {match.aiScoreB}
                            </span>
                          </div>
                        )}
                        {/* Tactical Analysis */}
                        <p className="font-serif italic text-sm sm:text-base leading-snug text-white/85">
                          "{match.aiPrediction}"
                        </p>
                        {/* Key Battle */}
                        {match.aiKeyBattle && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#00B25B] block mb-1">⚔ Key Battle</span>
                            <p className="text-xs text-white/80 font-medium">{match.aiKeyBattle}</p>
                          </div>
                        )}
                        {/* xG Projection */}
                        {match.aiXGProjection && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">xG</span>
                            <span className="text-[11px] font-mono font-bold text-white/70">{match.aiXGProjection}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center opacity-70 py-6 text-center">
                         <PlayCircle size={32} className="mb-3 opacity-50 text-white" />
                         <p className="text-[11px] font-bold uppercase cursor-pointer hover:text-[#00B25B] transition-colors" onClick={handleAiClick}>
                           Get tactical analysis
                         </p>
                         <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1">xG · key battle · score prediction</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'lineups' && (
                <div className="flex-1 w-full flex flex-col">
                   <div className="bg-[#132A1C]/80 p-4 sm:p-6 border border-[#00B25B]/20 rounded-2xl relative overflow-hidden aspect-[2/3] max-h-[600px] w-full max-w-sm mx-auto shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                     {/* Pitch Markings */}
                     <div className="absolute inset-4 border border-white/20 rounded-sm"></div>
                     <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20 transform -translate-y-1/2"></div>
                     <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute top-4 left-1/2 w-32 h-16 border border-white/20 transform -translate-x-1/2 border-t-0"></div>
                     <div className="absolute bottom-4 left-1/2 w-32 h-16 border border-white/20 transform -translate-x-1/2 border-b-0"></div>
                     <div className="absolute top-4 left-1/2 w-16 h-6 border border-white/20 transform -translate-x-1/2 border-t-0"></div>
                     <div className="absolute bottom-4 left-1/2 w-16 h-6 border border-white/20 transform -translate-x-1/2 border-b-0"></div>
                     <div className="absolute top-1/2 left-1/2 w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_20px,rgba(255,255,255,0.02)_20px,rgba(255,255,255,0.02)_40px)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                     {/* Team B (Top Half) */}
                     {match.lineups?.teamB.map((player) => (
                       <div key={player.id} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10 w-16" style={{ top: `${(player.x / 100) * 45 + 5}%`, left: `${player.y}%` }}>
                         <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-[#1A1A1A] border-2 border-white shadow-lg flex items-center justify-center font-black text-[10px] sm:text-xs">
                           {player.number}
                         </div>
                         <span className="text-[8px] sm:text-[9px] font-bold text-white mt-1 bg-black/50 px-1 rounded truncate w-full text-center">
                           {player.name.split(' ').pop()}
                         </span>
                       </div>
                     ))}
                     
                     {/* Team A (Bottom Half) */}
                     {match.lineups?.teamA.map((player) => (
                       <div key={player.id} className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10 w-16" style={{ bottom: `${(player.x / 100) * 45 + 5}%`, left: `${player.y}%` }}>
                         <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#00B25B] text-white border-2 border-white shadow-[0_0_10px_rgba(0,178,91,0.5)] flex items-center justify-center font-black text-[10px] sm:text-xs">
                           {player.number}
                         </div>
                         <span className="text-[8px] sm:text-[9px] font-bold text-white mt-1 bg-black/50 px-1 rounded truncate w-full text-center">
                           {player.name.split(' ').pop()}
                         </span>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center mt-3 max-w-sm mx-auto w-full px-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B25B]">{match.teamA.name}</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{match.teamB.name}</span>
                   </div>
                </div>
              )}

              {activeTab === 'heatmap' && (
                <div className="flex-1 w-full flex flex-col">
                   <div className="bg-[#132A1C]/80 p-4 sm:p-6 border border-[#00B25B]/20 rounded-2xl relative overflow-hidden aspect-[2/3] max-h-[600px] w-full max-w-sm mx-auto shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                     {/* Pitch Markings */}
                     <div className="absolute inset-4 border border-white/10 rounded-sm"></div>
                     <div className="absolute top-1/2 left-4 right-4 h-px bg-white/10 transform -translate-y-1/2"></div>
                     <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute top-4 left-1/2 w-32 h-16 border border-white/10 transform -translate-x-1/2 border-t-0"></div>
                     <div className="absolute bottom-4 left-1/2 w-32 h-16 border border-white/10 transform -translate-x-1/2 border-b-0"></div>
                     <div className="absolute top-4 left-1/2 w-16 h-6 border border-white/10 transform -translate-x-1/2 border-t-0"></div>
                     <div className="absolute bottom-4 left-1/2 w-16 h-6 border border-white/10 transform -translate-x-1/2 border-b-0"></div>
                     
                     {/* Heatmap intensity blobs (simulated based on players) */}
                     {match.lineups?.teamA.map((player, idx) => (
                       <div 
                         key={`heat-a-${idx}`} 
                         className="absolute w-32 h-32 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-0 mix-blend-screen pointer-events-none blur-[25px]"
                         style={{ 
                           bottom: `${player.x}%`, 
                           left: `${player.y}%`,
                           background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(234,179,8,0.5) 40%, rgba(34,197,94,0.2) 70%, transparent 100%)'
                         }}
                       ></div>
                     ))}
                     {match.lineups?.teamB.map((player, idx) => (
                       <div 
                         key={`heat-b-${idx}`} 
                         className="absolute w-32 h-32 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-0 mix-blend-screen pointer-events-none blur-[25px]"
                         style={{ 
                           top: `${player.x}%`, 
                           left: `${player.y}%`,
                           background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(147,51,234,0.4) 40%, transparent 80%)'
                         }}
                       ></div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center mt-3 max-w-sm mx-auto w-full px-2">
                     <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{match.teamA.name} Activity</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 text-right">{match.teamB.name} Activity</span>
                       <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

