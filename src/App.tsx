import React, { useState, useEffect } from 'react';
import { INITIAL_MATCHES, GROUPS, TOP_SCORERS } from './data';
import { MatchCard } from './components/MatchCard';
import { GroupTable } from './components/GroupTable';
import { Match, Group } from './types';
import { Trophy, Calendar, LayoutList, LineChart, Send, Loader2, Bell, X, LogIn, LogOut } from 'lucide-react';
import { auth, db, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

export default function App() {
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [groups, setGroups] = useState<Group[]>(GROUPS);
  const [topScorers, setTopScorers] = useState<any[]>(TOP_SCORERS);
  const [activeTab, setActiveTab] = useState<'matches' | 'groups' | 'stats' | 'insights'>('matches');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Tactical Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>('default');
  const [toast, setToast] = useState<{ id: string, title: string, message: string, type: 'goal' | 'event' } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(collection(db, 'predictions'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);
          const userPredictions: Record<string, {scoreA: number, scoreB: number}> = {};
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            userPredictions[data.matchId] = { scoreA: data.scoreA, scoreB: data.scoreB };
          });
          
          setMatches(prev => prev.map(m => {
            if (userPredictions[m.id]) {
              return { ...m, userPrediction: userPredictions[m.id] };
            }
            return m;
          }));
        } catch (err) {
          console.error("Failed to fetch predictions", err);
        }
      } else {
        setMatches(prev => prev.map(m => ({ ...m, userPrediction: undefined })));
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  useEffect(() => {
    const liveMatchIds = matches.filter(m => m.status === 'live').map(m => m.id);
    if (liveMatchIds.length === 0) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.75) { // 25% chance every 10 seconds
        const randomMatchId = liveMatchIds[Math.floor(Math.random() * liveMatchIds.length)];
        const match = matches.find(m => m.id === randomMatchId);
        if (!match) return;

        const isGoal = Math.random() > 0.5;
        const scoringTeam = Math.random() > 0.5 ? match.teamA.name : match.teamB.name;
        
        const event = {
          id: Date.now().toString(),
          type: (isGoal ? 'goal' : 'event') as 'goal' | 'event',
          title: isGoal ? `GOAL! ${scoringTeam}` : `Major Event`,
          message: isGoal 
            ? `${scoringTeam} scores against ${scoringTeam === match.teamA.name ? match.teamB.name : match.teamA.name}!` 
            : `VAR check in progress for ${match.teamA.name} vs ${match.teamB.name}`
        };

        setToast(event);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(event.title, { body: event.message });
        }

        setTimeout(() => setToast(null), 6000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [matches]);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [matchesRes, standingsRes, scorersRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/standings'),
          fetch('/api/scorers')
        ]);
        
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          if (data.matches && data.matches.length > 0) {
            const mappedMatches: Match[] = data.matches.map((m: any) => {
              const statusMap: Record<string, string> = {
                'FINISHED': 'finished',
                'IN_PLAY': 'live',
                'LIVE': 'live',
                'PAUSED': 'live',
                'SCHEDULED': 'upcoming',
                'TIMED': 'upcoming',
              };
              
              const status = statusMap[m.status] || 'upcoming';
              const dateObj = new Date(m.utcDate);
              
              return {
                id: String(m.id),
                teamA: {
                  id: String(m.homeTeam.id),
                  name: m.homeTeam.shortName || m.homeTeam.name,
                  flag: m.homeTeam.crest
                },
                teamB: {
                  id: String(m.awayTeam.id),
                  name: m.awayTeam.shortName || m.awayTeam.name,
                  flag: m.awayTeam.crest
                },
                date: dateObj.toISOString().split('T')[0],
                time: status === 'finished' ? 'FT' : status === 'live' ? 'LIVE' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                stage: (m.group || m.stage).replace('_', ' '),
                scoreA: m.score?.fullTime?.home ?? undefined,
                scoreB: m.score?.fullTime?.away ?? undefined,
                status: status as 'upcoming' | 'live' | 'finished',
              };
            });
            setMatches(prev => {
              const prevMap = new Map<string, Match>(prev.map(p => [p.id, p]));
              return mappedMatches.map(m => {
                const existing = prevMap.get(m.id);
                if (existing) {
                  return { ...m, userPrediction: existing.userPrediction, aiPrediction: existing.aiPrediction, isAiLoading: existing.isAiLoading, lineups: existing.lineups };
                }
                return m;
              });
            });
          }
        }
        
        if (standingsRes.ok) {
          const data = await standingsRes.json();
          if (data.standings && data.standings.length > 0) {
            const mappedGroups: Group[] = data.standings.filter((s: any) => s.type === 'TOTAL').map((s: any) => {
              return {
                name: s.group,
                teams: s.table.map((t: any) => ({
                  team: {
                    id: String(t.team.id),
                    name: t.team.shortName || t.team.name,
                    flag: t.team.crest
                  },
                  played: t.playedGames,
                  won: t.won,
                  drawn: t.draw,
                  lost: t.lost,
                  gf: t.goalsFor,
                  ga: t.goalsAgainst,
                  gd: t.goalDifference,
                  points: t.points
                }))
              };
            });
            setGroups(mappedGroups);
          }
        }

        if (scorersRes.ok) {
          const data = await scorersRes.json();
          if (data.scorers && data.scorers.length > 0) {
            const mappedScorers = data.scorers.map((s: any) => ({
              id: String(s.player.id),
              name: s.player.name,
              team: {
                id: String(s.team.id),
                name: s.team.shortName || s.team.name,
                flag: s.team.crest
              },
              goals: s.goals,
              assists: s.assists || 0,
              matches: s.playedMatches || 0,
            }));
            setTopScorers(mappedScorers);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live data", err);
      }
    };
    
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handlePredict = async (matchId: string, scoreA: number, scoreB: number) => {
    if (!user) {
      setToast({
        id: Date.now().toString(),
        type: 'event',
        title: 'Authentication Required',
        message: 'Please log in to save your forecasts.'
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      await setDoc(doc(db, 'predictions', `${user.uid}_${matchId}`), {
        userId: user.uid,
        matchId,
        scoreA,
        scoreB,
        updatedAt: new Date()
      });

      setMatches(prev => {
        const match = prev.find(m => m.id === matchId);
        if (match) {
          setToast({
            id: Date.now().toString(),
            type: 'event',
            title: 'Forecast Saved',
            message: `Your prediction of ${scoreA} - ${scoreB} for ${match.teamA.name} vs ${match.teamB.name} has been saved.`
          });
          setTimeout(() => setToast(null), 3000);
        }
        return prev.map(m => 
          m.id === matchId 
            ? { ...m, userPrediction: { scoreA, scoreB } }
            : m
        );
      });
    } catch (error) {
      console.error("Failed to save prediction", error);
      setToast({
        id: Date.now().toString(),
        type: 'event',
        title: 'Error',
        message: 'Failed to save forecast. Please try again.'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleGetAiInsight = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, isAiLoading: true } : m));

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA: match.teamA.name, teamB: match.teamB.name, stage: match.stage })
      });
      const data = await response.json();
      setMatches(prev => prev.map(m => 
        m.id === matchId ? { ...m, isAiLoading: false, aiPrediction: data.analysis || data.error || "Tactical brief unavailable.", aiScoreA: data.scoreA, aiScoreB: data.scoreB } : m
      ));
    } catch (error) {
      console.error(error);
      setMatches(prev => prev.map(m => 
        m.id === matchId ? { ...m, isAiLoading: false, aiPrediction: "Failed to connect to tactical desk." } : m
      ));
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build a light context from matches
      const context = matches.filter(m => m.status !== 'upcoming').slice(0, 5).map(m => `${m.teamA.name} ${m.scoreA}-${m.scoreB} ${m.teamB.name}`).join(', ');
      
      const response = await fetch('/api/tactical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput, context })
      });
      const data = await response.json();
      
      setChatHistory([...newHistory, { role: 'ai' as const, text: data.reply || data.error || "Tactical desk offline." }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'ai' as const, text: "Failed to connect to tactical desk." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const finishedMatches = matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#00B25B]" />
          <p className="text-[10px] uppercase font-bold tracking-widest">Loading Desk...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-sm w-full border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#00B25B] flex flex-col items-center text-center">
          <div className="bg-[#00B25B] p-3 rounded-sm mb-6">
            <Trophy size={32} className="text-[#1A1A1A]" />
          </div>
          <h1 className="font-sans font-black text-3xl tracking-tighter uppercase leading-none mb-2 text-[#1A1A1A]">
            WCForecaster<span className="text-[#00B25B]">.</span>
          </h1>
          <p className="text-[12px] uppercase font-bold tracking-widest text-slate-500 mb-8">
            Tactical Analysis & Predictions
          </p>
          
          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full bg-[#1A1A1A] text-white py-3 px-4 font-black text-sm uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Sign In to Forecast
            </button>
            <button 
              onClick={() => setIsGuest(true)}
              className="w-full bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] py-3 px-4 font-black text-sm uppercase tracking-widest hover:bg-[#F4F1EA] transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] font-sans flex flex-col">
      {/* Top Bar (Editorial x FotMob) */}
      <header className="bg-[#1A1A1A] text-white sticky top-0 z-20 shadow-md">
        <div className="px-4 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="bg-[#00B25B] p-1.5 rounded-sm">
              <Trophy size={18} className="text-[#1A1A1A]" />
            </div>
            <h1 className="font-sans font-black text-2xl tracking-tighter uppercase leading-none mt-1">
              WCForecaster<span className="text-[#00B25B]">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={requestNotificationPermission}
              className={`p-1.5 transition-colors ${notificationPermission === 'granted' ? 'text-[#00B25B]' : 'text-white/50 hover:text-white'}`}
              title={notificationPermission === 'granted' ? "Notifications Enabled" : "Enable Notifications"}
            >
              <Bell size={18} />
            </button>
            <div className="hidden sm:block text-right">
              {user ? (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-[#00B25B] font-bold">Welcome,</p>
                  <p className="text-[12px] font-mono font-bold truncate max-w-[100px]">{user.displayName || 'Forecaster'}</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Access</p>
                  <p className="text-[12px] font-mono font-bold">Guest Mode</p>
                </>
              )}
            </div>
            {user ? (
              <button 
                onClick={() => {
                  signOut(auth);
                  setIsGuest(false);
                }}
                className="bg-[#1A1A1A] text-white/80 hover:text-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-sm border border-white/20 transition-colors flex items-center gap-1"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button 
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="bg-[#00B25B] text-[#1A1A1A] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-sm border border-transparent hover:bg-[#00904a] transition-colors flex items-center gap-1"
              >
                <LogIn size={14} /> <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
        
        {/* FotMob Style Sub-nav */}
        <nav className="flex overflow-x-auto max-w-5xl mx-auto w-full px-2 border-t border-white/10 hide-scrollbar">
          {[
            { id: 'matches', label: 'Matches', icon: Calendar },
            { id: 'groups', label: 'Groups', icon: LayoutList },
            { id: 'stats', label: 'Stats', icon: Trophy },
            { id: 'insights', label: 'Insights', icon: LineChart }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-[11px] uppercase font-bold tracking-widest transition-colors border-b-4 whitespace-nowrap ${
                  isActive ? 'border-[#00B25B] text-white' : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/20'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {activeTab === 'matches' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {liveMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-[#00B25B]">
                  <span className="w-2 h-2 bg-[#00B25B] rounded-full animate-pulse"></span>
                  Live Now
                </h2>
                <div className="bg-white border-y sm:border-2 border-[#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] flex flex-col rounded-sm">
                  {liveMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}

            {upcomingMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 text-[#1A1A1A]">
                  Upcoming Fixtures
                </h2>
                <div className="bg-white border-y sm:border-2 border-[#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] flex flex-col rounded-sm">
                  {upcomingMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}

            {finishedMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500">
                  Recent Results
                </h2>
                <div className="bg-white border-y sm:border-2 border-[#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] flex flex-col opacity-80 rounded-sm">
                  {finishedMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex justify-between items-end border-b-2 border-[#1A1A1A] pb-2">
              <h2 className="font-serif italic font-black text-3xl">Standings</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Updated Live</span>
            </div>
            {groups.map(group => (
              <GroupTable key={group.name} group={group} />
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <section>
              <div className="mb-6 border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-serif italic font-black text-3xl">Player Stats</h2>
                <p className="text-[12px] uppercase font-bold tracking-widest mt-1 opacity-60">Golden Boot Race</p>
              </div>
              <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] overflow-hidden">
                <div className="bg-[#1A1A1A] text-white px-4 py-3">
                  <h3 className="font-bold uppercase text-[12px] tracking-widest">Top Scorers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#F4F1EA] text-[#1A1A1A] text-[10px] uppercase tracking-widest border-b border-[#1A1A1A]">
                        <th className="px-4 py-2 w-12 text-center">#</th>
                        <th className="px-4 py-2">Player</th>
                        <th className="px-4 py-2 text-center">Matches</th>
                        <th className="px-4 py-2 text-center font-black">Goals</th>
                        <th className="px-4 py-2 text-center">Assists</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans font-medium text-[#1A1A1A]">
                      {topScorers.map((player, idx) => (
                        <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                          <td className="px-4 py-4 text-center text-xs font-mono">{idx + 1}</td>
                          <td className="px-4 py-4 flex items-center gap-3">
                            <span className="text-2xl flex items-center justify-center w-8 h-8">
                              {player.team.flag?.startsWith('http') ? <img src={player.team.flag} alt={player.team.name} className="w-6 h-6 object-contain" /> : player.team.flag}
                            </span>
                            <div>
                              <div className="font-bold">{player.name}</div>
                              <div className="text-[10px] uppercase tracking-widest opacity-60 mt-0.5">{player.team.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">{player.matches}</td>
                          <td className="px-4 py-4 text-center font-black text-lg">{player.goals}</td>
                          <td className="px-4 py-4 text-center">{player.assists}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            
            <section>
              <div className="mb-6 border-b-2 border-[#1A1A1A] pb-2">
                <h2 className="font-serif italic font-black text-3xl">Team Stats</h2>
                <p className="text-[12px] uppercase font-bold tracking-widest mt-1 opacity-60">Tournament Leaders</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col">
                  <div className="bg-[#1A1A1A] text-white px-4 py-3">
                    <h3 className="font-bold uppercase text-[12px] tracking-widest">Most Goals Scored</h3>
                  </div>
                  <div className="p-4 flex-1">
                    {[
                      { team: 'France', goals: 12, flag: '🇫🇷' },
                      { team: 'England', goals: 10, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
                      { team: 'Brazil', goals: 9, flag: '🇧🇷' },
                      { team: 'Spain', goals: 8, flag: '🇪🇸' },
                      { team: 'Argentina', goals: 7, flag: '🇦🇷' },
                    ].map((t, idx) => (
                      <div key={t.team} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs opacity-50 w-4">{idx + 1}</span>
                          <span>{t.flag}</span>
                          <span className="font-bold">{t.team}</span>
                        </div>
                        <span className="font-black text-lg">{t.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col">
                  <div className="bg-[#1A1A1A] text-white px-4 py-3">
                    <h3 className="font-bold uppercase text-[12px] tracking-widest">Clean Sheets</h3>
                  </div>
                  <div className="p-4 flex-1">
                    {[
                      { team: 'Morocco', cs: 4, flag: '🇲🇦' },
                      { team: 'Brazil', cs: 3, flag: '🇧🇷' },
                      { team: 'Netherlands', cs: 3, flag: '🇳🇱' },
                      { team: 'USA', cs: 2, flag: '🇺🇸' },
                      { team: 'Japan', cs: 2, flag: '🇯🇵' },
                    ].map((t, idx) => (
                      <div key={t.team} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs opacity-50 w-4">{idx + 1}</span>
                          <span>{t.flag}</span>
                          <span className="font-bold">{t.team}</span>
                        </div>
                        <span className="font-black text-lg">{t.cs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 border-b-2 border-[#1A1A1A] pb-2">
              <h2 className="font-serif italic font-black text-3xl">AI Tactical Desk</h2>
              <p className="text-[12px] uppercase font-bold tracking-widest mt-1 opacity-60">Powered by Data Science Models</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ML Win Probability Model */}
              <div className="bg-white p-6 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B25B] mb-2 block flex items-center gap-1">
                  <LineChart size={12}/> Tournament Win Probability
                </span>
                <h3 className="font-serif italic text-xl mb-4 leading-tight">Latest Monte Carlo Simulations</h3>
                
                <div className="space-y-4 flex-1">
                  {[
                    { team: 'France', prob: 22.4, flag: '🇫🇷' },
                    { team: 'Brazil', prob: 18.1, flag: '🇧🇷' },
                    { team: 'England', prob: 14.5, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
                    { team: 'Spain', prob: 11.2, flag: '🇪🇸' },
                    { team: 'Argentina', prob: 9.8, flag: '🇦🇷' },
                  ].map((data, i) => (
                    <div key={data.team} className="group">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-1">
                        <span>{data.flag} {data.team}</span>
                        <span className="font-mono">{data.prob}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#F4F1EA] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-[#00B25B]' : 'bg-[#1A1A1A]'}`}
                          style={{ width: `${(data.prob / 25) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t-2 border-dashed border-[#1A1A1A]">
                  <p className="text-[10px] font-mono text-slate-500">Based on 10,000 tournament simulations incorporating current standings, xG, and squad injuries.</p>
                </div>
              </div>

              {/* Tactical AI Chat */}
              <div className="bg-[#1A1A1A] text-white flex flex-col border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#00B25B] h-[400px]">
                 <div className="p-4 border-b border-white/20 bg-white/5">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B25B] block">Interactive Analyst</span>
                   <h3 className="font-serif italic text-lg leading-tight mt-1">Ask the AI Tactician</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {chatHistory.length === 0 && (
                     <div className="text-center opacity-50 mt-10">
                       <p className="font-serif italic text-lg mb-2">"How will the USA line up?"</p>
                       <p className="text-[10px] uppercase font-bold tracking-widest">Ask about tactics, xG, or matchups</p>
                     </div>
                   )}
                   {chatHistory.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-3 text-sm ${
                         msg.role === 'user' 
                           ? 'bg-[#00B25B] text-[#1A1A1A] font-medium rounded-l-md rounded-tr-md' 
                           : 'bg-white/10 text-white font-serif italic rounded-r-md rounded-tl-md border border-white/10'
                       }`}>
                         {msg.text}
                       </div>
                     </div>
                   ))}
                   {isChatLoading && (
                     <div className="flex justify-start">
                       <div className="max-w-[85%] p-3 text-sm bg-white/10 text-[#00B25B] rounded-r-md rounded-tl-md border border-white/10 flex items-center gap-2">
                         <Loader2 size={14} className="animate-spin" /> <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Analyzing data...</span>
                       </div>
                     </div>
                   )}
                 </div>

                 <form onSubmit={handleChatSubmit} className="p-3 bg-black">
                   <div className="flex gap-2 relative">
                     <input 
                       type="text" 
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       placeholder="Ask about team tactics..."
                       className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:bg-white/20 transition-colors rounded-sm"
                     />
                     <button 
                       type="submit" 
                       disabled={isChatLoading || !chatInput.trim()}
                       className="bg-[#00B25B] text-[#1A1A1A] px-4 py-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                     >
                       <Send size={16} className="transform -translate-y-px translate-x-px" />
                     </button>
                   </div>
                 </form>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer Bar */}
      <footer className="bg-[#1A1A1A] text-white/50 px-4 py-12 mt-auto text-center border-t border-[#1A1A1A]">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Trophy size={16} />
        </div>
        <p className="text-[12px] uppercase tracking-widest mb-2 font-black text-white">WCForecaster<span className="text-[#00B25B]">.</span></p>
        <p className="text-[10px] uppercase tracking-widest opacity-60">Enterprise-Grade Match Predictions powered by Tactical AI</p>
      </footer>

      {toast && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A] flex items-start gap-4 max-w-sm ${toast.type === 'goal' ? 'border-l-4 border-l-[#00B25B]' : ''}`}>
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 {toast.type === 'goal' && <span className="bg-[#00B25B] w-2 h-2 rounded-full animate-pulse"></span>}
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">{toast.title}</h4>
               </div>
               <p className="text-sm font-sans font-medium text-[#1A1A1A]/80">{toast.message}</p>
             </div>
             <button onClick={() => setToast(null)} className="text-slate-400 hover:text-[#1A1A1A] transition-colors mt-1">
               <X size={14} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
