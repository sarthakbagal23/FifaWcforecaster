import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_MATCHES, GROUPS, TOP_SCORERS } from './data';
import { MatchCard } from './components/MatchCard';
import { GroupTable } from './components/GroupTable';
import { Match, Group, WinProbabilityEntry, WinProbabilityResult } from './types';
import { Trophy, Calendar, LayoutList, LineChart, Send, Loader2, Bell, X, LogIn, LogOut, Share2, Menu } from 'lucide-react';
import { auth, db, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const prevMatchesRef = useRef<Map<string, Match>>(new Map(INITIAL_MATCHES.map(m => [m.id, m])));
  const [groups, setGroups] = useState<Group[]>(GROUPS);
  const [topScorers, setTopScorers] = useState<any[]>(TOP_SCORERS);
  const [activeTab, setActiveTab] = useState<'matches' | 'groups' | 'stats' | 'insights'>('matches');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Win Probability State (replaces hardcoded Insights data)
  const [winProb, setWinProb] = useState<WinProbabilityEntry[]>([]);
  const [winProbLoading, setWinProbLoading] = useState(false);
  const [winProbMethodology, setWinProbMethodology] = useState('');

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

            // Handle real-time notifications
            mappedMatches.forEach(m => {
              const existing = prevMatchesRef.current.get(m.id);
              if (existing) {
                if (existing.status === 'live' || m.status === 'live') {
                  if (existing.scoreA !== undefined && m.scoreA !== undefined && m.scoreA > existing.scoreA) {
                    const event = {
                      id: Date.now().toString() + 'A',
                      type: 'goal' as 'goal' | 'event',
                      title: `GOAL! ${m.teamA.name}`,
                      message: `${m.teamA.name} scores against ${m.teamB.name}! (${m.scoreA} - ${m.scoreB})`
                    };
                    setToast(event);
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(event.title, { body: event.message });
                    }
                    setTimeout(() => setToast(null), 6000);
                  } else if (existing.scoreB !== undefined && m.scoreB !== undefined && m.scoreB > existing.scoreB) {
                    const event = {
                      id: Date.now().toString() + 'B',
                      type: 'goal' as 'goal' | 'event',
                      title: `GOAL! ${m.teamB.name}`,
                      message: `${m.teamB.name} scores against ${m.teamA.name}! (${m.scoreA} - ${m.scoreB})`
                    };
                    setToast(event);
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(event.title, { body: event.message });
                    }
                    setTimeout(() => setToast(null), 6000);
                  } else if (existing.status === 'upcoming' && m.status === 'live') {
                    const event = {
                      id: Date.now().toString() + 'K',
                      type: 'event' as 'goal' | 'event',
                      title: `KICKOFF`,
                      message: `${m.teamA.name} vs ${m.teamB.name} has started!`
                    };
                    setToast(event);
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(event.title, { body: event.message });
                    }
                    setTimeout(() => setToast(null), 6000);
                  } else if (existing.status === 'live' && m.status === 'finished') {
                    const event = {
                      id: Date.now().toString() + 'F',
                      type: 'event' as 'goal' | 'event',
                      title: `FULL TIME`,
                      message: `${m.teamA.name} ${m.scoreA} - ${m.scoreB} ${m.teamB.name}`
                    };
                    setToast(event);
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(event.title, { body: event.message });
                    }
                    setTimeout(() => setToast(null), 6000);
                  }
                }
              }
            });

            // Update ref with latest map
            prevMatchesRef.current = new Map(mappedMatches.map(m => [m.id, m]));

            setMatches(prev => {
              const prevMap = new Map<string, Match>(prev.map(p => [p.id, p]));
              return mappedMatches.map(m => {
                const existing = prevMap.get(m.id);
                if (existing) {
                  return { 
                    ...m, 
                    userPrediction: existing.userPrediction, 
                    aiPrediction: existing.aiPrediction, 
                    aiScoreA: existing.aiScoreA,
                    aiScoreB: existing.aiScoreB,
                    aiKeyBattle: existing.aiKeyBattle,
                    aiXGProjection: existing.aiXGProjection,
                    aiConfidence: existing.aiConfidence,
                    isAiLoading: existing.isAiLoading, 
                    lineups: existing.lineups 
                  };
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
        m.id === matchId ? { 
          ...m, 
          isAiLoading: false, 
          aiPrediction: data.analysis || data.error || "Tactical brief unavailable.",
          aiScoreA: data.scoreA,
          aiScoreB: data.scoreB,
          // New richer fields from improved prompt
          aiKeyBattle: data.keyBattle,
          aiXGProjection: data.xGProjection,
          aiConfidence: data.confidence,
        } : m
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
      // Build context from all completed matches
      const context = matches.filter(m => m.status !== 'upcoming').map(m => `${m.teamA.name} ${m.scoreA}-${m.scoreB} ${m.teamB.name}`).join(', ');
      
      const response = await fetch('/api/tactical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass full history so the AI has multi-turn context
        body: JSON.stringify({ prompt: chatInput, context, history: chatHistory })
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

  const handleSharePredictions = async () => {
    const predictedMatches = matches.filter(m => m.userPrediction);
    if (predictedMatches.length === 0) {
      setToast({
        id: Date.now().toString(),
        type: 'event',
        title: 'No Predictions',
        message: 'You have not made any predictions yet.'
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    let text = "My World Cup Forecasts 🏆⚽\n\n";
    predictedMatches.forEach(m => {
      text += `${m.teamA.name} ${m.userPrediction!.scoreA} - ${m.userPrediction!.scoreB} ${m.teamB.name}\n`;
    });
    text += "\nMade on WCForecaster.";

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My World Cup Forecasts',
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setToast({
          id: Date.now().toString(),
          type: 'event',
          title: 'Copied!',
          message: 'Predictions copied to clipboard.'
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const fetchWinProbabilities = async () => {
    setWinProbLoading(true);
    try {
      const completedMatches = matches
        .filter(m => m.status === 'finished' && m.scoreA !== undefined)
        .map(m => ({ teamA: m.teamA.name, scoreA: m.scoreA, scoreB: m.scoreB, teamB: m.teamB.name }));

      const response = await fetch('/api/win-probability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standings: groups, completedMatches }),
      });
      if (response.ok) {
        const data: WinProbabilityResult = await response.json();
        if (data.probabilities && data.probabilities.length > 0) {
          setWinProb(data.probabilities);
          setWinProbMethodology(data.methodology || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch win probabilities', err);
    } finally {
      setWinProbLoading(false);
    }
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const finishedMatches = matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#1A1A1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#00B25B]" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">Loading Desk...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#0D1117] relative flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,178,91,0.15),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00B25B]/50 to-transparent"></div>
        <div className="absolute -inset-[100%] opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl p-8 max-w-sm w-full border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl shadow-[#00B25B]/30 border-2 border-[#00B25B] mb-6 transform hover:scale-105 transition-transform duration-500">
            <img src="/logo.jpg" alt="WC Forecaster Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-sans font-black text-3xl tracking-tighter uppercase leading-none mb-2 text-white">
            WCForecaster<span className="text-[#00B25B]">.</span>
          </h1>
          <p className="text-[12px] uppercase font-bold tracking-widest text-white/50 mb-8">
            Tactical Analysis & Predictions
          </p>
          
          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full bg-[#00B25B] text-white py-3 px-4 font-bold text-sm uppercase tracking-widest hover:bg-[#00904a] transition-all rounded-xl shadow-lg shadow-[#00B25B]/20 flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Sign In to Forecast
            </button>
            <button 
              onClick={() => setIsGuest(true)}
              className="w-full bg-white/5 text-white/80 border border-white/10 py-3 px-4 font-bold text-sm uppercase tracking-widest hover:bg-white/10 hover:text-white rounded-xl transition-all"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-slate-200 font-sans flex flex-col custom-scrollbar overflow-y-auto">
      {/* Top Bar (Glassmorphism FotMob style) */}
      <header className="sticky top-0 z-20 bg-[#0D1117]/80 backdrop-blur-xl border-b border-white/10 shadow-md">
        <div className="px-4 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-[#00B25B]/20 border-2 border-[#00B25B]">
              <img src="/logo.jpg" alt="WC Forecaster Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-sans font-black text-2xl tracking-tighter uppercase leading-none mt-1 text-white">
              WCForecaster<span className="text-[#00B25B]">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSharePredictions}
              className="p-1.5 rounded-lg transition-all text-[#00B25B] bg-[#00B25B]/10 hover:bg-[#00B25B]/20"
              title="Share My Predictions"
            >
              <Share2 size={18} />
            </button>
            <button 
              onClick={requestNotificationPermission}
              className={`p-1.5 rounded-lg transition-all ${notificationPermission === 'granted' ? 'text-[#00B25B] bg-[#00B25B]/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              title={notificationPermission === 'granted' ? "Notifications Enabled" : "Enable Notifications"}
            >
              <Bell size={18} />
            </button>
            <div className="hidden sm:block text-right">
              {user ? (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-[#00B25B] font-bold">Welcome,</p>
                  <p className="text-[12px] font-mono font-bold text-white truncate max-w-[100px]">{user.displayName || 'Forecaster'}</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Access</p>
                  <p className="text-[12px] font-mono font-bold text-white/80">Guest Mode</p>
                </>
              )}
            </div>
            {user ? (
              <button 
                onClick={() => {
                  signOut(auth);
                  setIsGuest(false);
                }}
                className="bg-white/5 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border border-white/10 transition-all flex items-center gap-1"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button 
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="bg-gradient-to-br from-[#00B25B] to-[#00904a] text-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border border-white/10 hover:shadow-lg hover:shadow-[#00B25B]/20 transition-all flex items-center gap-1"
              >
                <LogIn size={14} /> <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop Sub-nav */}
        <nav className="hidden md:flex overflow-x-auto max-w-5xl mx-auto w-full px-2 hide-scrollbar pt-2 pb-2 border-t border-white/10">
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
                className={`relative flex items-center gap-2 px-6 py-4 text-[11px] uppercase font-bold tracking-widest transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#00B25B]' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="desktopActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00B25B]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 pb-24 md:pb-8 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'matches' && (
            <motion.div 
              key="matches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
            {liveMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-[#00B25B]">
                  <span className="w-2 h-2 bg-[#00B25B] rounded-full animate-pulse shadow-[0_0_8px_#00B25B]"></span>
                  Live Now
                </h2>
                <div className="flex flex-col">
                  {liveMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}

            {upcomingMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-white/70">
                  Upcoming Fixtures
                </h2>
                <div className="flex flex-col">
                  {upcomingMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}

            {finishedMatches.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-white/50">
                  Recent Results
                </h2>
                <div className="flex flex-col opacity-80">
                  {finishedMatches.map(match => (
                    <MatchCard key={match.id} match={match} onPredict={handlePredict} onGetAiInsight={handleGetAiInsight} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div 
            key="groups"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex justify-between items-end border-b border-white/10 pb-3">
              <h2 className="font-sans font-bold text-2xl text-white">Standings</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Updated Live</span>
            </div>
            {groups.map(group => (
              <GroupTable key={group.name} group={group} />
            ))}
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <section>
              <div className="mb-6 border-b border-white/10 pb-3">
                <h2 className="font-sans font-bold text-2xl text-white">Player Stats</h2>
                <p className="text-[12px] uppercase font-bold tracking-widest mt-1 text-[#00B25B]">Golden Boot Race</p>
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-black/20 border-b border-white/10 text-white px-4 py-3">
                  <h3 className="font-bold uppercase text-[12px] tracking-widest">Top Scorers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-black/20 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/10">
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3">Player</th>
                        <th className="px-4 py-3 text-center">Matches</th>
                        <th className="px-4 py-3 text-center font-black text-white/80">Goals</th>
                        <th className="px-4 py-3 text-center">Assists</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-sans font-medium text-white">
                      {topScorers.map((player, idx) => (
                        <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0">
                          <td className="px-4 py-4 text-center text-xs font-mono text-white/50">{idx + 1}</td>
                          <td className="px-4 py-4 flex items-center gap-3">
                            <span className="text-2xl flex items-center justify-center w-8 h-8 drop-shadow-md bg-white/10 rounded-full p-1 border border-white/10">
                              {player.team.flag?.startsWith('http') ? <img src={player.team.flag} alt={player.team.name} className="w-6 h-6 object-contain" /> : player.team.flag}
                            </span>
                            <div>
                              <div className="font-bold">{player.name}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/50 mt-0.5">{player.team.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-white/70">{player.matches}</td>
                          <td className="px-4 py-4 text-center font-black text-lg text-white">{player.goals}</td>
                          <td className="px-4 py-4 text-center text-white/70">{player.assists}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            
            <section>
              <div className="mb-6 border-b border-white/10 pb-3">
                <h2 className="font-sans font-bold text-2xl text-white">Team Stats</h2>
                <p className="text-[12px] uppercase font-bold tracking-widest mt-1 text-[#00B25B]">Tournament Leaders</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl flex flex-col overflow-hidden shadow-lg">
                  <div className="bg-black/20 border-b border-white/10 text-white px-4 py-3">
                    <h3 className="font-bold uppercase text-[12px] tracking-widest">Most Goals Scored</h3>
                  </div>
                  <div className="p-4 flex-1 text-white">
                    {[
                      { team: 'France', goals: 12, flag: '🇫🇷' },
                      { team: 'England', goals: 10, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
                      { team: 'Brazil', goals: 9, flag: '🇧🇷' },
                      { team: 'Spain', goals: 8, flag: '🇪🇸' },
                      { team: 'Argentina', goals: 7, flag: '🇦🇷' },
                    ].map((t, idx) => (
                      <div key={t.team} className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-white/50 w-4">{idx + 1}</span>
                          <span className="drop-shadow-md bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs">{t.flag}</span>
                          <span className="font-bold">{t.team}</span>
                        </div>
                        <span className="font-black text-lg">{t.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl flex flex-col overflow-hidden shadow-lg">
                  <div className="bg-black/20 border-b border-white/10 text-white px-4 py-3">
                    <h3 className="font-bold uppercase text-[12px] tracking-widest">Clean Sheets</h3>
                  </div>
                  <div className="p-4 flex-1 text-white">
                    {[
                      { team: 'Morocco', cs: 4, flag: '🇲🇦' },
                      { team: 'Brazil', cs: 3, flag: '🇧🇷' },
                      { team: 'Netherlands', cs: 3, flag: '🇳🇱' },
                      { team: 'USA', cs: 2, flag: '🇺🇸' },
                      { team: 'Japan', cs: 2, flag: '🇯🇵' },
                    ].map((t, idx) => (
                      <div key={t.team} className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-white/50 w-4">{idx + 1}</span>
                          <span className="drop-shadow-md bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs">{t.flag}</span>
                          <span className="font-bold">{t.team}</span>
                        </div>
                        <span className="font-black text-lg">{t.cs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 border-b border-white/10 pb-3 flex justify-between items-end">
              <div>
                <h2 className="font-sans font-bold text-2xl text-white">AI Tactical Desk</h2>
                <p className="text-[12px] uppercase font-bold tracking-widest mt-1 text-[#00B25B]">Live Monte Carlo · LLM Analysis</p>
              </div>
              {winProb.length === 0 && !winProbLoading && (
                <button
                  onClick={fetchWinProbabilities}
                  className="text-[10px] font-bold uppercase tracking-widest border border-white/20 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all"
                >
                  Run Simulation
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dynamic Win Probability */}
              <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00B25B]/5 rounded-full blur-[50px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B25B] mb-2 flex items-center gap-1">
                  <LineChart size={12}/> Tournament Win Probability
                </span>
                <h3 className="font-sans font-bold text-xl mb-4 leading-tight text-white">Monte Carlo Simulation</h3>

                {winProbLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3 text-[#00B25B]">
                    <Loader2 size={28} className="animate-spin" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Running 10,000 simulations...</p>
                  </div>
                )}

                {!winProbLoading && winProb.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 gap-4 text-center">
                    <LineChart size={32} className="text-white/20" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Simulation not yet run</p>
                    <button
                      onClick={fetchWinProbabilities}
                      className="bg-gradient-to-br from-[#00B25B] to-[#00904a] text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#00B25B]/20 transition-all"
                    >
                      Run AI Simulation
                    </button>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-white/30">
                      Uses live standings + squad analysis
                    </p>
                  </div>
                )}

                {!winProbLoading && winProb.length > 0 && (
                  <>
                    <div className="space-y-4 flex-1">
                      {winProb.map((data, i) => {
                        const maxProb = winProb[0]?.prob || 25;
                        const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
                        const trendColor = data.trend === 'up' ? 'text-[#00B25B]' : data.trend === 'down' ? 'text-red-400' : 'text-white/40';
                        return (
                          <div key={data.team} className="group">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-1.5 text-white">
                              <span className="flex items-center gap-2">
                                <span className="drop-shadow-md bg-white/10 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{data.flag}</span>
                                {data.team}
                                <span className={`text-xs font-black ${trendColor}`} title={`Trend: ${data.trend}`}>{trendIcon}</span>
                              </span>
                              <span className="font-mono text-white/80">{data.prob.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-gradient-to-r from-[#00B25B] to-[#00904a] shadow-[0_0_8px_#00B25B]' : 'bg-white/30'}`}
                                style={{ width: `${(data.prob / maxProb) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                      {winProbMethodology && (
                        <p className="text-[10px] font-mono text-white/50 italic">{winProbMethodology}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-mono text-white/30">Rest of field combined probability not shown</p>
                        <button
                          onClick={fetchWinProbabilities}
                          className="text-[9px] font-bold uppercase tracking-widest text-[#00B25B]/60 hover:text-[#00B25B] transition-colors"
                        >
                          Refresh ↻
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </div>

              {/* Tactical AI Chat — improved with suggested prompts */}
              <div className="glass-panel flex flex-col rounded-2xl shadow-lg h-[480px] overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00B25B]/5 rounded-full blur-[50px] pointer-events-none"></div>
                 <div className="relative z-10 p-4 border-b border-white/10 bg-black/20">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B25B] block">Alex — AI Analyst</span>
                   <h3 className="font-sans font-bold text-lg leading-tight mt-0.5 text-white">Tactical Desk</h3>
                 </div>
                 
                 <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {chatHistory.length === 0 && (
                     <div className="space-y-3 mt-4">
                       <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 text-center mb-3">Try asking:</p>
                       {[
                         "How will France's press disrupt Brazil?",
                         "Who wins the Golden Boot?",
                         "What's USA's biggest tactical weakness?",
                         "England vs Spain — who advances?",
                       ].map(suggestion => (
                         <button
                           key={suggestion}
                           onClick={() => setChatInput(suggestion)}
                           className="w-full text-left px-3 py-2.5 text-[12px] bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all font-sans"
                         >
                           "{suggestion}"
                         </button>
                       ))}
                     </div>
                   )}
                   {chatHistory.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[88%] p-3 text-sm ${
                         msg.role === 'user' 
                           ? 'bg-gradient-to-br from-[#00B25B] to-[#00904a] text-white font-medium rounded-2xl rounded-tr-sm shadow-md' 
                           : 'bg-white/10 text-white/90 rounded-2xl rounded-tl-sm border border-white/10 leading-relaxed'
                       }`}>
                         {msg.role === 'ai' && (
                           <span className="block text-[9px] uppercase tracking-widest font-bold text-[#00B25B] mb-1.5">Alex</span>
                         )}
                         {msg.text}
                       </div>
                     </div>
                   ))}
                   {isChatLoading && (
                     <div className="flex justify-start">
                       <div className="p-3 text-sm bg-white/10 text-[#00B25B] rounded-2xl rounded-tl-sm border border-white/10 flex items-center gap-2">
                         <Loader2 size={14} className="animate-spin" /> <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Alex is analyzing...</span>
                       </div>
                     </div>
                   )}
                 </div>

                 <form onSubmit={handleChatSubmit} className="relative z-10 p-3 bg-black/20 border-t border-white/10">
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       placeholder="Ask Alex about tactics, xG, matchups..."
                       className="flex-1 bg-black/30 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:bg-black/50 border border-white/10 focus:border-[#00B25B]/50 transition-all rounded-xl"
                     />
                     <button 
                       type="submit" 
                       disabled={isChatLoading || !chatInput.trim()}
                       className="bg-gradient-to-br from-[#00B25B] to-[#00904a] text-white px-4 py-3 hover:shadow-[0_0_15px_rgba(0,178,91,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                     >
                       <Send size={16} className="transform -translate-y-px translate-x-px" />
                     </button>
                   </div>
                 </form>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
      
      {/* Footer Bar */}
      <footer className="bg-black/40 text-white/50 px-4 py-12 pb-24 md:pb-12 mt-auto text-center border-t border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Trophy size={16} className="text-white" />
        </div>
        <p className="text-[12px] uppercase tracking-widest mb-2 font-black text-white">WCForecaster<span className="text-[#00B25B]">.</span></p>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Enterprise-Grade Match Predictions powered by Tactical AI</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1117]/90 backdrop-blur-2xl border-t border-white/10 pt-2 pb-safe">
        <div className="flex justify-around items-center h-14">
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
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-[#00B25B]' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Icon size={20} />
                </motion.div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobileActiveTab"
                    className="absolute top-0 left-1/2 w-8 h-[2px] bg-[#00B25B] -translate-x-1/2 rounded-full shadow-[0_0_8px_#00B25B]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {toast && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm ${toast.type === 'goal' ? 'border-l-4 border-l-[#00B25B]' : ''}`}>
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 {toast.type === 'goal' && <span className="bg-[#00B25B] w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_#00B25B]"></span>}
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">{toast.title}</h4>
               </div>
               <p className="text-sm font-sans font-medium text-white/80">{toast.message}</p>
             </div>
             <button onClick={() => setToast(null)} className="text-white/40 hover:text-white transition-colors mt-1">
               <X size={14} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
