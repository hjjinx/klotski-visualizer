import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Plus, 
  Grid, 
  ArrowLeft, 
  Activity, 
  RotateCcw,
  ArrowUp, ArrowDown, ArrowRight
} from 'lucide-react';
import { type Block, type Puzzle, type Link, type Node } from './constants';
import { cloneBlocks, canMove, hashState, getCurrentNode, getPuzzlesFromLocalStorage, isWinner, handlePlaySelectionChange, runBFSSearch, getWinningPathIds } from './utils';
import ForceGraphWrapper from './components/Graph';
import TabButton from './components/TabButton';
import Board from './components/Board';
import CreatePuzzle from './components/CreatePuzzle';
import PuzzlePlaylist from './components/PuzzlePlaylist';

export default function KlotskiApp() {
  const [activeTab, setActiveTab] = useState('play');
  const [puzzles, setPuzzles] = useState<Puzzle[]>(getPuzzlesFromLocalStorage());
  
  // Play Mode State
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [playBlocks, setPlayBlocks] = useState<Block[]>([]);
  const [playSelection, setPlaySelection] = useState<number | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const [maxNodes, setMaxNodes] = useState(1000);
  const maxNodesRef = useRef(1000);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);

  // Graph State
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphLibLoaded, setGraphLibLoaded] = useState(true);
  const [showWinningPathOnly, setShowWinningPathOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.001);
  const zoomLevelRef = useRef(1000);
  const graphRef = useRef<ReturnType<any> | null>(null);

  // Load 3D Lib
  useEffect(() => {
    // @ts-ignore
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

  useEffect(() => {
    zoomLevelRef.current = 1 / zoomLevel;
  }, [zoomLevel])

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
    generateGraph(cloneBlocks(puzzle.layout))
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

      if (isWinner(newB)) {
        setTimeout(() => alert("Congratulations! You've solved the puzzle!"), 50);
      }
      setPlayBlocks(newB);
      if (graphRef.current) simulateNodeClick(newB);
    }
  };

  const simulateNodeClick = (newB: Block[]) => {
    const node = graphData.nodes.find(n => n.id === hashState(newB));

    if (node) {
      // @ts-ignore
      const link = graphData.links.find(l => l.target.id === node!.id && l.source.id === hashState(playBlocks));
      if (link) {
        onNodeClick(node);
        return;
      } else {
        const newLink = { source: hashState(playBlocks), target: node.id };
        const newGraphData = { ...graphData };
        newGraphData.links.push(newLink);
        setGraphData(newGraphData);
        setTimeout(() => onNodeClick(node), 50);
      }
    } else {
      const newNode = {...getCurrentNode(newB), group: 2, val: 5 };
      const newLink = { source: hashState(playBlocks), target: newNode.id };
      const newGraphData = { ...graphData };
      newGraphData.nodes.push(newNode);
      newGraphData.links.push(newLink);
      setGraphData(newGraphData);
      setTimeout(() => onNodeClick(newNode), 50);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (activeTab === 'play' && activePuzzle) {
      switch(e.key) {
        case 'ArrowUp': handlePlaySelectionChange(0, playBlocks, playSelection, setPlaySelection); break;
        case 'ArrowDown': handlePlaySelectionChange(1, playBlocks, playSelection, setPlaySelection); break;
        case 'ArrowLeft': handlePlaySelectionChange(2, playBlocks, playSelection, setPlaySelection); break;
        case 'ArrowRight': handlePlaySelectionChange(3, playBlocks, playSelection, setPlaySelection); break;
        case 'w': handlePlayMove(0, -1); break;
        case 's': handlePlayMove(0, 1); break;
        case 'a': handlePlayMove(-1, 0); break;
        case 'd': handlePlayMove(1, 0); break;
        default: break;
      }
    }
  };
  const generateGraph = (from?: Block[]) => {
    if (!graphLibLoaded) return;
    setIsGraphLoading(true);

    setTimeout(() => {
      const startNode = getCurrentNode(from ?? playBlocks);

      const { nodes, links, predecessors, winningNodeIds } = runBFSSearch(
        startNode, 
        maxNodesRef.current, 
        false
      );

      const { pathNodes, pathLinks } = getWinningPathIds(
        winningNodeIds[0] || null, 
        startNode.id, 
        predecessors
      );

      const allNodes = [...nodes]; 
      
      const processedNodes = allNodes.map(n => ({
        ...n,
        isWinningPath: pathNodes.has(n.id)
      }));

      const processedLinks = links.map(l => ({
        ...l,
        isWinningPath: pathLinks.has(`${l.source}|${l.target}`)
      }));

      setGraphData({ nodes: processedNodes, links: processedLinks });
      setIsGraphLoading(false);
    }, 100);
  };

  // Implements a BFS to find the fastest win from current playBlocks
  const findFastestWinFromCurrent = () => {
  if (!graphLibLoaded) return;
  setIsGraphLoading(true);

  setTimeout(() => {
    const startNode = getCurrentNode(playBlocks);

    const { nodes, links, predecessors, winningNodeIds } = runBFSSearch(
      startNode, 
      100000, 
      true
    );

    const { pathNodes, pathLinks } = getWinningPathIds(
      winningNodeIds[0] || null, 
      startNode.id, 
      predecessors
    );

    const winningNodes = nodes
      .filter(n => pathNodes.has(n.id))
      .map(n => ({
        ...n,
        isWinningPath: true
      }));

    const winningLinks = links
      .filter(l => pathLinks.has(`${l.source}|${l.target}`))
      .map(l => ({
        ...l,
        isWinningPath: true
      }));

    const newUniqueNodes = winningNodes.filter(n => 
      !graphData.nodes.some(existing => existing.id === n.id)
    );

    setGraphData({ 
      nodes: [...graphData.nodes, ...newUniqueNodes], 
      links: [...graphData.links, ...winningLinks] 
    });
    
    setIsGraphLoading(false);
  }, 100);
};

  const onNodeClick = (node: Node, isTriggeredForAFocus = false) => {
    const distRatio = 1 + zoomLevelRef.current / Math.hypot(node.x!, node.y!, node.z!);
    graphRef.current.cameraPosition(
      {
        x: node.x! * distRatio,
        y: node.y! * distRatio,
        z: node.z! * distRatio,
      },
      node,
      simulationSpeed
    );
    setPlayBlocks(node.blocks)
    if (isTriggeredForAFocus) return;
    graphData.nodes.forEach(n => {
      if (n.group == 1) {
        const winningBlock = n.blocks.find(b => b.type === 'MAIN');
        if (winningBlock?.x == 1 && winningBlock?.y == 3) n.group = 3;
        else n.group = 2;
      } else if (n.id === node.id) {
        n.group = 1;
      }
    });
    graphRef.current.nodeColor(graphRef.current.nodeColor());
  };

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
              onClick={() => { setPlayBlocks(cloneBlocks(activePuzzle!.layout)); setPlaySelection(null); simulateNodeClick(cloneBlocks(activePuzzle!.layout)); }}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-200 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              onClick={() => { setShowGraph(!showGraph); if(!showGraph && graphData.nodes.length===0) generateGraph(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${showGraph ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
            >
              <Activity size={16} /> {showGraph ? 'Hide Graph' : 'Show Graph'}
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
               findFastestWinFromCurrent={findFastestWinFromCurrent}
               graphRef={graphRef}
               zoomLevel={zoomLevel}
               setZoomLevel={setZoomLevel}
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

      <div className="flex-1 overflow-auto relative">
        {activeTab === 'play' ? (
          activePuzzle 
            ? renderPlayGame() 
            : <PuzzlePlaylist
                puzzles={puzzles} 
                selectPuzzleToPlay={selectPuzzleToPlay}
                setActiveTab={setActiveTab}
              />
        ) : (
          <CreatePuzzle 
            puzzles={puzzles} 
            setPuzzles={setPuzzles} 
            setActiveTab={setActiveTab}
            setActivePuzzle={setActivePuzzle}
          />
        )}
      </div>

    </div>
  );
}