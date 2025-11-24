//const u_Options.viewRadius      : f32 = 0.12;
//const u_Options.separationRadius: f32 = 0.05;
const VIEW_ANGLE_RAD   : f32 = 3.14159265 * (200.0 / 180.0); // 200 degrees
const COS_VIEW_ANGLE   : f32 = cos(VIEW_ANGLE_RAD);

//const u_Options.cohesionWeight  : f32 = 0.01;
//const u_Options.alignmentWeight     : f32 = 0.05;
//const u_Options.separationWeight     : f32 = 0.03;

//const u_Options.maxSpeed   : f32 = 0.2;
//const u_Options.maxForce   : f32 = 0.06;
//const u_Options.smoothFactor           : f32 = 0.18;
//const u_Options.jitter       : f32 = 0.02;

struct Boid {
    pos          : vec2<f32>,
    vel          : vec2<f32>,  
    color        : vec3<f32>,  
    seed         : f32,  
    maxSpeedMul  : f32,        
    maxForceMul  : f32,        
    _pad         : vec2<f32>, 
}; // 48 bytes (f32 = 4 bytes)


struct BoidOptions {
  speed: f32,
  amount: f32,
  size: f32,
  viewRadius: f32,
  separationRadius: f32,
  cohesionWeight: f32,
  alignmentWeight: f32,
  separationWeight: f32,
  maxSpeed: f32,
  maxForce: f32,
  smoothFactor: f32,
  jitter: f32,
  _pad1: vec4<f32>,
  _pad2: vec4<f32>,
}
@group(0) @binding(0)
var<storage, read_write> boids : array<Boid>;

@group(0) @binding(1)
var<uniform> u_time : f32;

@group(0) @binding(2)
var<uniform> u_aspectRatio : f32;

@group(0) @binding(3)
var<uniform> u_Options : BoidOptions;


fn safe_normalize(v: vec2<f32>) -> vec2<f32> {
    let len = length(v);
    return select(vec2<f32>(0.0), v / len, len > 1e-6);
}

fn clamp_length(v: vec2<f32>, maxLen: f32) -> vec2<f32> {
    let l = length(v);
    return select(v, v * (maxLen / l), l > maxLen);
}

// toroidal shortest vector
fn toroidal_diff(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    var d = a - b;
    if (d.x > 1.0)  { d.x -= 2.0; }
    if (d.x < -1.0) { d.x += 2.0; }
    if (d.y > 1.0)  { d.y -= 2.0; }
    if (d.y < -1.0) { d.y += 2.0; }
    return d;
}

// simple hash for float -> float
fn hash01(x: f32) -> f32 {
    return fract(sin(x) * 43758.5453123);
}

fn rnd(seed: f32, time: f32) -> f32 {
    return hash01(seed * 12.9898 + time * 0.374);
}

@compute @workgroup_size(64)
fn updateBoids(@builtin(global_invocation_id) gid : vec3<u32>) {
    let i = gid.x;
    if (i >= arrayLength(&boids)) { return; }

    var b = boids[i];
    var pos = b.pos;
    var vel = b.vel;
    var color = b.color;

    let seed = b.seed;
    let maxSpeedMul = select(1.0, b.maxSpeedMul, b.maxSpeedMul > 0.0);
    let maxForceMul = select(1.0, b.maxForceMul, b.maxForceMul > 0.0);

    let MAX_SPEED = u_Options.maxSpeed * maxSpeedMul;
    let MAX_FORCE = u_Options.maxForce * maxForceMul;

    var avgPos = vec2<f32>(0.0);
    var avgVel = vec2<f32>(0.0);
    var separation = vec2<f32>(0.0);
    var count: f32 = 0.0;

    let numBoids = arrayLength(&boids);

    // --- Neighbor loop ---
    for (var j: u32 = 0u; j < numBoids; j = j + 1u) {
        if (j == i) { continue; }
        let other = boids[j];
        let diff = toroidal_diff(other.pos, pos);
        let dist = length(diff);

        if (dist < u_Options.viewRadius && dist > 0.0) {
            let forward = safe_normalize(vel);
            let toOther = safe_normalize(diff);
            if (dot(forward, toOther) >= COS_VIEW_ANGLE) {
                var falloff = 1.0 - (dist / u_Options.viewRadius);
                falloff = falloff * falloff;

                avgPos += other.pos * falloff;
                avgVel += other.vel * falloff;
                count += falloff;

                if (dist < u_Options.separationRadius) {
                    let sepStrength = (u_Options.separationRadius - dist) / u_Options.separationRadius;
                    separation += safe_normalize(pos - other.pos) * (sepStrength * (1.0 + 1.0 / (dist + 1e-4)));
                }
            }
        }
    }

    var newVel = vel;

    if (count > 0.0) {
        avgPos = avgPos / count;
        avgVel = avgVel / count;

        // Cohesion
        var steerC = safe_normalize(toroidal_diff(avgPos, pos)) * MAX_SPEED - vel;
        steerC = clamp_length(steerC, MAX_FORCE);

        // Alignment
        var steerA = safe_normalize(avgVel) * MAX_SPEED - vel;
        steerA = clamp_length(steerA, MAX_FORCE);

        // Separation
        var steerS = clamp_length(separation, MAX_FORCE * 1.5);

        newVel += steerC * u_Options.cohesionWeight;
        newVel += steerA * u_Options.alignmentWeight;
        newVel += steerS * u_Options.separationWeight;
    }

    // small jitter
    let noiseX = rnd(seed + f32(i), u_time) - 0.5;
    let noiseY = rnd(seed + 7.0 + f32(i), u_time) - 0.5;
    let jitter = vec2<f32>(noiseX, noiseY) * u_Options.jitter;
    newVel += jitter;

    // smooth velocity
    newVel = vel * (1.0 - u_Options.smoothFactor) + newVel * u_Options.smoothFactor;
    newVel = clamp_length(newVel, MAX_SPEED);

    // update position
    pos += newVel * u_Options.speed;

    // wrap-around
    if (pos.x > 1.0*u_aspectRatio)  { pos.x = -1.0*u_aspectRatio; }
    if (pos.x < -1.0*u_aspectRatio) { pos.x =  1.0*u_aspectRatio; }
    if (pos.y > 1.0)  { pos.y = -1.0; }
    if (pos.y < -1.0) { pos.y =  1.0; }

    // write back
    boids[i].pos = pos;
    boids[i].vel = newVel;
    boids[i].color = color;
}
