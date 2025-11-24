const PI: f32 = 3.141592653589793;


struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@group(0) @binding(0)
var<uniform> u_Proj : mat4x4<f32>;


@group(0) @binding(1)
var<uniform> u_Size: f32;


@vertex
fn vs_main(
  @location(0) vertexPos: vec2<f32>,    // Mesh vertex (local)
  @location(1) instPos: vec2<f32>,      // Instance position (px,py)
  @location(2) instVel: vec2<f32>,      // Instance velocity (vx,vy)
  @location(3) instColor: vec3<f32>,    // Instance color (r,g,b)
  @location(4) instLeader: f32          // Leader flag (0 or 1)
) -> VertexOutput {
  var out: VertexOutput;

  // fallback for tiny velocities
  let eps: f32 = 1e-5;
  var angle: f32 = PI * 0.5; // default rotation (so local (0,-1) faces +X)
  let speed: f32 = length(instVel);
  if (speed > eps) {
    angle = atan2(instVel.y, instVel.x) + PI * 0.5;
  }

  let c: f32 = cos(angle);
  let s: f32 = sin(angle);

  // explizite 2D-Rotation: [ c -s; s  c ] * vertexPos
  let rotated: vec2<f32> = vec2<f32>(
    vertexPos.x*u_Size * c - vertexPos.y*u_Size * s,
    vertexPos.x*u_Size * s + vertexPos.y*u_Size * c
  );

  let pos: vec2<f32> = instPos + rotated;
  out.position = u_Proj * vec4<f32>(pos, -10.0, 1.0);

  // Farbe, Highlight für Leader
  out.color = instColor;
  if (instLeader == 1.0) {
    out.color = vec3<f32>(1.0, 0.0, 0.0);
  }

  return out;
}
