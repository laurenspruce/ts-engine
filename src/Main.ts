import { Engine } from './core/Engine';
import { Time } from './core/Time';
import { Input } from './input/Input';
import { Renderer2D } from './render/Renderer2D';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;

const renderer = new Renderer2D(canvas);
const input = new Input();
const time = new Time();

let angle = 0;

const engine = new Engine(() => {
  time.tick();
  angle += time.dt * (input.isDown('Space') ? 2.5 : 1.0);
  renderer.drawRotatingQuad(angle);
  hud.innerHTML = `fps: ${time.fps.toFixed(0)}<br/>draws: ${renderer.draws}`;
  input.endFrame();
});

const resize = () => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
  canvas.height = Math.floor(rect.height * (window.devicePixelRatio || 1));
};
window.addEventListener('resize', resize);
resize();

engine.start();
console.log('Press Space to speed up rotation');
