import { BLOCK_TYPES, BOARD_WIDTH, BOARD_HEIGHT, CLASSIC_LAYOUT, BUTTERFLY_LAYOUT, PRETZEL_LAYOUT, HERD_LAYOUT, SIMPLE_LAYOUT } from './constants';
import type { Block } from './constants';

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
  let grid = constructGrid(blocks);
  grid = grid.map(row => row.map(i => (i != null ? blocks.find(b => b.id === i)!.type.charAt(0) : null)));
  return grid.flat().toString();
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