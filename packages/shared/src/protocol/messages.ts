export type Zone = "hand" | "library" | "battlefield" | "graveyard" | "exile";

export interface BattlefieldCard {
  instanceId: string;
  cardId: string | null; // null quando faceDown e o observador não é o controlador
  controllerId: string;
  tapped: boolean;
  counters: Record<string, number>;
  x: number;
  y: number;
  faceDown: boolean;
  attachedTo: string | null;
}

export interface ZoneCardRef {
  instanceId: string;
  cardId: string;
}

export interface PlayerView {
  userId: string;
  displayName: string;
  connected: boolean;
  life: number;
  handCount: number;
  libraryCount: number;
  hand: ZoneCardRef[] | null; // só preenchido para o dono da mão
  graveyard: ZoneCardRef[];
  exile: ZoneCardRef[];
}

export interface RoomView {
  roomCode: string;
  status: "waiting" | "active" | "finished";
  players: PlayerView[];
  battlefield: BattlefieldCard[];
}

export type ClientAction =
  | { type: "TAP_TOGGLE"; instanceId: string }
  | { type: "MOVE_CARD"; instanceId: string; toZone: Zone; faceDown?: boolean }
  | { type: "DRAW_CARD"; count?: number }
  | { type: "SHUFFLE_LIBRARY" }
  | { type: "SET_LIFE"; delta: number }
  | { type: "ADD_COUNTER"; instanceId: string; counterType: string; delta: number }
  | { type: "SET_POSITION"; instanceId: string; x: number; y: number }
  | { type: "MULLIGAN" }
  | { type: "CONCEDE" };

export type ServerEvent =
  | { type: "SNAPSHOT"; state: RoomView }
  | { type: "ERROR"; message: string };
