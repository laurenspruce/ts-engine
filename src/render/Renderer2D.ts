// src/render/Renderer2D.ts
import { spriteVert, spriteFrag } from "../shaders/sprite";   // lowercase
import type { Texture } from "../engine/Texture";

export class Renderer2D {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;

  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  ibo: WebGLBuffer;

  locMvp: WebGLUniformLocation;
  locUv: WebGLUniformLocation;
  locTex: WebGLUniformLocation;
  locTint: WebGLUniformLocation;

  draws = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    this.program = this.createProgram(spriteVert, spriteFrag);
    gl.useProgram(this.program);

    this.locMvp  = gl.getUniformLocation(this.program, "u_mvp")!;
    this.locUv   = gl.getUniformLocation(this.program, "u_uv")!;
    this.locTex  = gl.getUniformLocation(this.program, "u_tex")!;
    this.locTint = gl.getUniformLocation(this.program, "u_tint")!;

    // Quad geometry: interleaved (x,y,u,v)
    const verts = new Float32Array([
      -0.5, -0.5,  0, 0,
       0.5, -0.5,  1, 0,
       0.5,  0.5,  1, 1,
      -0.5,  0.5,  0, 1,
    ]);
    const indices = new Uint16Array([0,1,2, 0,2,3]);

    const vao = gl.createVertexArray()!;
    const vbo = gl.createBuffer()!;
    const ibo = gl.createBuffer()!;
    this.vao = vao; this.vbo = vbo; this.ibo = ibo;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    gl.clearColor(0.06, 0.06, 0.07, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private createShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || "shader compile error");
    }
    return sh;
  }

  private createProgram(vsSrc: string, fsSrc: string): WebGLProgram {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "program link error");
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    return prog;
  }

  private resizeViewport() {
    const gl = this.gl;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor((gl.canvas as HTMLCanvasElement).clientWidth * dpr);
    const h = Math.floor((gl.canvas as HTMLCanvasElement).clientHeight * dpr);
    if (gl.canvas.width !== w || gl.canvas.height !== h) {
      gl.canvas.width = w; gl.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }

  private ortho2D(): Float32Array {
    const gl = this.gl;
    const w = gl.canvas.width as number;
    const h = gl.canvas.height as number;
    const aspect = w / h;
    const l = -aspect, r = aspect, b = -1, t = 1;
    return new Float32Array([
      2/(r-l), 0,        0,
      0,       2/(t-b),  0,
      -(r+l)/(r-l), -(t+b)/(t-b), 1,
    ]);
  }

  private mul3x3(a: Float32Array, b: Float32Array): Float32Array {
    const m = new Float32Array(9);
    for (let r=0;r<3;r++) for (let c=0;c<3;c++) {
      m[c + r*3] = a[r*3+0]*b[c+0] + a[r*3+1]*b[c+3] + a[r*3+2]*b[c+6];
    }
    return m;
  }

  // Draw a textured sprite centered at (x,y); size (w,h) in world units.
  // UV sub-rect in normalized [0..1] (0,0,1,1) = full image.
  sprite(
    tex: Texture,
    x: number, y: number,
    w: number, h: number,
    rot = 0,
    u0 = 0, v0 = 0, u1 = 1, v1 = 1,
    tint: [number, number, number, number] = [1,1,1,1]
  ) {
    const gl = this.gl;
    this.resizeViewport();
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const ortho = this.ortho2D();
    const c = Math.cos(rot), s = Math.sin(rot);
    const trs = new Float32Array([
      c*w,  s*w,  0,
     -s*h,  c*h,  0,
        x,    y,  1,
    ]);
    const mvp = this.mul3x3(ortho, trs);

    gl.uniformMatrix3fv(this.locMvp, false, mvp);
    gl.uniform4f(this.locUv, u0, v0, u1, v1);
    gl.uniform4f(this.locTint, tint[0], tint[1], tint[2], tint[3]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.handle);
    gl.uniform1i(this.locTex, 0);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    this.draws = 1;
  }
}