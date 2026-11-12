/**
 * Cryptographically secure random utilities using crypto.getRandomValues().
 * Exactly as used by wheelofnames.com to ensure high-entropy, genuinely unpredictable results.
 */

export function cryptoRandomFloat(): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

export function cryptoRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return min + (array[0] % range);
}

export function cryptoShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
