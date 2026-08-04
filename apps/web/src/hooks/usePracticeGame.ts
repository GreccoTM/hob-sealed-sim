import { useCallback, useMemo, useState } from "react";
import {
  expandDeckToInstances,
  secureRandom,
  shuffle,
  type BattlefieldCard,
  type ClientAction,
  type RoomView,
  type SealedPoolEntry,
} from "@hob/shared";

export const SOLO_PLAYER_ID = "solo";
const STARTING_LIFE = 20;
const STARTING_HAND_SIZE = 7;

interface SoloState {
  life: number;
  hand: string[];
  library: string[];
  graveyard: string[];
  exile: string[];
  battlefield: BattlefieldCard[];
  cardIndex: Record<string, string>;
}

function dealFreshState(maindeck: SealedPoolEntry[]): SoloState {
  const cardIndex: Record<string, string> = {};
  const { instanceIds } = expandDeckToInstances(maindeck, cardIndex, 0);
  const library = shuffle(instanceIds, secureRandom);
  return {
    life: STARTING_LIFE,
    hand: library.slice(0, STARTING_HAND_SIZE),
    library: library.slice(STARTING_HAND_SIZE),
    graveyard: [],
    exile: [],
    battlefield: [],
    cardIndex,
  };
}

function removeFromZone(state: SoloState, instanceId: string): SoloState {
  for (const zone of ["hand", "library", "graveyard", "exile"] as const) {
    const idx = state[zone].indexOf(instanceId);
    if (idx !== -1) {
      const updated = [...state[zone]];
      updated.splice(idx, 1);
      return { ...state, [zone]: updated };
    }
  }
  const bfIdx = state.battlefield.findIndex((c) => c.instanceId === instanceId);
  if (bfIdx !== -1) {
    const battlefield = [...state.battlefield];
    battlefield.splice(bfIdx, 1);
    return { ...state, battlefield };
  }
  return state;
}

function applyAction(state: SoloState, action: ClientAction): SoloState {
  switch (action.type) {
    case "TAP_TOGGLE": {
      const battlefield = state.battlefield.map((c) =>
        c.instanceId === action.instanceId ? { ...c, tapped: !c.tapped } : c,
      );
      return { ...state, battlefield };
    }
    case "MOVE_CARD": {
      const next = removeFromZone(state, action.instanceId);
      if (action.toZone === "battlefield") {
        const card: BattlefieldCard = {
          instanceId: action.instanceId,
          cardId: state.cardIndex[action.instanceId],
          controllerId: SOLO_PLAYER_ID,
          tapped: false,
          counters: {},
          x: 0,
          y: 0,
          faceDown: action.faceDown ?? false,
          attachedTo: null,
        };
        return { ...next, battlefield: [...next.battlefield, card] };
      }
      return { ...next, [action.toZone]: [...next[action.toZone], action.instanceId] };
    }
    case "DRAW_CARD": {
      const count = action.count ?? 1;
      const drawn = state.library.slice(0, count);
      return { ...state, hand: [...state.hand, ...drawn], library: state.library.slice(count) };
    }
    case "SHUFFLE_LIBRARY":
      return { ...state, library: shuffle(state.library, secureRandom) };
    case "SET_LIFE":
      return { ...state, life: state.life + action.delta };
    case "ADD_COUNTER": {
      const battlefield = state.battlefield.map((c) =>
        c.instanceId === action.instanceId
          ? { ...c, counters: { ...c.counters, [action.counterType]: (c.counters[action.counterType] ?? 0) + action.delta } }
          : c,
      );
      return { ...state, battlefield };
    }
    case "SET_POSITION": {
      const battlefield = state.battlefield.map((c) =>
        c.instanceId === action.instanceId ? { ...c, x: action.x, y: action.y } : c,
      );
      return { ...state, battlefield };
    }
    case "MULLIGAN": {
      const combined = shuffle([...state.library, ...state.hand], secureRandom);
      return { ...state, hand: combined.slice(0, STARTING_HAND_SIZE), library: combined.slice(STARTING_HAND_SIZE) };
    }
    case "CONCEDE":
      return state;
  }
}

export function usePracticeGame(maindeck: SealedPoolEntry[]) {
  const [soloState, setSoloState] = useState<SoloState>(() => dealFreshState(maindeck));

  const send = useCallback((action: ClientAction) => {
    setSoloState((prev) => applyAction(prev, action));
  }, []);

  const reset = useCallback(() => {
    setSoloState(dealFreshState(maindeck));
  }, [maindeck]);

  const state: RoomView = useMemo(
    () => ({
      roomCode: "SOLO",
      status: "active",
      players: [
        {
          userId: SOLO_PLAYER_ID,
          displayName: "Você (solo)",
          connected: true,
          life: soloState.life,
          handCount: soloState.hand.length,
          libraryCount: soloState.library.length,
          hand: soloState.hand.map((id) => ({ instanceId: id, cardId: soloState.cardIndex[id] })),
          graveyard: soloState.graveyard.map((id) => ({ instanceId: id, cardId: soloState.cardIndex[id] })),
          exile: soloState.exile.map((id) => ({ instanceId: id, cardId: soloState.cardIndex[id] })),
        },
      ],
      battlefield: soloState.battlefield,
    }),
    [soloState],
  );

  return { state, send, reset };
}
