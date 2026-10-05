// Run fn over items with at most `limit` running at once; results keep the input order.
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Map with a size cap and optional expiry (oldest entry goes first). Keeps long-running servers from growing forever.
export class TtlCache {
  constructor(max, ttlMs = 0) {
    this.max = max;
    this.ttl = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (this.ttl && Date.now() - hit.at > this.ttl) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value) {
    if (this.map.size >= this.max && !this.map.has(key)) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { at: Date.now(), value });
  }
}
