import vertexSrc from "./shaders/vertex.wgsl?raw";
import fragmentSrc from "./shaders/fragment.wgsl?raw";
import computeSrc from "./shaders/compute.wgsl?raw";
import { mat4 } from "wgpu-matrix";

interface Boid {
  position: [number, number];
  velocity: [number, number];
  color: [number, number, number];
  seed: number;
  maxSpeedMul: number;
  maxForceMul: number;
  _padding: [number, number];
}

export interface BoidOptions {
  speed: number;
  amount: number;
  size: number;
  viewRadius: number;
  separationRadius: number;
  cohesionWeight: number;
  alignmentWeight: number;
  separationWeight: number;
  maxSpeed: number;
  maxForce: number;
  smooth: number;
  jitter: number;
}

export async function startRenderer(
  canvas: HTMLCanvasElement,
  options: BoidOptions
) {
  if (!navigator.gpu) throw new Error("WebGPU not supported");

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) throw new Error("No GPU device");

  const context = canvas.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: format,
    alphaMode: "opaque",
    width: canvas.width,
    height: canvas.height,
  });

  function makeProjection() {
    const aspect = canvas.width / canvas.height;

    // Skaliert X entsprechend, damit keine Verzerrung entsteht
    return mat4.ortho(-aspect, aspect, -1, 1, 0.1, 100);
  }
  const maxBoids = 10000;
  const boidCount = options.amount;
  let boids: Boid[] = [];
  const aspRt = canvas.width / canvas.height;

  function generateBoid() {
    const pos: [number, number] = [
      (Math.random() * 2 - 1) * aspRt,
      Math.random() * 2 - 1,
    ];
    const vel: [number, number] = [
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4,
    ];
    const seed: number = Math.random() * 1000;
    const color: [number, number, number] = [
      Math.random(),
      Math.random(),
      Math.random(),
    ];
    const maxSpeedMul: number = 0.9 + Math.random() * 0.2; // 0.9–1.1
    const maxForceMul: number = 0.8 + Math.random() * 0.5; // 0.8–1.3
    const padding: [number, number] = [0, 0];
    return {
      position: pos,
      velocity: vel,
      color: color,
      seed: seed,
      maxSpeedMul: maxSpeedMul,
      maxForceMul: maxForceMul,
      _padding: padding,
    }
  }

  function generateBoids() {
      for (let i = 0; i < boidCount; i++) {
        boids.push(generateBoid());
      }
  }
  generateBoids();



  const instanceData = new Float32Array(boids.length * 12);
  boids.forEach((b, i) => {
    instanceData.set(
      [
        ...b.position,
        ...b.velocity,
        ...b.color,
        b.seed,
        b.maxSpeedMul,
        b.maxForceMul,
        ...b._padding,
      ],
      i * 12
    );
  });
  

  const timeBuffer = device.createBuffer({
    size: 4, // f32
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const optionsBuffer = device.createBuffer({
    size: 20*4, // min. 80 bytes for std140 aligment!! only 12 needed
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });


  const aspectRatioBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const scaleBuffer = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const projBuffer = device.createBuffer({
    size: 4 * 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  //device.queue.writeBuffer(canvasSizeBuffer, 0, new Float32Array([canvas.width,canvas.height]));
  const instanceBuffer = device.createBuffer({
    size: 12*4* maxBoids, 
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(instanceBuffer.getMappedRange()).set(instanceData);
  instanceBuffer.unmap();

  const computeModule = device.createShaderModule({ code: computeSrc });
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "updateBoids" },
  });

  // Compute bind group (nur für Compute-Pipeline)
  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: instanceBuffer } },
      {
        binding: 1,
        resource: { buffer: timeBuffer },
      },
      {
        binding: 2,
        resource: { buffer: aspectRatioBuffer },
      },
      {
        binding: 3,
        resource: { buffer: optionsBuffer },
      },

    ],
  });

  // --- Mesh (Dreieck) ---
  const scale = 0.3
  const meshVertices = new Float32Array([
    0*scale,
    -0.05*scale,
    -0.03*scale,
    0.03*scale,
    0.03*scale,
    0.03*scale,
  ]);
  const meshVertexBuffer = device.createBuffer({
    size: meshVertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(meshVertexBuffer.getMappedRange()).set(meshVertices);
  meshVertexBuffer.unmap();

  const vertexModule = device.createShaderModule({ code: vertexSrc });
  const fragmentModule = device.createShaderModule({ code: fragmentSrc });

  // --- Pipeline ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vertexModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 2 * 4,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
          stepMode: "vertex",
        },
        {
          arrayStride: 12 * 4,
          attributes: [
            { shaderLocation: 1, offset: 0, format: "float32x2" }, // pos
            { shaderLocation: 2, offset: 8, format: "float32x2" }, // vel
            { shaderLocation: 3, offset: 16, format: "float32x3" }, // color
            { shaderLocation: 4, offset: 28, format: "float32" }, // seed
            { shaderLocation: 5, offset: 32, format: "float32" }, // maxSpeedMul
            { shaderLocation: 6, offset: 36, format: "float32" }, // maxForceMul
            { shaderLocation: 7, offset: 40, format: "float32x2" }, // padding
          ],
          stepMode: "instance",
        },
      ],
    },
    fragment: {
      module: fragmentModule,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });

  const bindGroupLayout = pipeline.getBindGroupLayout(0);

  const uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: projBuffer },
      },
            {
        binding: 1,
        resource: { buffer: scaleBuffer },
      },
    ],
  });

  function updateTime(elapsedSeconds: number) {
    // float32 in little-endian
    if (!device) return;
    const arrayBuffer = new ArrayBuffer(4);
    new DataView(arrayBuffer).setFloat32(0, elapsedSeconds, true);
    device.queue.writeBuffer(timeBuffer, 0, arrayBuffer);
  }

  function updateBoidUniforms(options: BoidOptions) {
      if (!device) return;
    const boidUniformData = new Float32Array([
      options.speed,
      options.amount,
      options.size,
      options.viewRadius,
      options.separationRadius,
      options.cohesionWeight,
      options.alignmentWeight,
      options.separationWeight,
      options.maxSpeed,
      options.maxForce,
      options.smooth,
      options.jitter,
      0,0,0,0,0,0,0,0,
    ]);
    //12 * 4 bytes + 8+4 bytes padding
    device.queue.writeBuffer(optionsBuffer, 0, boidUniformData);

  }

  async function updateBoids() {
    const newLength = options.amount;
    if(newLength === boids.length) return;
    if (newLength < boids.length) {
      boids = boids.slice(0,newLength);
    } else {
      for(let i=0;i<newLength - boids.length;i++) {
        boids.push(generateBoid());
    }



  }

  const newInstanceData = new Float32Array(boids.length * 12);
boids.forEach((b, i) => {
  newInstanceData.set([
    ...b.position,
    ...b.velocity,
    ...b.color,
    b.seed,
    b.maxSpeedMul,
    b.maxForceMul,
    ...b._padding,
  ], i * 12);
});
device.queue.writeBuffer(
  instanceBuffer,
  0,
  newInstanceData.buffer,
  newInstanceData.byteOffset,
  newInstanceData.byteLength
);

    
  }

  function frame() {
    if (!device) return;
    updateBoids();
    const now = performance.now() / 1000; // seconds
    updateTime(now);
    updateBoidUniforms(options);
    
    {
    const arrayBuffer = new ArrayBuffer(4);
    new DataView(arrayBuffer).setFloat32(0, canvas.width / canvas.height, true);
    device.queue.writeBuffer(aspectRatioBuffer, 0, arrayBuffer);
    }
    const commandEncoder = device.createCommandEncoder();
    const projection = makeProjection();
    device.queue.writeBuffer(projBuffer, 0, projection as Float32Array);
{
        const arrayBuffer = new ArrayBuffer(4);
    new DataView(arrayBuffer).setFloat32(0, options.size, true);
        device.queue.writeBuffer(scaleBuffer, 0, arrayBuffer);
    device.queue.writeBuffer(scaleBuffer, 0, arrayBuffer);
}


    // --- Compute Pass (updatet instanceBuffer direkt) ---
    {
      const pass = commandEncoder.beginComputePass();
      pass.setPipeline(computePipeline);
      pass.setBindGroup(0, computeBindGroup);
      pass.dispatchWorkgroups(Math.ceil(boids.length / 64));
      pass.end();
    }

    // --- Render Pass (liest instanceBuffer als Instanced Vertex Buffer) ---
    const textureView = context.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: "store",
        },
      ],
    });

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, meshVertexBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);

    // ** Nicht nötig: computeBindGroup in Render-Pass binden -> weg damit **
    // passEncoder.setBindGroup(0, computeBindGroup); // <- entfernt

    passEncoder.draw(meshVertices.length / 2, boids.length, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  frame();
}
