import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { SealedPoolEntry } from "@hob/shared";

interface PoolContextValue {
  poolId: string | null;
  setPoolId: Dispatch<SetStateAction<string | null>>;
  pool: SealedPoolEntry[] | null;
  setPool: Dispatch<SetStateAction<SealedPoolEntry[] | null>>;
  deck: Map<string, number>;
  setDeck: Dispatch<SetStateAction<Map<string, number>>>;
}

const PoolContext = createContext<PoolContextValue | null>(null);

export function PoolProvider({ children }: { children: ReactNode }) {
  const [poolId, setPoolId] = useState<string | null>(null);
  const [pool, setPool] = useState<SealedPoolEntry[] | null>(null);
  const [deck, setDeck] = useState<Map<string, number>>(new Map());

  return (
    <PoolContext.Provider value={{ poolId, setPoolId, pool, setPool, deck, setDeck }}>
      {children}
    </PoolContext.Provider>
  );
}

export function usePool(): PoolContextValue {
  const ctx = useContext(PoolContext);
  if (!ctx) throw new Error("usePool deve ser usado dentro de <PoolProvider>");
  return ctx;
}
