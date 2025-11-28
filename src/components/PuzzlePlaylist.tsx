import { Activity, Layout, Play, Plus, RotateCcw } from "lucide-react";
import type { Block } from "../constants";

const PuzzlePlaylist: React.FC<{ 
  puzzles: { id: number; name: string; layout: Block[] }[]; 
  selectPuzzleToPlay: (puzzle: { id: number; name: string; layout: Block[] }) => void;
  setActiveTab: (tab: 'play' | 'create') => void;
}> = ({puzzles, selectPuzzleToPlay, setActiveTab}) => {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 p-6 shadow-lg ring-1 ring-black/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-600/20 text-red-400">
            <Play size={22} />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">How to Play</h3>
        </div>
        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono h-min">1</span>
            <span>Select a puzzle below to load its starting layout.</span>
          </li>
          <li className="flex gap-3">
            <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono h-min">2</span>
            <span>Click a block to highlight it. Use W A S D or arrow keys to slide it if space permits.</span>
          </li>
          <li className="flex gap-3">
            <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono h-min">3</span>
            <span>Guide the red King block to the exit: bottom center position.</span>
          </li>
          <li className="flex gap-3">
            <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono h-min">4</span>
            <span>Use Reset to restart. Use Analyze to explore the state-space graph of all reachable positions.</span>
          </li>
          <li className="flex gap-3">
            <span className="px-2 py-1 rounded-md bg-slate-700 text-xs font-mono h-min">5</span>
            <span>Create mode lets you design custom layouts and save them for later play.</span>
          </li>
        </ol>
        <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-700/40 rounded-lg p-3">
            <RotateCcw size={16} className="text-slate-400" />
            <span className="text-slate-400">Reset anytime</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-700/40 rounded-lg p-3">
            <Activity size={16} className="text-purple-400" />
            <span className="text-slate-400">Analyze Search Space</span>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-slate-500 italic">
          Tip: Selecting far blocks is easier with arrow keys: first select one, then use arrow keys to jump the highlight in a direction.
        </p>
      </div>
      <h2 className="text-3xl font-bold text-white mb-6">Select a Puzzle</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {puzzles.map(p => (
          <div 
            key={p.id} 
            onClick={() => selectPuzzleToPlay(p)}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 cursor-pointer transition-all shadow-lg group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Layout size={24} />
              </div>
              <span className="text-xs text-slate-500 font-mono">{p.layout.length} blocks</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-100">{p.name}</h3>
            <p className="text-slate-400 text-sm mt-2">Click to start solving</p>
          </div>
        ))}
        
        {/* Helper Card to direct to Create */}
        <div 
          onClick={() => setActiveTab('create')}
          className="border-2 border-dashed border-slate-700 p-6 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-slate-500 hover:text-slate-300 cursor-pointer transition-all min-h-40"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Create New Puzzle</span>
        </div>
      </div>
    </div>
  );
}

export default PuzzlePlaylist;