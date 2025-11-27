import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  Grid, 
  ArrowLeft, 
  Layout, 
  Activity, 
  RotateCcw,
  ArrowUp, ArrowDown, ArrowRight
} from 'lucide-react';
import { BOARD_WIDTH, BOARD_HEIGHT, BLOCK_TYPES, type Block, type Puzzle, type Link, type Node } from './constants';
import { cloneBlocks, canMove, hashState, isOccupied, getCurrentNode, getPuzzlesFromLocalStorage } from './utils';
import ForceGraphWrapper from './components/Graph';
import TabButton from './components/TabButton';
import ToolboxButton from './components/ToolboxButton';
import Board from './components/Board';


export default function KlotskiApp() {
  const [activeTab, setActiveTab] = useState('play');
  const [puzzles, setPuzzles] = useState<Puzzle[]>(getPuzzlesFromLocalStorage());
  
  // Play Mode State
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [playBlocks, setPlayBlocks] = useState<Block[]>([]);
  const [playSelection, setPlaySelection] = useState<number | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  // Create Mode State
  const [createBlocks, setCreateBlocks] = useState<Block[]>([]);
  const [newPuzzleName, setNewPuzzleName] = useState('');
  const [maxNodes, setMaxNodes] = useState(1000);
  const maxNodesRef = useRef(1000);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);

  // Graph State
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphLibLoaded, setGraphLibLoaded] = useState(true);
  const [showWinningPathOnly, setShowWinningPathOnly] = useState(false);

  // Load 3D Lib
  useEffect(() => {
    if (window.ForceGraph3D!) {
      setGraphLibLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = '//unpkg.com/3d-force-graph';
    script.async = true;
    script.onload = () => setGraphLibLoaded(true);
    document.body.appendChild(script);
  }, []);

  const displayedGraphData = useMemo(() => {
    if (!showWinningPathOnly) return {...graphData};
    return {
        nodes: graphData.nodes.filter((n: Node) => n.isWinningPath),
        links: graphData.links.filter((l: Link) => l.isWinningPath)
    };
  }, [graphData, showWinningPathOnly, isGraphLoading]);

  const selectPuzzleToPlay = (puzzle: Puzzle) => {
    setActivePuzzle(puzzle);
    setPlayBlocks(cloneBlocks(puzzle.layout));
    setPlaySelection(null);
    setShowGraph(false);
    setGraphData({ nodes: [], links: [] }); // Reset graph
  };

  const handlePlayBlockClick = (id: number) => {
    setPlaySelection(id === playSelection ? null : id);
  };

  const handlePlayMove = (dx: number, dy: number) => {
    if (!playSelection) return;
    const idx = playBlocks.findIndex(b => b.id === playSelection);
    if (idx === -1) return;
    
    if (canMove(playBlocks[idx], dx, dy, playBlocks)) {
      const newB = cloneBlocks(playBlocks);
      newB[idx].x += dx;
      newB[idx].y += dy;
      setPlayBlocks(newB);
    }
  };

  const handlePlaySelectionChange = (direction: number) => {
    const currentBlock = playBlocks.find(b => b.id === playSelection)!;
    if (!playSelection || !currentBlock) setPlaySelection(0);

    const constructGrid = () => {
      const grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
      for (const b of playBlocks) {
        const blockType = BLOCK_TYPES[b.type];
        for (let y = b.y; y < b.y + blockType.h; y++) {
          for (let x = b.x; x < b.x + blockType.w; x++) {
            grid[y][x] = b.id;
          }
        }
      }
      return grid;
    }
    const grid = constructGrid();
    const blockType = BLOCK_TYPES[currentBlock.type];
    if (direction === 0) {
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        for (let y = currentBlock.y - 1; y >= 0; y--) {
          let b = grid[y][currentBlock.x - x];
          if (b) { setPlaySelection(b); return; }
          b = grid[y][currentBlock.x + x];
          if (b) { setPlaySelection(b); return; }
        }
      }
    }
    else if (direction === 1) {
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        for (let y = currentBlock.y + blockType.h; y <= BOARD_HEIGHT; y++) {
          let b = grid[y][currentBlock.x - x];
          if (b) { setPlaySelection(b); return; }
          b = grid[y][currentBlock.x + x];
          if (b) { setPlaySelection(b); return; }
        }
      }
    }
    else if (direction === 2) {
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        for (let x = currentBlock.x - 1; x >= 0; x--) {
          let b = grid[currentBlock.y - y][x];
          if (b) { setPlaySelection(b); return; }
          b = grid[currentBlock.y + y][x];
          if (b) { setPlaySelection(b); return; }
        }
      }
    }
    else if (direction === 3) {
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        for (let x = currentBlock.x + blockType.w; x <= BOARD_WIDTH; x++) {
          let b = grid[currentBlock.y - y][x];
          if (b) { setPlaySelection(b); return; }
          b = grid[currentBlock.y + y][x];
          if (b) { setPlaySelection(b); return; }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (activeTab === 'play' && activePuzzle) {
      switch(e.key) {
        case 'ArrowUp': handlePlaySelectionChange(0); break;
        case 'ArrowDown': handlePlaySelectionChange(1); break;
        case 'ArrowLeft': handlePlaySelectionChange(2); break;
        case 'ArrowRight': handlePlaySelectionChange(3); break;
        case 'w': handlePlayMove(0, -1); break;
        case 's': handlePlayMove(0, 1); break;
        case 'a': handlePlayMove(-1, 0); break;
        case 'd': handlePlayMove(1, 0); break;
        default: break;
      }
    }
  };

  const handleAddBlock = (typeKey: keyof typeof BLOCK_TYPES) => {
    const bt = BLOCK_TYPES[typeKey];
    // Simple find first spot
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        let fits = true;
        if (x + bt.w > BOARD_WIDTH || y + bt.h > BOARD_HEIGHT) continue;
        const mock = { id: -1, type: typeKey, x, y, w: bt.w, h: bt.h };
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

  const generateGraph = () => {
    if (!graphLibLoaded) return;
    setIsGraphLoading(true);
    setTimeout(() => {
      const visited = new Set();
      const nodes = [];
      const links = [];
      const queue = [];
      const predecessors = new Map(); // Store path for backtracking: childId -> parentId

      const startNode = getCurrentNode(playBlocks);
      
      visited.add(startNode.id);
      nodes.push(startNode);
      queue.push(startNode);
      let count = 0;
      let winningNodeIds = [];
      while(queue.length > 0 && count < maxNodesRef.current) {
        const curr = queue.shift();
        const currBlocks = curr!.blocks;
        let foundWin = false;
        
        for(let i=0; i<currBlocks.length; i++) {
          const b = currBlocks[i];
          const moves = [{dx:0, dy:-1}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:1, dy:0}];
          for(const m of moves) {
            if(canMove(b, m.dx, m.dy, currBlocks)) {
               const nextB = cloneBlocks(currBlocks);
               nextB[i].x += m.dx;
               nextB[i].y += m.dy;
               const nextHash = hashState(nextB);
               
               if(!visited.has(nextHash)) {
                 visited.add(nextHash);
                 predecessors.set(nextHash, curr!.id); // Track where we came from

                 const main = nextB.find(nb => nb.type === 'MAIN');
                 const isWin = main && main.x === 1 && main.y === 3;
                 
                 if (isWin) {winningNodeIds.push(nextHash); foundWin = true;} // Store first win found

                 const newNode = { id: nextHash, blocks: nextB, group: isWin?3:2, val: isWin?20:5 };
                 nodes.push(newNode);
                 if (!foundWin) queue.push(newNode);
                 count++;
               }
               links.push({ source: curr!.id, target: nextHash });
               if (foundWin) break;
            }
          }
          if (foundWin) break;
        }
      }

      // Backtrack to find winning path
      const winningPathNodes = new Set();
      const winningPathLinks = new Set();
      
      if (winningNodeIds.length > 0) {
        for (const winningNodeId of winningNodeIds) {
          let trace = winningNodeId;
          winningPathNodes.add(trace);
          while(trace !== startNode.id) {
              const parent = predecessors.get(trace);
              if (!parent) break;
              winningPathNodes.add(parent);
              winningPathLinks.add(`${parent}|${trace}`);
              trace = parent;
          }
        }
      }

      // Mark nodes and links with winning path status
      const processedNodes = nodes.map(n => ({
          ...n,
          isWinningPath: winningPathNodes.has(n.id)
      }));

      const processedLinks = links.map(l => ({
          ...l,
          isWinningPath: winningPathLinks.has(`${l.source}|${l.target}`)
      }));

      setGraphData({ nodes: processedNodes, links: processedLinks });
      setIsGraphLoading(false);
    }, 100);
  };

  // --- Render Helpers ---

  const renderPlayList = () => (
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

  const onNodeClick = (node: Node) => {
    let foundCurrentNode = false;
    graphData.nodes.forEach(n => {
      if (!foundCurrentNode && n.group == 1) {
        const {x, y} = n.blocks.find(b => b.type === 'MAIN')!;
        if (x == 1 && y == 3) n.group = 3; // Winning node
        else n.group = 2
      } else if (n.id === node.id) {
        n.group = 1;
      }
    });
    setPlayBlocks(node.blocks)
  }

  const renderPlayGame = () => (
    <div className="flex flex-col md:flex-row h-full w-full overflow-auto">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-700">
          <button 
            onClick={() => setActivePuzzle(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Menu
          </button>
          <h2 className="text-2xl font-bold text-white truncate">{activePuzzle?.name}</h2>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => { setPlayBlocks(cloneBlocks(activePuzzle!.layout)); setPlaySelection(null); }}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-200 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              onClick={() => { setShowGraph(!showGraph); if(!showGraph && graphData.nodes.length===0) generateGraph(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${showGraph ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
            >
              <Activity size={16} /> {showGraph ? 'Hide Graph' : 'Analyze'}
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          {showGraph ? (
            <>
              <div className="text-slate-300 font-medium text-sm">
                State Space Visualization
              </div>
              <p className="text-slate-400 text-xs max-w-60 mx-auto leading-relaxed text-center mb-4">
                Explore the puzzle's state space graph. Click on any node to jump to that configuration.
              </p>
              <input type="range" min={100} max={showWinningPathOnly ? 100000 : 5000} step={100} value={maxNodes} onChange={(e) => { setMaxNodes(Number(e.target.value)); maxNodesRef.current = Number(e.target.value); generateGraph()}} className="w-full mb-4"/>
              <div className="text-slate-300 text-xs mb-3">
                Search Space Nodes: {maxNodes}
              </div>
              <input type="range" min={100} max={2000} step={100} value={simulationSpeed} onChange={(e) => { setSimulationSpeed(Number(e.target.value)); }} className="w-full mb-4"/>
              <div className="text-slate-300 text-xs mb-3">
                Simulation Speed: {simulationSpeed}ms
              </div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                  <input 
                      type="checkbox" 
                      checked={showWinningPathOnly}
                      onChange={(e) => setShowWinningPathOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-700"
                  />
                  <span>Show Winning Path Only</span>
              </label>
              <div className={`relative z-10 transition-transform duration-500 ${showGraph ? 'scale-75 opacity-90' : 'scale-100'}`}>
                <Board 
                  blocks={playBlocks} 
                  selectedBlockId={playSelection} 
                  onBlockClick={handlePlayBlockClick}
                  mode="play"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                  <div/>
                  <button onClick={() => handlePlayMove(0, -1)} className="p-4 bg-slate-700 rounded-lg active:bg-slate-600 text-white"><ArrowUp/></button>
                  <div/>
                  <button onClick={() => handlePlayMove(-1, 0)} className="p-4 bg-slate-700 rounded-lg active:bg-slate-600 text-white"><ArrowLeft/></button>
                  <button onClick={() => handlePlayMove(0, 1)} className="p-4 bg-slate-700 rounded-lg active:bg-slate-600 text-white"><ArrowDown/></button>
                  <button onClick={() => handlePlayMove(1, 0)} className="p-4 bg-slate-700 rounded-lg active:bg-slate-600 text-white"><ArrowRight/></button>
              </div>
              <p className="mt-6 text-center text-slate-400 text-sm max-w-[200px]">
                Tip: You can use your keyboard arrow keys to move to the selected block, and W A S D keys to slide it.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative bg-slate-900 overflow-auto flex items-center justify-center">
        {/* Background Graph Layer */}
        {showGraph && (
          <div className="absolute inset-0 z-0">
             {isGraphLoading && (
               <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded backdrop-blur-sm z-50">
                 Generating State Space...
               </div>
             )}
             <ForceGraphWrapper 
               data={displayedGraphData}
               onNodeClick={onNodeClick}
               currentNode={getCurrentNode(playBlocks)}
               simulationSpeed={simulationSpeed}
             />
          </div>
        )}
        
        {/* Board */}
        {!showGraph && (
          <div className={`relative z-10 transition-transform duration-500 ${showGraph ? 'scale-75 translate-x-[20%] opacity-90' : 'scale-100'}`}>
            <Board 
              blocks={playBlocks} 
              selectedBlockId={playSelection} 
              onBlockClick={handlePlayBlockClick}
              mode="play"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Builder Sidebar */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl shrink-0 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Puzzle Builder</h2>
        
        {/* Toolbox */}
        <div className="space-y-4 mb-8">
           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocks</h3>
           <div className="grid grid-cols-2 gap-3">
              <ToolboxButton onClick={() => handleAddBlock('MAIN')} label="King" h="h-12" w="w-12" color="bg-red-500" />
              <ToolboxButton onClick={() => handleAddBlock('VERT')} label="Vertical" h="h-12" w="w-6" color="bg-amber-600" />
              <ToolboxButton onClick={() => handleAddBlock('HORZ')} label="Horizontal" h="h-6" w="w-12" color="bg-amber-600" />
              <ToolboxButton onClick={() => handleAddBlock('SOLDIER')} label="Pawn" h="h-6" w="w-6" color="bg-yellow-200" />
           </div>
        </div>

        {/* Save Form */}
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

      {/* Editor Area */}
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
  );

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-auto" onKeyDown={handleKeyDown} tabIndex={0}>
      
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-br from-red-500 to-amber-600 p-2 rounded-lg text-white shadow-lg">
             <Grid size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Klotski <span className="text-slate-500 font-normal">Visualizer</span></h1>
        </div>

        <nav className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
           <TabButton 
             active={activeTab === 'play'} 
             onClick={() => setActiveTab('play')} 
             icon={<Play size={16} />} 
             label="Play" 
           />
           <TabButton 
             active={activeTab === 'create'} 
             onClick={() => setActiveTab('create')} 
             icon={<Plus size={16} />} 
             label="Create" 
           />
        </nav>
      </header>

      {/* Main Content View Switcher */}
      <div className="flex-1 overflow-auto relative">
        {activeTab === 'play' ? (
          activePuzzle ? renderPlayGame() : renderPlayList()
        ) : (
          renderCreate()
        )}
      </div>

    </div>
  );
}