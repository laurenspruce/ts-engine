// src/shaders/sprite.ts
export const spriteVert = `#version 300 es
layout(location=0) in vec2 a_pos;
layout(location=1) in vec2 a_uv;

uniform mat3 u_mvp;      // 2D model-view-projection
uniform vec4 u_uv;       // (u0,v0,u1,v1) sub-rect

out vec2 v_uv;

void main() {
  // remap unit quad UVs [0..1] to a sub-rect of the texture
  v_uv = mix(u_uv.xy, u_uv.zw, a_uv);
  vec3 p = u_mvp * vec3(a_pos, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}`;

export const spriteFrag = `#version 300 es
precision mediump float;

in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec4 u_tint;     // RGBA multiplier (1,1,1,1 = no tint)

out vec4 outColor;

void main() {
  vec4 c = texture(u_tex, v_uv);
  outColor = c * u_tint;
}`;