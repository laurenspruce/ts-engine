// src/engine/Texture.ts
export class Texture {
  gl: WebGL2RenderingContext;
  handle: WebGLTexture;
  width = 0;
  height = 0;

  constructor(gl: WebGL2RenderingContext, image: HTMLImageElement, opts: { pixelArt?: boolean } = {}) {
  this.gl = gl;
  const tex = gl.createTexture();
  if (!tex) throw new Error("Failed to create WebGL texture");
  this.handle = tex;

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image vertically so it appears right-side up
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const pixelArt = opts.pixelArt ?? true;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pixelArt ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, pixelArt ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  this.width = image.naturalWidth;
  this.height = image.naturalHeight;
  }
}