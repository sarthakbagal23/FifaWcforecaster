import React from 'react';
import { Group } from '../types';

export const GroupTable: React.FC<{ group: Group }> = ({ group }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl mb-8 overflow-hidden shadow-lg">
      <div className="bg-white/5 border-b border-white/10 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold uppercase text-[12px] tracking-widest text-[#00B25B]">{group.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-black/20 text-white/50 text-[10px] uppercase tracking-widest border-b border-white/10">
              <th className="px-4 py-3 w-8 text-center">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-2 py-3 text-center" title="Played">PL</th>
              <th className="px-2 py-3 text-center" title="Won">W</th>
              <th className="px-2 py-3 text-center" title="Drawn">D</th>
              <th className="px-2 py-3 text-center" title="Lost">L</th>
              <th className="px-2 py-3 text-center" title="Goal Difference">GD</th>
              <th className="px-4 py-3 text-center font-black text-white/80">PTS</th>
              <th className="px-4 py-3 text-center">Form</th>
            </tr>
          </thead>
          <tbody className="text-sm font-sans font-medium text-white">
            {group.teams.map((stats, idx) => (
              <tr key={stats.team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0">
                <td className="px-4 py-4 text-center text-xs font-mono text-white/50">{idx + 1}</td>
                <td className="px-4 py-4 flex items-center gap-3">
                  <span className="text-xl flex items-center justify-center w-7 h-7 drop-shadow-md bg-white/10 rounded-full p-1 border border-white/10">
                    {stats.team.flag?.startsWith('http') ? <img src={stats.team.flag} alt={stats.team.name} className="w-5 h-5 object-contain" /> : stats.team.flag}
                  </span>
                  <span className="font-bold tracking-tight">{stats.team.name}</span>
                </td>
                <td className="px-2 py-4 text-center text-white/70">{stats.played}</td>
                <td className="px-2 py-4 text-center text-white/70">{stats.won}</td>
                <td className="px-2 py-4 text-center text-white/70">{stats.drawn}</td>
                <td className="px-2 py-4 text-center text-white/70">{stats.lost}</td>
                <td className="px-2 py-4 text-center text-white/70">{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</td>
                <td className="px-4 py-4 text-center font-black text-lg text-white">{stats.points}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Mocked form using index */}
                    {[['W','W','D'], ['W','D','L'], ['D','L','L'], ['L','L','L']][idx % 4]?.map((r, i) => (
                      <span key={i} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white shadow-sm ${r === 'W' ? 'bg-[#00B25B]' : r === 'D' ? 'bg-slate-500' : 'bg-red-500'}`}>{r}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
