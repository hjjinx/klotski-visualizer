import { Trash2, Save, ArrowLeft } from "lucide-react";
import { BLOCK_TYPES, BOARD_HEIGHT, BOARD_WIDTH, type Block } from "../constants";
import { cloneBlocks, isOccupied } from "../utils";
import Board from "./Board";
import ToolboxButton from "./ToolboxButton"
import { useState } from "react";

const CreatePuzzle: React.FC<{ 
  puzzles: { id: number; name: string; layout: Block[] }[]; 
  setPuzzles: React.Dispatch<React.SetStateAction<{ id: number; name: string; layout: Block[] }[]>>;
  setActiveTab: (tab: 'play' | 'create') => void;
  setActivePuzzle: (puzzle: { id: number; name: string; layout: Block[] } | null) => void;
}>  = ({puzzles, setPuzzles, setActiveTab, setActivePuzzle}) => {
  const [createBlocks, setCreateBlocks] = useState<Block[]>([]);
  const [newPuzzleName, setNewPuzzleName] = useState('');

  const handleAddBlock = (typeKey: keyof typeof BLOCK_TYPES) => {
    const bt = BLOCK_TYPES[typeKey];
    // Simple find first spot
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        // let fits = true;
        if (x + bt.w > BOARD_WIDTH || y + bt.h > BOARD_HEIGHT) continue;
        // const mock = { id: -1, type: typeKey, x, y, w: bt.w, h: bt.h };
        // Check collision against createBlocks
        // Note: isOccupied expects blocks to have 'type' to lookup dimensions usually, 
        // but here we are checking if *existing* blocks overlap *this* new space.
        // We pass createBlocks. Existing blocks have valid types.
        
        // We need to check if the NEW space is occupied by ANY existing block
        let spaceFree = true;
        for(let checkX = x; checkX < x + bt.w; checkX++) {
            for(let checkY = y; checkY < y + bt.h; checkY++) {
                if(isOccupied(checkX, checkY, createBlocks)) {
                    spaceFree = false;
                }
            }
        }

        if (spaceFree) {
              const newId = Math.max(0, ...createBlocks.map(b => b.id)) + 1;
              setCreateBlocks([...createBlocks, { id: newId, type: typeKey, x, y }]);
              return;
        }
      }
    }
    alert("No space available for this block.");
  };


  const handleSavePuzzle = () => {
    if (!newPuzzleName.trim()) {
      alert("Please give your puzzle a name.");
      return;
    }
    if (createBlocks.length === 0) {
      alert("Board is empty!");
      return;
    }
    
    const newPuzzle = {
      id: Date.now(),
      name: newPuzzleName,
      layout: cloneBlocks(createBlocks)
    };

    setPuzzles([...puzzles, newPuzzle]);
    localStorage.setItem('customPuzzles', JSON.stringify([...puzzles, newPuzzle]));
    setNewPuzzleName('');
    setCreateBlocks([]);
    alert("Puzzle Saved!");
    setActiveTab('play');
  };


  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl shrink-0 p-6 overflow-y-auto">
        <button 
          onClick={() => {setActiveTab('play'); setActivePuzzle(null);}}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Menu
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Puzzle Builder</h2>
        
        <div className="space-y-4 mb-8">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocks</h3>
           <div className="grid grid-cols-2 gap-3">
              <ToolboxButton onClick={() => handleAddBlock('MAIN')} label="King" h="h-12" w="w-12" color="bg-red-500" />
              <ToolboxButton onClick={() => handleAddBlock('VERT')} label="Vertical" h="h-12" w="w-6" color="bg-amber-600" />
              <ToolboxButton onClick={() => handleAddBlock('HORZ')} label="Horizontal" h="h-6" w="w-12" color="bg-amber-600" />
              <ToolboxButton onClick={() => handleAddBlock('SOLDIER')} label="Pawn" h="h-6" w="w-6" color="bg-yellow-200" />
           </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-700">
           <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Puzzle Name</label>
           <input 
             type="text" 
             value={newPuzzleName}
             onChange={(e) => setNewPuzzleName(e.target.value)}
             placeholder="My Awesome Puzzle"
             className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
           />
           <div className="flex gap-2">
             <button 
               onClick={() => setCreateBlocks([])}
               className="px-4 py-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg border border-red-900/30 transition-colors"
             >
               <Trash2 size={20} />
             </button>
             <button 
               onClick={handleSavePuzzle}
               className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
             >
               <Save size={20} /> Save Puzzle
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center relative bg-[radial-gradient(#334155_1px,transparent_1px)] bg-size-[20px_20px]">
         <div className="mb-4 text-slate-400 text-sm bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm">
            Drag & Drop is disabled. Click blocks in toolbox to add, click 'Trash' icon on block to remove.
         </div>
         <Board 
           blocks={createBlocks} 
           selectedBlockId={null} 
           onBlockClick={() => {}}
           mode="create"
           onRemoveBlock={(id) => setCreateBlocks(createBlocks.filter(b => b.id !== id))}
         />
      </div>
    </div>
  )
}

export default CreatePuzzle;