export const BOARD_WIDTH = 4;
export const BOARD_HEIGHT = 5;

export const BLOCK_TYPES = {
  MAIN: { w: 2, h: 2, color: 'bg-red-500', label: 'King' },
  VERT: { w: 1, h: 2, color: 'bg-amber-600', label: 'General' },
  HORZ: { w: 2, h: 1, color: 'bg-amber-600', label: 'General' },
  SOLDIER: { w: 1, h: 1, color: 'bg-yellow-200', label: 'Pawn' },
};

type PuzzleLayout = { id: number; type: keyof typeof BLOCK_TYPES; x: number; y: number }[];

export const CLASSIC_LAYOUT: PuzzleLayout = [
  { id: 1, type: 'VERT', x: 0, y: 0 },
  { id: 2, type: 'MAIN', x: 1, y: 0 },
  { id: 3, type: 'VERT', x: 3, y: 0 },
  { id: 4, type: 'VERT', x: 0, y: 2 },
  { id: 5, type: 'HORZ', x: 1, y: 2 },
  { id: 6, type: 'VERT', x: 3, y: 2 },
  { id: 7, type: 'SOLDIER', x: 0, y: 4 },
  { id: 8, type: 'SOLDIER', x: 1, y: 4 },
  { id: 9, type: 'SOLDIER', x: 2, y: 4 },
  { id: 10, type: 'SOLDIER', x: 3, y: 4 },
];

export const BUTTERFLY_LAYOUT: PuzzleLayout = [
  { id: 1, type: 'VERT', x: 0, y: 0 },
  { id: 2, type: 'MAIN', x: 1, y: 0 },
  { id: 3, type: 'VERT', x: 3, y: 0 },
  { id: 4, type: 'HORZ', x: 0, y: 2 },
  { id: 5, type: 'HORZ', x: 2, y: 2 },
  { id: 6, type: 'SOLDIER', x: 0, y: 3 },
  { id: 7, type: 'SOLDIER', x: 1, y: 3 },
  { id: 8, type: 'SOLDIER', x: 2, y: 3 },
  { id: 9, type: 'SOLDIER', x: 3, y: 3 },
  { id: 10, type: 'SOLDIER', x: 1, y: 4 },
  { id: 11, type: 'SOLDIER', x: 2, y: 4 },
];

export const PRETZEL_LAYOUT: PuzzleLayout = [
  { id: 1, type: 'VERT', x: 0, y: 0 },
  { id: 2, type: 'MAIN', x: 1, y: 0 },
  { id: 3, type: 'VERT', x: 3, y: 0 },
  { id: 4, type: 'SOLDIER', x: 1, y: 2 },
  { id: 5, type: 'SOLDIER', x: 2, y: 2 },
  { id: 6, type: 'VERT', x: 0, y: 2 },
  { id: 7, type: 'VERT', x: 3, y: 2 },
  { id: 8, type: 'HORZ', x: 1, y: 3 },
  { id: 9, type: 'SOLDIER', x: 0, y: 4 },
  { id: 10, type: 'SOLDIER', x: 3, y: 4 },
];

export type Block = { id: number; type: keyof typeof BLOCK_TYPES; x: number; y: number };
export type Puzzle = { id: number; name: string; layout: Block[] };
export type Node = { id: string; group: number; val: number; isWinningPath?: boolean; vx?: number; vy?: number; vz?: number; x?: number; y?: number; z?: number; blocks: Block[] };
export type Link = { source: Node | string; target: Node | string; isWinningPath?: boolean; index?: number };