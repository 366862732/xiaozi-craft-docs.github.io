# dx12-lib-template-26.1.2
:::warning
Do not attempt to use any ported versions of this project. The author also does not recommend them.
:::
> **A DirectX 12 backend implementation for Minecraft 26.1.2+ Fabric mod.**
> By implementing Mojang's official `GpuBackend` / `GpuDeviceBackend` interfaces, a precompiled C++ DLL (`dx12_mc.dll`) replaces the native OpenGL rendering path, enabling Minecraft to use D3D12 for direct rendering while preserving mod extension points (AA settings, ModMenu integration).

## Overview

This project uses **Mixin injection** to modify Minecraft's graphics API selection logic, switching the game to use the D3D12 backend while providing rendering state synchronization, configuration management, and mod compatibility at the Java layer.

### Core Features

- **Mixin Injection**: Only 1 Mixin (`PreferredGraphicsApiMixin`) needed to set D3D12 as the preferred API; Minecraft's native rendering pipeline drives our backend directly
- **Official GpuBackend Interface**: Full implementation of `GpuBackend` / `GpuDeviceBackend` / `CommandEncoderBackend` / `RenderPassBackend` / `GpuSurfaceBackend` and other official interfaces
- **Zero Custom Render Loop**: No override of `RenderSystem`; fully takes over Minecraft's official rendering flow
- **Shaderc + Spvc Compilation Chain**: GLSL → SPIR-V (shaderc) → HLSL SM5.1 (spvc) → DXBC (native D3DCompile)
- **Resource Safety**: All D3D12 resources managed through Java wrapper classes (`Dx12Gpu*`), automatically released with Minecraft's lifecycle
- **Configuration UI**: Dx12Config persistent config, Dx12SettingsScreen settings UI, ModMenu integration
- **DLL Auto-loading**: Extracted from JAR to `{user.dir}/dx12mod/dx12_mc.dll`, supports version isolation
- **MC 26.2**: Supports Mojang's official mappings (no Yarn mapping dependency)

### Current Phase: Phases P0-P6 all completed, full shader rendering pipeline operational

| Phase | Status | Description |
|-------|--------|-------------|
| **P0: Native Layer Foundation** | ✅ Completed | dx12_mc.dll: D3D12 initialization + resource creation (texture/buffer/sampler/view) |
| **P1: Device Self-Test** | ✅ Completed | Dx12Native.dx12CreateDevice() + resource self-test |
| **P2: Resource Layer** | ✅ Completed | Dx12GpuTexture / Dx12GpuBuffer / Dx12GpuSampler / Dx12GpuTextureView |
| **P3: Command Encoding Layer** | ✅ Completed | Dx12CommandEncoderBackend: submit/fence/copy/clear/timestamp |
| **P4: Pipeline Compilation Layer** | ✅ Completed | shaderc SPIR-V → spvc reflection/rebind → HLSL → D3DCompile DXBC |
| **P5: Swap Chain Layer** | ✅ Completed | Dx12GpuSurface: DXGI flip-model swapchain (configure/acquire/blit/present) |
| **P6: Draw Full Pipeline** | ✅ Completed | Dx12RenderPassBackend: setPipeline + pushDescriptors + draw/drawIndexed |
| **Self-Test Passed** | ✅ | GUI + GUI_TEXTURED pipeline compilation + surface blit + buffer copy + texture readback all passing |

## Project Structure

```
dx12-lib-template-26.1.2/
├── fabric/                          # Fabric mod (Java)
│   ├── src/main/java/com/dx12/
│   │   ├── Dx12Mod.java            # Mod entry point, sets graphics API preference + log self-test info
│   │   ├── ModMenuIntegration.java # ModMenuApi implementation, config screen integration
│   │   ├── config/
│   │   │   └── Dx12Config.java     # Config persistence (aa_mode, etc., Properties format)
│   │   ├── gui/
│   │   │   └── Dx12SettingsScreen.java # AA mode settings GUI (None/FXAA/SMAA/TAA)
│   │   ├── mixin/
│   │   │   └── PreferredGraphicsApiMixin.java  # Sets D3D12 as the preferred graphics API
│   │   └── dx12/                    # D3D12 backend core implementation (mirrors official Vulkan backend)
│   │       ├── Dx12Native.java        # JNI bridge layer (66 native methods)
│   │       ├── Dx12Backend.java       # GpuBackend implementation: window/device creation + 4-round self-test (394 lines)
│   │       ├── Dx12Device.java        # GpuDeviceBackend implementation: resource creation + shader compilation cache (533 lines)
│   │       ├── Dx12ShaderCompiler.java    # GLSL→SPIR-V→HLSL compilation chain (shaderc+spvc, 190 lines)
│   │       ├── Dx12IntermediaryShaderModule.java  # SPIR-V reflection binding info (429 lines)
│   │       ├── Dx12CompiledShader.java    # Compilation output (HLSL source + binding list)
│   │       ├── Dx12CompiledRenderPipeline.java  # Compiled render pipeline
│   │       ├── Dx12BindGroupEntry.java    # Pipeline binding entry (UBO/SRV/TexelBuffer)
│   │       ├── Dx12GpuSurface.java      # DXGI swapchain (P5 swap chain layer)
│   │       ├── Dx12CommandEncoderBackend.java   # Command encoding layer (P3 submit/copy/clear, 334 lines)
│   │       ├── Dx12RenderPassBackend.java     # Render pass layer (P6 draw full pipeline, 368 lines)
│   │       ├── Dx12TransientMemory.java     # Transient memory management (per-frame buffer recycling, 210 lines)
│   │       ├── Dx12GpuTexture.java        # D3D12 texture resource wrapper
│   │       ├── Dx12GpuTextureView.java    # D3D12 texture view (SRV)
│   │       ├── Dx12GpuBuffer.java         # D3D12 buffer resource wrapper
│   │       ├── Dx12GpuSampler.java        # D3D12 sampler wrapper
│   │       └── Dx12GpuQueryPool.java      # D3D12 GPU timestamp query pool
│   ├── src/main/resources/
│   │   ├── fabric.mod.json         # Fabric mod descriptor (client + modmenu entrypoints)
│   │   ├── gl4dx12.mixins.json     # Mixin configuration (1 mixin)
│   │   └── assets/dx12mod/icon.png # Mod icon (16x16)
│   ├── libs/
│   │   └── modmenu-20.0.1.jar     # ModMenu local dependency (MC 26.2)
│   ├── build.gradle                # Gradle build config (loom 1.15.5)
│   └── gradle.properties           # Version parameters
├── native/                          # D3D12 native layer (C++17)
│   ├── src/
│   │   ├── dx12_device.cpp         # D3D12 device/resource creation + render pass + timestamps
│   │   ├── dx12_device.h           # DX12DeviceHandle struct definition
│   │   ├── dx12_surface.cpp        # DXGI swapchain + blit + present
│   │   └── dx12_native.cpp         # JNI entry (66 native methods)
│   ├── CMakeLists.txt              # CMake build configuration
│   └── build/bin/Release/dx12_mc.dll  # Precompiled DLL (~150KB, extracted from JAR for deployment)
└── steps.md                        # Detailed development steps documentation
```

## Architecture Design

### Rendering Pipeline: Fully Take Over Minecraft's Official Rendering Flow

This project does not create a custom render loop; instead, it implements the `GpuBackend` interface family introduced in Minecraft 26.1+, allowing the game engine to drive the entire rendering:

```
Minecraft RenderSystem
  │
  ▼
GpuBackend.createDevice(window, shaderSource, ...)   ← Dx12Backend
  │
  ├─ GpuDeviceBackend.createTexture()                ← Dx12Device → Dx12Native.dx12CreateTexture()
  ├─ GpuDeviceBackend.createBuffer()                 ← Dx12Device → Dx12Native.dx12CreateBuffer()
  ├─ GpuDeviceBackend.createSampler()                ← Dx12Device → Dx12Native.dx12CreateSampler()
  ├─ GpuDeviceBackend.createSurface()                ← Dx12Device → Dx12Native.dx12CreateSurface()
  ├─ GpuDeviceBackend.createCommandEncoder()         ← Dx12Device → Dx12CommandEncoderBackend
  │   │
  │   └─ CommandEncoderBackend.beginRenderPass()     ← Dx12CommandEncoderBackend
  │       │
  │       └─ RenderPassBackend                       ← Dx12RenderPassBackend
  │           ├─ setPipeline()      → dx12SetPipeline()
  │           ├─ setVertexBuffer()  → dx12SetVertexBuffer()
  │           ├─ setIndexBuffer()   → dx12SetIndexBuffer()
  │           ├─ pushDescriptors()  → dx12PushDescriptors()
  │           ├─ drawIndexed()      → dx12DrawIndexed()
  │           └─ draw()             → dx12Draw()
  │
  └─ GpuSurfaceBackend                             ← Dx12GpuSurface
      ├─ configure()      → dx12ConfigureSurface()
      ├─ acquireNextTexture() → dx12AcquireSurface()
      ├─ blitFromTexture()  → dx12BlitSurface()
      └─ present()          → dx12PresentSurface()
```

### Shader Compilation Chain (P4)

```
Minecraft ShaderSource (assets/minecraft/shaders/core/*.glsl)
  │
  ▼
Dx12ShaderCompiler.createIntermediary()
  │  shaderc: GLSL → SPIR-V
  │  GlslPreprocessor: inject gl_VertexID/gl_InstanceID macros
  │
  ▼
Dx12IntermediaryShaderModule
  │  spvc reflection: extract UBO / Sampler / Output / Input bindings
  │  spvc rebind: rewrite SPIR-V binding decorations to 0..n-1
  │
  ▼
Dx12CompiledShader
  │  spvc HLSL backend: SPIR-V → HLSL SM5.1
  │
  ▼
Dx12Device.precompilePipeline()
  │  Dx12ShaderCompiler.compilePipeline()
  │  Pass packed descriptor buffer to native layer
  │
  ▼
dx12_mc.dll: D3DCompile → DXBC + Root Signature + PSO
  │
  ▼
Dx12CompiledRenderPipeline (handle ≠ 0 indicates success)
```

### Mixin Injection Point

The sole Mixin `PreferredGraphicsApiMixin` modifies the graphics API preference during Minecraft initialization:

```java
// PreferredGraphicsApiMixin.java
@Mixin(GdxApplicationParameters.class)
public abstract class PreferredGraphicsApiMixin {
    @Overwrite
    public String getPreferredGraphicsApi() {
        return "D3D12";  // Force use of D3D12 instead of OpenGL/Vulkan
    }
}
```

When Minecraft selects the backend, it prioritizes `D3D12`, which instantiates our `Dx12Backend`.

## Completed Features

| Module | Description |
|--------|-------------|
| **P0 Native Layer** | dx12_mc.dll: D3D12 device creation, texture/buffer/sampler/view resource management, command list, fence, swapchain |
| **P1 Device Self-Test** | Dx12Native.dx12CreateDevice() returns adapter name + feature level + self-test results |
| **P2 Resource Layer** | Dx12GpuTexture/Dx12GpuBuffer/Dx12GpuSampler/Dx12GpuTextureView — all create real D3D12 resources via JNI |
| **P3 Command Layer** | Dx12CommandEncoderBackend: submit/fence/copyBuffer/copyTexture/writeToTexture/clear/startEndRenderPass/timestamp |
| **P4 Pipeline Layer** | GLSL→SPIR-V→HLSL→DXBC compilation, Pipeline cache (IdentityHashMap), Shader source cache (HashMap) |
| **P5 Swap Chain** | Dx12GpuSurface: DXGI flip-model swapchain, supports IMMEDIATE/MERCHANTABILITY/RALAXED present modes |
| **P6 Draw Full Pipeline** | Dx12RenderPassBackend: setPipeline + pushDescriptors(UBO/SRV/TexelBuffer) + draw/drawIndexed/drawIndirect |
| **Shader Compilation Self-Test** | Embedded GLSL source for core/gui + core/position_tex_color, compilable during createDevice even before resource pack loads |
| **4-Round Self-Test** | Java resources (self-test) → Command layer → Pipeline → Surface, each round verified sequentially, failure terminates immediately |
| **D3D12 Resource Management** | AutoCloseable pattern, all D3D12 handles destroyed on close(), preventing resource leaks |
| **ModMenu Integration** | Dx12Config + Dx12SettingsScreen + ModMenuApi entrypoint |
| **AA Mode Persistence** | Properties format stored to `config/gl4dx12.properties`, 4 modes (None/FXAA/SMAA/TAA) |

## Key Design Principles

- **Mixin Only Modifies API Selection**: No rendering logic is overwritten; fully relies on Minecraft's official `RenderSystem` calling our backend
- **Mirrors Official Vulkan Backend**: Each Java class corresponds to the equivalent implementation of the official `com.mojang.blaze3d.vulkan.Vulkan*`
- **Safe Resource Release**: All resources are `AutoCloseable`; close() destroys all D3D12 handles to prevent resource leaks
- **Self-Test Driven Development**: 4 rounds of self-tests (resource/command/pipeline/surface) verified in `createDevice()`; failure terminates immediately
- **Lazy Shared Encoder**: `createCommandEncoder()` returns the same instance (mirroring official semantics), avoiding command loss from per-frame CommandContext creation
- **Shader Cache**: Pipeline cache (IdentityHashMap) + Shader source cache (HashMap), each shader compiled only once
- **DLL Version Isolation**: Re-extracted from JAR on every launch, ensuring DLL matches JAR version

## Debugging and Verification

### Key Log Output on Startup

The mod prints sequentially on load:

```
[dx12] Loading D3D12 mod...
[dx12] Preferred graphics API: D3D12
[dx12] dx12CreateDevice() result: <Adapter Name> (D3D_FEATURE_LEVEL <Level>); SELF-TEST OK (...)
[dx12] Creating GpuBackend: dx12.Dx12Backend
[dx12] Java resource self-test OK (texture/buffer/sampler/view via JNI)
[dx12] Command layer self-test OK (submit/fence/copy/readback via JNI)
[dx12] Pipeline self-test OK (GLSL->SPIR-V->HLSL->DXBC->PSO for core/gui + core/position_tex_color)
[dx12] Surface self-test OK (DXGI swapchain configure/acquire/blit/present via JNI)
[dx12] D3D12 backend initialized successfully.
[dx12] Device name: <Adapter Name>
```

### Behavior on Self-Test Failure

If any self-test round fails:
1. Close the created D3D12 device
2. Throw `BackendCreationException`
3. Minecraft automatically falls back to OpenGL rendering
4. Full error stack printed in logs

### 4-Round Self-Test Details

| Round | Test Content | Example Failure Cause |
|-------|-------------|----------------------|
| **1. Java Resources** | texture/buffer/sampler/view creation + map/unmap read-write | DLL load failure, D3D12 initialization failure |
| **2. Command Layer** | submit + fence wait + buffer copy readback + texture write/readback | Command list submission failure, copy data mismatch |
| **3. Pipeline** | core/gui + core/position_tex_color full-chain compilation (GLSL→SPIR-V→HLSL→DXBC→PSO) | shaderc/spvc/D3DCompile compilation failure |
| **4. Surface** | swapchain creation → configure → acquire → blit → submit → present | Invalid HWND, DXGI swapchain creation failure |

## Known Issues and Solutions

| Issue | Cause | Solution | Status |
|-------|-------|----------|--------|
| **GPU TDR timeout (~2s crash)** | GL + D3D12 coexisting in the same window causes WDDM driver-level conflict | **1 Mixin**: Set `D3D12` as preferred API, Minecraft no longer initializes GL backend | ✅ Fixed |
| **DLL version mismatch** | Old `dx12_mc.dll` inconsistent with new Java-layer JNI signatures | Re-extract from JAR to `{user.dir}/dx12mod/` on every launch | ✅ Fixed |
| **RootSignature not set (UMD AV)** | `setPipeline` only called `SetPipelineState`, missed `SetGraphicsRootSignature` | Added `SetGraphicsRootSignature(pipeline->rootSignature.Get())` | ✅ Fixed (cd1e029) |
| **Command list topology not set** | D3D12 initial topology=UNDEFINED, draw discarded by GPU | Added `IASetPrimitiveTopology(toPrimitiveTopology(topology))` to `setPipeline` | ✅ Fixed |
| **Vertex semantics hardcoded** | `InputElement.semanticName` hardcoded as `TEXCOORD`, doesn't match HLSL input | Extract SPVC semantic name from pipeline binding reflection | ✅ Fixed (88a9253) |
| **GUI renders pure red** | Vertex attributes don't match HLSL input semantics → vertex data discarded | Fixed semantic mapping in `dx12CreateGraphicsPipeline` (`POSITION→SV_Position`, etc.) | ✅ Fixed (cb653a7) |
| **HLSL static/const misidentified** | Parsing variable declarations treated `static`/`const` as type prefix | Refactored to scan by type keyword list; added `const` modifier detection | ✅ Fixed (86b5f7c/784d331) |
| **Descriptor heap exhaustion** | SRV/Sampler heap didn't release old handles → heap space exhausted | Release old handle after `createGraphicsPipeline` succeeds | ✅ Fixed (85ea7cf) |
| **Shared command encoder causing rendering anomalies** | New CommandContext per frame caused command loss | Lazy-loaded shared singleton encoder (mirroring official semantics) | ✅ Fixed |
| **GPU idle wait** | Consecutive submits caused excessive GPU idle time | Added `d3d12mc_gpu_idle_wait_ms` (default 2ms) | ✅ Fixed (85ea7cf) |

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Game | Minecraft | 26.2 |
| Loader | Fabric Loader | 0.19.3 |
| API | Fabric API | 0.156.0+26.2 |
| Mixin | SpongePowered Mixin | 0.8.7 (via Fabric 0.17.3) |
| Mod Browser | ModMenu | 20.0.1 |
| Language | Java | 25 |
| Native Layer | C++ D3D12 | dx12_mc.dll (precompiled) |
| Shader Compilation | shaderc (GLSL→SPIR-V) | LWJGL shaderc |
| Shader Reflection | spvc (SPIR-V→HLSL) | LWJGL spvc |
| Language | Rust | — (removed) |

## Roadmap

### Phases P0-P6: D3D12 Backend Core Layer ✅ All Completed

| Phase | Status | Description |
|-------|--------|-------------|
| **P0: Native Layer Foundation** | ✅ | dx12_mc.dll: D3D12 initialization + resource creation |
| **P1: Device Self-Test** | ✅ | Dx12Native.dx12CreateDevice() + resource self-test |
| **P2: Resource Layer** | ✅ | Dx12GpuTexture/Dx12GpuBuffer/Dx12GpuSampler/Dx12GpuTextureView |
| **P3: Command Encoding Layer** | ✅ | Dx12CommandEncoderBackend: submit/fence/copy/clear/timestamp |
| **P4: Pipeline Compilation Layer** | ✅ | shaderc SPIR-V → spvc reflection/rebind → HLSL → D3DCompile DXBC |
| **P5: Swap Chain Layer** | ✅ | Dx12GpuSurface: DXGI flip-model swapchain |
| **P6: Draw Full Pipeline** | ✅ | Dx12RenderPassBackend: setPipeline + pushDescriptors + draw |
| **Self-Test Passed** | ✅ | GUI + GUI_TEXTURED pipeline + surface blit + buffer copy + texture readback |

### 🔜 Future Optimizations

| Task | Priority | Description |
|------|----------|-------------|
| **Multi-frame parallel command queue** | P0 | Current shared singleton encoder + fence wait; upgrade to triple buffering |
| **Descriptor heap optimization** | P1 | Current per-frame push descriptors; switch to heap pooling (heap leak already fixed) |
| **TransientMemory block allocator** | P1 | Current per-frame committed buffer; switch to block allocator |
| **Full Shader Support** | P2 | Current self-test covers core/gui + core/position_tex_color; need to support all official shaders (terrain/entity/particle, etc.) |
| **P6 GUI rendering fix** | ✅ Completed | Fixed 12 root causes including RootSignature/Topology/vertex semantics/static/const HLSL issues |
| **Performance benchmarking** | P3 | Compare FPS, memory usage, GPU utilization across GL/Vulkan/D3D12 |

### 🎯 Final Goals

| Phase | Goal | Status |
|-------|------|--------|
| **Transition Plan** | Fully take over Minecraft rendering via GpuBackend interface (current phase) | ✅ Completed |
| **Performance Optimization** | Full shader support + descriptor optimization + multi-frame parallel submission | 🔜 In Progress |
| **Official Release** | Publish as a D3D12 backend mod for Minecraft 26.2+ through official channels | 🔜 Pending |

---

## Contributing

### Participation Methods

> Currently not accepting any contributions

### Currently Claimable Tasks

| Task | Priority | Description |
|------|----------|-------------|
| **Full Shader Support** | 🔴 P0 | Compile all Minecraft official shaders (terrain, entity, particle, etc.) |
| **Skybox Rendering** | 🟠 P1 | Simple shaders suffice |
| **Entity Rendering** | 🟠 P1 | Model loading + skeletal animation |
| **Particle System** | 🟡 P2 | Point sprites |

---

## License

MIT License
