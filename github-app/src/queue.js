//src/queue.js

// Ultra-light in-memory queue with fixed concurrency

export class InMemoryQueue {
  constructor({ concurrency = 2, worker, app }) {
    this.concurrency = concurrency;
    this.worker = worker;   // async (job) => void
    this.app = app;         // for logging
    this.q = [];
    this.active = 0;
  }

  enqueue(job) {
    this.q.push(job);
    setImmediate(() => this._runNext());
  }

  _runNext() {
    if (this.active >= this.concurrency) return;
    const job = this.q.shift();
    if (!job) return;

    this.active++;
    this.worker(job)
      .catch(err => this.app?.log?.error({ err }, "job failed"))
      .finally(() => {
        this.active--;
        this._runNext();
      });
  }
}
