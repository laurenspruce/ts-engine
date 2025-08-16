export type StepFn = (dt: number) => void;

export class Engine {
  private rafId = 0;
  private running = false;
  constructor(private step: StepFn) {}

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      this.step((now - (loop as any).last) / 1000 || 0);
      (loop as any).last = now;
      if (this.running) this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() { this.running = false; cancelAnimationFrame(this.rafId); }
}