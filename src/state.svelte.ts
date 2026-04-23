import type { TextLayer } from './lib/layer';
import type { MaskCandidate, SavedMask } from './lib/mask';
import type { SamBackend } from './lib/sam';
import type { SamPoint } from './lib/sam-inputs';

export type PendingSelection = {
  active: boolean;
  points: SamPoint[];
  candidates: MaskCandidate[];
  selectedIdx: number;
};

export type StatusKind = 'idle' | 'loading' | 'ready' | 'error';

export type LoaderState = {
  visible: boolean;
  message: string;
};

export type DialogState =
  | { kind: 'none' }
  | { kind: 'confirm'; title: string; message: string; onConfirm: () => void };

export type AppState = {
  image: HTMLImageElement | null;
  imageURL: string | null;
  naturalW: number;
  naturalH: number;
  sam: SamBackend | null;
  pending: PendingSelection;
  masks: SavedMask[];
  layers: TextLayer[];
  selectedLayerId: number | null;
  nextMaskId: number;
  nextLayerId: number;
  status: { kind: StatusKind; text: string };
  loader: LoaderState;
  dialog: DialogState;
};

export const app: AppState = $state({
  image: null,
  imageURL: null,
  naturalW: 0,
  naturalH: 0,
  sam: null,
  pending: { active: false, points: [], candidates: [], selectedIdx: 0 },
  masks: [],
  layers: [],
  selectedLayerId: null,
  nextMaskId: 1,
  nextLayerId: 1,
  status: { kind: 'idle', text: 'idle · upload an image' },
  loader: { visible: false, message: '' },
  dialog: { kind: 'none' }
});

export function setStatus(kind: StatusKind, text: string): void {
  app.status = { kind, text };
}

export function showLoader(message: string): void {
  app.loader = { visible: true, message };
}

export function hideLoader(): void {
  app.loader = { visible: false, message: '' };
}

export function resetAll(): void {
  app.masks = [];
  app.layers = [];
  app.selectedLayerId = null;
  app.pending = { active: false, points: [], candidates: [], selectedIdx: 0 };
}
