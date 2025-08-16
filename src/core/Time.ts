export class Time {
  private _last = performance.now();
  dt = 0; // seconds
  fps = 0;

  tick(now = performance.now()) {
    const ms = now - this._last;
    this._last = now;
    this.dt = Math.min(0.1, ms / 1000);
    this.fps = 1000 / ms;
  }
}