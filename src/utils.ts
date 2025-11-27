import { BLOCK_TYPES, BOARD_WIDTH, BOARD_HEIGHT, CLASSIC_LAYOUT, BUTTERFLY_LAYOUT, PRETZEL_LAYOUT } from './constants';
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

export const hashState = (blocks: Block[]) => {
  return blocks.map(b => `${b.type}:${b.x},${b.y}`).sort().join('|');
};

export const getCurrentNode = (playBlocks: Block[]) => {
  const hash = hashState(playBlocks);
  return { id: hash, blocks: cloneBlocks(playBlocks), group: 1, val: 20 };
}

export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPuzzlesFromLocalStorage = () => {
  const saved = localStorage.getItem('customPuzzles');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [
        { id: 1, name: 'Classic (Huarong Pass)', layout: CLASSIC_LAYOUT },
        { id: 2, name: 'The Butterfly', layout: BUTTERFLY_LAYOUT },
        { id: 3, name: 'The Pretzel', layout: PRETZEL_LAYOUT },
      ];
    }
  }
  return [
    { id: 1, name: 'Classic (Huarong Pass)', layout: CLASSIC_LAYOUT },
    { id: 2, name: 'The Butterfly', layout: BUTTERFLY_LAYOUT },
    { id: 3, name: 'The Pretzel', layout: PRETZEL_LAYOUT },
  ];
}