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
      className="bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors group flex flex-col last:border-b-0"
    >
      {/* FotMob Style Row */}
      <div 
        className="flex items-center px-4 py-3 sm:px-6 sm:py-4 cursor-pointer select-none gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Time / Status */}
        <div className={`w-12 sm:w-16 text-center font-mono text-[11px] sm:text-[13px] font-bold ${isLive ? 'text-[#00B25B]' : 'text-slate-500'}`}>
          {isLive ? (
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00B25B] rounded-full animate-pulse"></span>
              {match.time}
            </div>
          ) : (
            match.time
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl flex items-center justify-center w-8 h-8">
                {match.teamA.flag?.startsWith('http') ? <img src={match.teamA.flag} alt={match.teamA.name} className="w-6 h-6 object-contain" /> : match.teamA.flag}
              </span>
              <span className="font-sans font-bold text-sm sm:text-base text-[#1A1A1A]">{match.teamA.name}</span>
              <div className="hidden sm:flex items-center gap-1 ml-2">
                 {['W','W','D','L','W'].map((r,i) => (
                    <span key={i} className={`w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center font-bold text-white ${r === 'W' ? 'bg-[#00B25B]' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}>{r}</span>
                 ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {match.userPrediction?.scoreA !== undefined && (
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded-sm" title="Your Prediction">
                  {match.userPrediction.scoreA}
                </span>
              )}
              <div className={`font-sans font-black text-sm sm:text-lg w-4 text-right ${isLive ? 'text-[#00B25B]' : 'text-[#1A1A1A]'}`}>
                {match.status !== 'upcoming' && match.scoreA !== undefined ? match.scoreA : '-'}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl flex items-center justify-center w-8 h-8">
                {match.teamB.flag?.startsWith('http') ? <img src={match.teamB.flag} alt={match.teamB.name} className="w-6 h-6 object-contain" /> : match.teamB.flag}
              </span>
              <span className="font-sans font-bold text-sm sm:text-base text-[#1A1A1A]">{match.teamB.name}</span>
              <div className="hidden sm:flex items-center gap-1 ml-2">
                 {['D','W','W','W','L'].map((r,i) => (
                    <span key={i} className={`w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center font-bold text-white ${r === 'W' ? 'bg-[#00B25B]' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}>{r}</span>
                 ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {match.userPrediction?.scoreB !== undefined && (
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded-sm" title="Your Prediction">
                  {match.userPrediction.scoreB}
                </span>
              )}
              <div className={`font-sans font-black text-sm sm:text-lg w-4 text-right ${isLive ? 'text-[#00B25B]' : 'text-[#1A1A1A]'}`}>
                {match.status !== 'upcoming' && match.scoreB !== undefined ? match.scoreB : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="w-6 flex justify-end text-slate-300 group-hover:text-[#1A1A1A] transition-colors">
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
            className="overflow-hidden bg-[#F4F1EA] border-t-2 border-[#1A1A1A] flex flex-col"
          >
            {/* Tabs */}
            <div className="flex border-b-2 border-[#1A1A1A] bg-white">
              {(['forecast', 'lineups', 'heatmap'] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest transition-colors ${activeTab === tab ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-slate-100'}`}
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
                    <div className="flex-1 bg-white p-5 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black uppercase mb-4 flex items-center justify-between tracking-widest text-[#1A1A1A]">
                          Your Forecast
                          {saved && <span className="text-[#00B25B] bg-[#00B25B]/10 px-2 py-0.5 rounded-sm">SAVED</span>}
                        </h4>
                        <div className="flex items-center justify-center gap-4 border-y-2 border-dashed border-[#1A1A1A] py-6 relative">
                          <input 
                            type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)}
                            className="w-14 h-14 sm:w-16 sm:h-16 text-center text-3xl font-black bg-[#F4F1EA] border-2 border-[#1A1A1A] focus:outline-none focus:bg-[#00B25B] focus:text-white transition-colors rounded-none"
                          />
                          <span className="font-serif italic text-2xl text-[#1A1A1A]">-</span>
                          <input 
                            type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)}
                            className="w-14 h-14 sm:w-16 sm:h-16 text-center text-3xl font-black bg-[#F4F1EA] border-2 border-[#1A1A1A] focus:outline-none focus:bg-[#00B25B] focus:text-white transition-colors rounded-none"
                          />
                          {match.aiScoreA !== undefined && match.aiScoreB !== undefined && (
                            <button 
                              onClick={() => {
                                setScoreA(match.aiScoreA!.toString());
                                setScoreB(match.aiScoreB!.toString());
                              }}
                              className="absolute -bottom-3 bg-white border border-[#1A1A1A] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-[#1A1A1A] hover:bg-[#00B25B] hover:text-white transition-colors shadow-sm"
                            >
                              Use AI Score: {match.aiScoreA}-{match.aiScoreB}
                            </button>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={handleSave}
                        disabled={scoreA === '' || scoreB === ''}
                        className={`w-full mt-6 py-3 text-[12px] font-black uppercase tracking-widest transition-colors ${saved ? 'bg-[#00B25B] text-white' : (scoreA === '' || scoreB === '' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#1A1A1A] text-white hover:bg-[#00B25B]')}`}
                      >
                        {saved ? 'Forecast Confirmed ✓' : 'Confirm Forecast'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white p-5 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                      <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest text-[#1A1A1A]">
                        Key Match Stats
                      </h4>
                      <div className="flex flex-col gap-4 border-y-2 border-dashed border-[#1A1A1A] py-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right">{(Math.random() * 2 + 0.5).toFixed(2)}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">Expected Goals (xG)</span>
                          <span className="font-mono font-bold w-12 text-left">{(Math.random() * 2 + 0.5).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right">{Math.floor(Math.random() * 20 + 40)}%</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">Possession</span>
                          <span className="font-mono font-bold w-12 text-left">{Math.floor(Math.random() * 20 + 40)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold w-12 text-right">{Math.floor(Math.random() * 8 + 2)}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">Shots on Target</span>
                          <span className="font-mono font-bold w-12 text-left">{Math.floor(Math.random() * 8 + 2)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                         <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Community Accuracy:</span>
                         <span className="font-mono text-[#00B25B] font-bold text-xs">{Math.floor(Math.random() * 30 + 50)}%</span>
                      </div>
                    </div>
                  )}

                  {/* AI Tactical Box */}
                  <div className="flex-1 bg-[#1A1A1A] text-[#F4F1EA] p-5 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-3">
                      <h4 className="text-[11px] uppercase tracking-tighter font-black text-[#00B25B]">
                        Tactical Desk
                      </h4>
                      {!match.aiPrediction && !match.isAiLoading && (
                        <button 
                          onClick={handleAiClick}
                          className="text-[10px] font-bold uppercase underline decoration-2 underline-offset-2 hover:text-[#00B25B] transition-colors"
                        >
                          Request Analysis
                        </button>
                      )}
                    </div>
                    
                    {match.isAiLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#00B25B]">
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <span className="font-mono text-[10px] uppercase font-bold mt-2">Consulting Opta Data...</span>
                      </div>
                    ) : match.aiPrediction ? (
                      <p className="font-serif italic text-base sm:text-lg leading-snug text-white/90">
                        "{match.aiPrediction}"
                      </p>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center opacity-70 py-6 text-center">
                         <PlayCircle size={32} className="mb-3 opacity-50 text-white" />
                         <p className="text-[11px] font-bold uppercase cursor-pointer hover:text-[#00B25B] transition-colors" onClick={handleAiClick}>
                           Generate match insight
                         </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'lineups' && (
                <div className="flex-1 bg-white p-5 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] w-full">
                  <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest text-[#1A1A1A] flex items-center justify-between">
                    <span>{match.teamA.name}</span>
                    <span className="text-[#00B25B]">Lineups (Predicted)</span>
                    <span>{match.teamB.name}</span>
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2 border-r-2 border-dashed border-[#1A1A1A] pr-4">
                      {match.lineups?.teamA.map((player) => (
                        <div key={player.id} className="flex justify-between text-xs border-b border-slate-100 pb-1">
                          <span className="font-mono font-bold opacity-50 text-[10px] w-6">{player.position}</span>
                          <span className="font-bold text-right flex-1">{player.name}</span>
                        </div>
                      )) || <div className="text-xs opacity-50 text-center py-4">Lineups unavailable</div>}
                    </div>
                    <div className="flex-1 space-y-2 pl-4">
                      {match.lineups?.teamB.map((player) => (
                        <div key={player.id} className="flex justify-between text-xs border-b border-slate-100 pb-1">
                          <span className="font-bold flex-1">{player.name}</span>
                          <span className="font-mono font-bold opacity-50 text-[10px] w-6 text-right">{player.position}</span>
                        </div>
                      )) || <div className="text-xs opacity-50 text-center py-4">Lineups unavailable</div>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'heatmap' && (
                <div className="flex-1 bg-white p-5 sm:p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] w-full flex flex-col items-center">
                  <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest text-[#1A1A1A] self-start">
                    Positional Map
                  </h4>
                  <div className="relative w-full max-w-sm aspect-[1.5/1] bg-[#00B25B] border-2 border-[#1A1A1A] rounded-sm overflow-hidden flex flex-col">
                    {/* Pitch markings */}
                    <div className="absolute inset-0 border border-white/30 m-4"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30 transform -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-12 h-24 border border-white/30 transform -translate-y-1/2 m-4 border-l-0"></div>
                    <div className="absolute top-1/2 right-0 w-12 h-24 border border-white/30 transform -translate-y-1/2 m-4 border-r-0"></div>
                    
                    {/* Players Team A */}
                    {match.lineups?.teamA.map((player) => (
                      <div key={player.id} className="absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10" style={{ top: `${player.y}%`, left: `${player.x / 2}%` }}>
                        <span className="text-[8px] font-black text-[#1A1A1A]">{player.number}</span>
                      </div>
                    ))}
                    {/* Players Team B */}
                    {match.lineups?.teamB.map((player) => (
                      <div key={player.id} className="absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1A1A1A] border-2 border-white shadow-[2px_2px_0px_rgba(255,255,255,0.3)] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10" style={{ top: `${player.y}%`, right: `${player.x / 2}%` }}>
                        <span className="text-[8px] font-black text-white">{player.number}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between w-full max-w-sm mt-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-white border border-[#1A1A1A] rounded-full"></div>
                        <span className="text-[9px] uppercase font-bold text-slate-500">{match.teamA.name} (Attack →)</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500">(← Attack) {match.teamB.name}</span>
                        <div className="w-3 h-3 bg-[#1A1A1A] rounded-full"></div>
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
