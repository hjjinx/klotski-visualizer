import { BLOCK_TYPES, BOARD_WIDTH, BOARD_HEIGHT, CLASSIC_LAYOUT, BUTTERFLY_LAYOUT, PRETZEL_LAYOUT, HERD_LAYOUT, SIMPLE_LAYOUT } from './constants';
import type { Block, Link, Node } from './constants';

export const cloneBlocks = (blocks: Block[] | never[]) => blocks.map(b => ({ ...b }));

export const isOccupied = (x: number, y: number, blocks: Block[], excludeId: number | null = null) => {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return true;
  for (const b of blocks) {
    if (b.id === excludeId) continue;
    const bt = BLOCK_TYPES[b.type];
    if (x >= b.x && x < b.x + bt.w && y >= b.y && y < b.y + bt.h) {
      return true;
    }
  }
  return false;
};

export const canMove = (block: Block, dx: number, dy: number, allBlocks: Block[]) => {
  const bt = BLOCK_TYPES[block.type];
  const newX = block.x + dx;
  const newY = block.y + dy;
  if (newX < 0 || newX + bt.w > BOARD_WIDTH) return false;
  if (newY < 0 || newY + bt.h > BOARD_HEIGHT) return false;

  for (let i = 0; i < bt.w; i++) {
    for (let j = 0; j < bt.h; j++) {
      if (isOccupied(newX + i, newY + j, allBlocks, block.id)) return false;
    }
  }
  return true;
};

export const constructGrid = (blocks: Block[]) => {
  const grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
  for (const b of blocks) {
    const blockType = BLOCK_TYPES[b.type];
    for (let y = b.y; y < b.y + blockType.h; y++) {
      for (let x = b.x; x < b.x + blockType.w; x++) {
        grid[y][x] = b.id;
      }
    }
  }
  return grid;
}

export const hashState = (blocks: Block[]) => {
  const grid = new Array(BOARD_WIDTH * BOARD_HEIGHT).fill('.');

  for (const b of blocks) {
    const { w, h } = BLOCK_TYPES[b.type];
    
    const endY = b.y + h;
    const endX = b.x + w;

    for (let y = b.y; y < endY; y++) {
      const rowOffset = y * BOARD_WIDTH;
      for (let x = b.x; x < endX; x++) {
        grid[rowOffset + x] = b.type[0];
      }
    }
  }

  return grid.join('');
};

export const getCurrentNode = (playBlocks: Block[]) => {
  const hash = hashState(playBlocks);
  return { id: hash, blocks: cloneBlocks(playBlocks), group: 1, val: 20 };
}

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const defaultPuzzles = [
  { id: 0, name: 'Simple Visualization', layout: SIMPLE_LAYOUT },
  { id: 1, name: 'Classic (Huarong Pass)', layout: CLASSIC_LAYOUT },
  { id: 2, name: 'The Butterfly', layout: BUTTERFLY_LAYOUT },
  { id: 3, name: 'The Pretzel', layout: PRETZEL_LAYOUT },
  { id: 4, name: 'The Herd', layout: HERD_LAYOUT }
]

export const getPuzzlesFromLocalStorage = () => {
  const saved = localStorage.getItem('customPuzzles');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultPuzzles;
    }
  }
  return defaultPuzzles;
}

export const isWinner = (blocks: Block[]) => {
  const mainBlock = blocks.find(b => b.type === 'MAIN');
  if (!mainBlock) return false;
  return mainBlock.x === 1 && mainBlock.y === 3;
}

export const currentNodeHasWinningPath = (data: { nodes: any[]; links: any[] }, currentNode: any) => {
  for (let link of data.links) {
      // @ts-ignore
      if (link.source.id == currentNode.id) {
        // @ts-ignore
        if (link.isWinningPath) return true;
      }
  }
  return false;
}

export const handlePlaySelectionChange = (direction: number, playBlocks: Block[], playSelection: number | null, setPlaySelection: (id: number | null) => void) => {
  const currentBlock = playBlocks.find(b => b.id === playSelection)!;
  if (!playSelection || !currentBlock) setPlaySelection(0);

  try {
    const grid = constructGrid(playBlocks);
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
  } catch (err) {
    // ignore errors in selection change
  }
};

export const getNextStates = (currentBlocks: Block[]) => {
  const nextStates = [];
  const moves = [{dx:0, dy:-1}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:1, dy:0}];

  for (let i = 0; i < currentBlocks.length; i++) {
    const b = currentBlocks[i];
    for (const m of moves) {
      if (canMove(b, m.dx, m.dy, currentBlocks)) {
        const nextB = cloneBlocks(currentBlocks);
        nextB[i].x += m.dx;
        nextB[i].y += m.dy;
        
        const main = nextB.find(nb => nb.type === 'MAIN');
        const isWin = main && main.x === 1 && main.y === 3;
        
        nextStates.push({
          blocks: nextB,
          hash: hashState(nextB),
          isWin
        });
      }
    }
  }
  return nextStates;
};

export const getWinningPathIds = (
  targetId: string | null, 
  startId: string, 
  predecessors: Map<string, string>
) => {
  const pathNodes = new Set<string>();
  const pathLinks = new Set<string>();
  
  if (targetId) {
    let trace = targetId;
    pathNodes.add(trace);
    while (trace !== startId) {
      const parent = predecessors.get(trace);
      if (!parent) break;
      pathNodes.add(parent);
      pathLinks.add(`${parent}|${trace}`);
      trace = parent;
    }
  }
  return { pathNodes, pathLinks };
};

interface SearchResult {
  nodes: Node[];
  links: Link[];
  predecessors: Map<string, string>;
  winningNodeIds: string[];
}

export const runBFSSearch = (
  startNode: Node, 
  maxNodes: number, 
  stopOnFirstWin: boolean
): SearchResult => {
  const visited = new Set<string>();
  const nodes = [];
  const links = [];
  const queue = [startNode];
  const predecessors = new Map<string, string>();
  const winningNodeIds: string[] = [];

  visited.add(startNode.id);
  if (!stopOnFirstWin) nodes.push(startNode); 

  let count = 0;

  while (queue.length > 0 && count < maxNodes) {
    const curr = queue.shift()!;
    count++;

    const transitions = getNextStates(curr.blocks);

    for (const { blocks, hash, isWin } of transitions) {
      if (!visited.has(hash)) {
        visited.add(hash);
        predecessors.set(hash, curr.id);

        if (isWin) winningNodeIds.push(hash);

        const newNode: Node = { 
          id: hash, 
          blocks: blocks, 
          group: isWin ? 3 : 2, 
          val: isWin ? 20 : 5,
        };

        nodes.push(newNode);
        links.push({ source: curr.id, target: hash });

        const shouldStopBranching = isWin && stopOnFirstWin;
        
        if (!shouldStopBranching) {
            queue.push(newNode);
        }

        if (isWin && stopOnFirstWin) return { nodes, links, predecessors, winningNodeIds };
      } 
      else if (!stopOnFirstWin) {
          links.push({ source: curr.id, target: hash });
      }
    }
  }

  return { nodes, links, predecessors, winningNodeIds };
};