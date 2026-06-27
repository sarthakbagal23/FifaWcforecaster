import React from 'react';
import { Group } from '../types';

export const GroupTable: React.FC<{ group: Group }> = ({ group }) => {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] mb-8 overflow-hidden">
      <div className="bg-[#1A1A1A] text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold uppercase text-[12px] tracking-widest">{group.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-[#F4F1EA] text-[#1A1A1A] text-[10px] uppercase tracking-widest border-b border-[#1A1A1A]">
              <th className="px-4 py-2 w-8 text-center">#</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-2 py-2 text-center" title="Played">PL</th>
              <th className="px-2 py-2 text-center" title="Won">W</th>
              <th className="px-2 py-2 text-center" title="Drawn">D</th>
              <th className="px-2 py-2 text-center" title="Lost">L</th>
              <th className="px-2 py-2 text-center" title="Goal Difference">GD</th>
              <th className="px-4 py-2 text-center font-black">PTS</th>
              <th className="px-4 py-2 text-center">Form</th>
            </tr>
          </thead>
          <tbody className="text-sm font-sans font-medium text-[#1A1A1A]">
            {group.teams.map((stats, idx) => (
              <tr key={stats.team.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                <td className="px-4 py-3 text-center text-xs font-mono">{idx + 1}</td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xl flex items-center justify-center w-6 h-6">
                    {stats.team.flag?.startsWith('http') ? <img src={stats.team.flag} alt={stats.team.name} className="w-5 h-5 object-contain" /> : stats.team.flag}
                  </span>
                  <span className="font-bold">{stats.team.name}</span>
                </td>
                <td className="px-2 py-3 text-center">{stats.played}</td>
                <td className="px-2 py-3 text-center">{stats.won}</td>
                <td className="px-2 py-3 text-center">{stats.drawn}</td>
                <td className="px-2 py-3 text-center">{stats.lost}</td>
                <td className="px-2 py-3 text-center">{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</td>
                <td className="px-4 py-3 text-center font-black">{stats.points}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {/* Mocked form using index */}
                    {[['W','W','D'], ['W','D','L'], ['D','L','L'], ['L','L','L']][idx % 4]?.map((r, i) => (
                      <span key={i} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white ${r === 'W' ? 'bg-[#00B25B]' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}>{r}</span>
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
