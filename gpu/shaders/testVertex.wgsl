@group(0) @binding(0) var<storage, read> vertices: array<vec2<f32>>;

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> @builtin(position) vec4<f32> {

  // For simple non-instanced lines, instanceIndex can be ignored
  let pos = vertices[vertexIndex];  // x,y in clip space (-1..1)
  return vec4<f32>(pos, 0.0, 1.0);
}
