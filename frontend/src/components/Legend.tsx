import { getScoreColor } from '../utils';

export default function Legend() {
  const stops = [0, 20, 35, 50, 65, 80];
  const labels = ['Low Risk', '', '', '', '', 'Critical'];

  return (
    <div className="absolute bottom-6 left-[340px] z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-slate-700 shadow-xl">
      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">
        Safety Context Score
      </div>
      <div className="flex items-center gap-0">
        {stops.map((val, i) => (
          <div key={val} className="flex flex-col items-center" style={{ width: 36 }}>
            <div
              className="w-full h-3 first:rounded-l last:rounded-r"
              style={{ backgroundColor: getScoreColor(val + 10) }}
            />
            {(i === 0 || i === stops.length - 1) && (
              <span className="text-[9px] text-slate-500 mt-1">{labels[i]}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-slate-400">Safety Desert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Higher score = more risk</span>
        </div>
      </div>
    </div>
  );
}
