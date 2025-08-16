// src/Main.ts
import { Engine } from "./core/Engine";
import { Time } from "./core/Time";
import { Input } from "./input/Input";
import { Renderer2D } from "./render/Renderer2D";
import { Texture } from "./engine/Texture";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const hud = document.getElementById("hud")!;

const renderer = new Renderer2D(canvas);
const input = new Input();
const time = new Time();

let tex: Texture | null = null;

// load HTMLImageElement
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// pixels (top-left origin) -> normalized UVs (bottom-left origin)
function uvFromPixels(px: number, py: number, pw: number, ph: number, t: Texture) {
  const u0 = px / t.width;
  const u1 = (px + pw) / t.width;
  const v1 = (t.height - py) / t.height;           // top edge in UV space
  const v0 = (t.height - (py + ph)) / t.height;    // bottom edge in UV space
  return { u0, v0, u1, v1 };
}

(async () => {
  const img = await loadImage("/sprites.png");   // from public/
  tex = new Texture(renderer.gl, img, { pixelArt: true });
})();

const engine = new Engine(() => {
  time.tick();

  if (tex) {
    // Draw the full sprites.png image, centered at (0,0), size 1.2x1.2 world units, no rotation, full UVs
    renderer.sprite(tex, 0, 0, 1.2, 1.2, 0, 0, 0, 1, 1);
  }

  hud.innerHTML = `fps: ${time.fps.toFixed(0)}<br/>draws: ${renderer.draws}`;
  input.endFrame();
});

// canvas size sync
function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
}
window.addEventListener("resize", resize);
resize();

engine.start();