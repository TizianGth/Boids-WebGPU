// TODO: Adjust for delta Time!!

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
  @location(0) vertexPos: vec2<f32>,
  @location(1) instPos: vec2<f32>,
  @location(2) instVel: vec2<f32>,
  @location(3) instColor: vec3<f32>,
  // other locations 4-7 not necessary here

) -> VertexOutput {
  var out: VertexOutput;

  var angle: f32 = PI * 0.5; // default rotation (so local (0,-1) faces +X)
  let speed: f32 = length(instVel);
  angle = atan2(instVel.y, instVel.x) + PI * 0.5;
  
  let c: f32 = cos(angle);
  let s: f32 = sin(angle);

  // 2D-Rotation: [ c -s; s  c ] * vertexPos
  let rotated: vec2<f32> = vec2<f32>(
    vertexPos.x*u_Size * c - vertexPos.y*u_Size * s,
    vertexPos.x*u_Size * s + vertexPos.y*u_Size * c
  );

  let pos: vec2<f32> = instPos + rotated;
  out.position = u_Proj * vec4<f32>(pos, -10.0, 1.0); // moving everyting to z=-10 to be infront of the camera
  out.color = instColor;

  return out;
}
