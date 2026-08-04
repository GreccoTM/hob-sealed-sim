export type RandomFn = () => number;

/** PRNG determinístico (mulberry32) — usado em testes para reprodutibilidade. */
export function seededRandom(seed: number): RandomFn {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RNG criptograficamente forte — usado em produção (Worker tem Web Crypto nativo). */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}
