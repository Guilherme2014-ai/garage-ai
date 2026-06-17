/**
 * Process-wide concurrency gate for WaveSpeed calls.
 *
 * Every WaveSpeed task (image edits, LLM completions) is funneled through a
 * single semaphore so the number of in-flight calls never exceeds the account
 * limit, regardless of how many clients or requests fan out in parallel (e.g.
 * the category-level preview generation firing one edit per option).
 *
 * The limit is read from `WAVESPEED_CONCURRENCY_LENGHT`; invalid or missing
 * values fall back to {@link DEFAULT_CONCURRENCY}.
 *
 * Note: this gate is per server instance. In a multi-instance deployment the
 * effective limit is `instances * WAVESPEED_CONCURRENCY_LENGHT`.
 */

/** Fallback used when the env var is unset or not a positive integer. */
const DEFAULT_CONCURRENCY = 15;

function resolveLimit(): number {
  const parsed = Number.parseInt(
    process.env.WAVESPEED_CONCURRENCY_LENGHT ?? "",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CONCURRENCY;
}

/** Minimal FIFO counting semaphore. */
class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  release(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}

/**
 * Module-level singleton, shared across all requests handled by this server
 * instance.
 */
const semaphore = new Semaphore(resolveLimit());

/**
 * Runs `task` once a WaveSpeed concurrency slot is free, releasing the slot
 * when it settles (success or failure).
 */
export async function runWithWaveSpeedLimit<T>(
  task: () => Promise<T>,
): Promise<T> {
  await semaphore.acquire();
  try {
    return await task();
  } finally {
    semaphore.release();
  }
}
