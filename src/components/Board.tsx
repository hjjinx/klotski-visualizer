import { Trash2 } from "lucide-react";
import { type Block, BOARD_WIDTH, BOARD_HEIGHT, BLOCK_TYPES } from "../constants";

const Board: React.FC<{ 
  blocks: Block[], 
  selectedBlockId: number | null, 
  onBlockClick: (id: number) => void, 
  mode: string, 
  onRemoveBlock?: (id: number) => void 
}> = ({ blocks, selectedBlockId, onBlockClick, mode, onRemoveBlock }) => {
  return (
    <div 
      className="bg-[#2a2a35] p-2 rounded-xl shadow-2xl border-4 border-[#3f3f4e] relative"
      style={{ width: `${BOARD_WIDTH * 80 + 24}px`, height: `${BOARD_HEIGHT * 80 + 24}px` }}
    >
      <div className="relative w-full h-full bg-[#1a1a23] rounded-lg overflow-hidden border border-slate-700/50">
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-5 pointer-events-none opacity-10">
           {[...Array(20)].map((_, i) => <div key={i} className="border border-white/20"></div>)}
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 pointer-events-none z-0">
          <div className="absolute bottom-0 w-full h-full bg-linear-to-t from-emerald-900/20 to-transparent" />
          <div className="absolute bottom-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
          <div className="absolute bottom-0 w-full border-b-2 border-dashed border-emerald-500/30" />
        </div>

        {blocks.map(block => {
           const bt = BLOCK_TYPES[block.type];
           const isSelected = selectedBlockId === block.id;
           
           return (
             <div
                key={block.id}
                onClick={() => onBlockClick(block.id)}
                className={`absolute transition-all duration-200 cursor-pointer group
                  ${isSelected ? 'z-20' : 'z-10'}
                `}
                style={{
                  width: bt.w * 80,
                  height: bt.h * 80,
                  transform: `translate(${block.x * 80}px, ${block.y * 80}px)`
                }}
             >
               <div className="w-full h-full p-1">
                  <div className={`
                    w-full h-full rounded-lg shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]
                    flex items-center justify-center relative
                    ${bt.color}
                    ${isSelected ? 'ring-4 ring-white ring-opacity-60 brightness-110' : 'hover:brightness-105'}
                    border border-white/10
                  `}>
                     <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                     <span className="text-white/90 font-bold text-shadow-sm select-none z-10 text-xl">
                       {bt.w === 2 && bt.h === 2 ? '♔' : ''}
                     </span>

                     {mode === 'create' && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onRemoveBlock?.(block.id); }}
                         className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg transform scale-0 group-hover:scale-100 transition-transform z-30">
                         <Trash2 size={12} />
                       </button>
                     )}
                  </div>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default Board;