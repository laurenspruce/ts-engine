const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in vec2 a_uv;
uniform mat3 u_mvp;
out vec2 v_uv;
void main(){
  v_uv = a_uv;
  vec3 p = u_mvp * vec3(a_pos, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec4 u_tint;
void main(){
  outColor = vec4(v_uv, 0.5 + 0.5*sin(u_tint.x), 1.0);
}`;

export class Renderer2D {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  ibo: WebGLBuffer;
  locMvp: WebGLUniformLocation;
  locTint: WebGLUniformLocation;
  draws = 0;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.program = this.createProgram(VS, FS);

    const verts = new Float32Array([
      // x, y,   u, v
      -0.5, -0.5, 0, 0,
       0.5, -0.5, 1, 0,
       0.5,  0.5, 1, 1,
      -0.5,  0.5, 0, 1,
    ]);
    const indices = new Uint16Array([0,1,2, 0,2,3]);

    const vao = gl.createVertexArray()!;
    const vbo = gl.createBuffer()!;
    const ibo = gl.createBuffer()!;
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

    this.vao = vao; this.vbo = vbo; this.ibo = ibo;
    this.locMvp = gl.getUniformLocation(this.program, 'u_mvp')!;
    this.locTint = gl.getUniformLocation(this.program, 'u_tint')!;

    gl.clearColor(0.06, 0.06, 0.07, 1.0);
  }

  private createShader(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'shader error');
    }
    return sh;
  }

  private createProgram(vsSrc: string, fsSrc: string) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'link error');
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    return prog;
  }

  resize() {
    const gl = this.gl;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w: number, h: number;
    if (gl.canvas instanceof HTMLCanvasElement) {
      w = Math.floor(gl.canvas.clientWidth * dpr);
      h = Math.floor(gl.canvas.clientHeight * dpr);
      if (gl.canvas.width !== w || gl.canvas.height !== h) {
        gl.canvas.width = w;
        gl.canvas.height = h;
      }
    } else {
      // OffscreenCanvas fallback
      w = Math.floor(gl.canvas.width * dpr);
      h = Math.floor(gl.canvas.height * dpr);
      gl.canvas.width = w;
      gl.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }

  ortho2D(): Float32Array {
    const gl = this.gl;
    const w = (gl.canvas as HTMLCanvasElement).width;
    const h = (gl.canvas as HTMLCanvasElement).height;
    const aspect = w / h;
    const l = -aspect, r = aspect, b = -1, t = 1;
    return new Float32Array([
      2/(r-l), 0,       0,
      0,       2/(t-b), 0,
      -(r+l)/(r-l), -(t+b)/(t-b), 1,
    ]);
  }

  drawRotatingQuad(angle: number) {
    const gl = this.gl;
    this.resize();
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const m = this.ortho2D();
    const c = Math.cos(angle), s = Math.sin(angle);
    const scale = 0.6;
    const rotScale = new Float32Array([
      c*scale,  s*scale, 0,
      -s*scale, c*scale, 0,
      0,        0,       1,
    ]);

    const a = m, b = rotScale;
    const mvp = new Float32Array(9);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        mvp[col + row*3] = a[row*3+0]*b[col+0] + a[row*3+1]*b[col+3] + a[row*3+2]*b[col+6];
      }
    }

    gl.uniformMatrix3fv(this.locMvp, false, mvp);
    gl.uniform4f(this.locTint, angle, 0, 0, 1);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    this.draws = 1;

    gl.bindVertexArray(null);
  }
}