

# DirectXMod (gl4dx12)

> **A native D3D12 rendering backend for Minecraft 26.2 Fabric mod.**
> By implementing Minecraft's official `GpuBackend` / `GpuDeviceBackend` interfaces, this mod replaces the OpenGL/Vulkan rendering path with a native C++ DLL (`dx12_mc.dll`), enabling Minecraft to render directly via D3D12 while preserving mod extension points (AA settings, ModMenu integration).

## Overview

This project uses **Mixin injection** to modify Minecraft's graphics API selection logic, switching the game to use the D3D12 backend for rendering. The Java layer provides rendering state synchronization, configuration management, and mod compatibility.

### Core Features

- **Mixin Injection**: 9 Mixins covering graphics API selection + initialization/rendering/resource loading/world loading full-chain diagnostics (see [Mixin Injection Points](#mixin-injection-points))
- **Official GpuBackend Interface**: Full implementation of `GpuBackend` / `GpuDeviceBackend` / `CommandEncoderBackend` / `RenderPassBackend` / `GpuSurfaceBackend` and other official interfaces
- **Zero Custom Render Loop**: Does not override `RenderSystem`; fully takes over Minecraft's official rendering pipeline
- **Shaderc + Spvc Compilation Chain**: GLSL → SPIR-V (shaderc) → HLSL SM5.1 (spvc) → DXBC (D3DCompile)
- **Resource Safety**: All D3D12 resources managed through Java wrapper classes (`Dx12Gpu*`), automatically released with Minecraft's lifecycle
- **Configuration UI**: `Fx12Config` persistent configuration, `Dx12SettingsScreen` settings UI, ModMenu integration
- **DLL Auto-loading**: Extracted from JAR to `{user.dir}/dx12mod/dx12_mc.dll` at runtime, with version isolation support
- **MC 26.2**: Supports Mojang official mappings (no Yarn dependency), fabric-api 0.156.0+26.2 / loader 0.19.3 / ModMenu 20.0.1

### Current Status: P0-P22 Complete, BUG-01 Semantic Name Fix, Descriptor Binding Fix, Black Screen Root Cause (level=null) Under Diagnosis (2026-08-26)

| Phase | Status | Description |
|-------|--------|-------------|
| **P0: Native Layer Foundation** | ✅ Complete | dx12_mc.dll: D3D12 initialization + resource creation (texture/buffer/sampler/view) |
| **P1: Device Self-Test** | ✅ Complete | Dx12Native.dx12CreateDevice() + resource self-test |
| **P2: Resource Layer** | ✅ Complete | Dx12GpuTexture / Dx12GpuBuffer / Dx12GpuSampler / Dx12GpuTextureView |
| **P3: Command Encoding Layer** | ✅ Complete | Dx12CommandEncoderBackend: submit/fence/copy/clear/timestamp |
| **P4: Pipeline Compilation Layer** | ✅ Complete | shaderc SPIR-V → spvc reflection/rebind → HLSL → D3DCompile DXBC |
| **P5: Swapchain Layer** | ✅ Complete | Dx12GpuSurface: DXGI flip-model swapchain (configure/acquire/blit/present) |
| **P6: Draw Full Chain** | ✅ Complete | Dx12RenderPassBackend: setPipeline + pushDescriptors + draw/drawIndexed |
| **P15: Log Level System** | ✅ Complete | GameRenderer debug instrumentation + tiered logging (dbgLog/dbgLogInfo/dbgLogDebug) |
| **P16: renderLevel Diagnostics** | ✅ Complete | Frame counter/advanceGameTime/pause/native submit+present logging |
| **P17: Render Target Tracking** | ✅ Complete | activeColorTargetsTouched + dbgReadbackSurfacePixels() 3×3 sampling |
| **P18: Surface Fence** | ✅ Complete | Per-backbuffer fence tracking, GPU occupancy check before acquireSurface |
| **P20: Descriptor Table Offset Fix** | ✅ Complete | pushDescriptors root descriptor table GPU address offset correction, preventing reading previous frame residuals |
| **P21: Depth Test Fix** | ✅ Complete | removeDepthClearAutoFix + reverse-Z comparison function + depth PSO dual-track creation |
| **P22: Descriptor Heap Expansion** | ✅ Complete | drawHeap expanded from x2 to x4 half-regions, supporting triple-frame parallel flight |
| **BUG-01: semanticNames Fix** | ✅ Complete | `semanticNames`补齐 based on `vertex.inputs().size()`, aligned with spvc baseline |
| **Self-Test Passed** | ✅ | GUI + GUI_TEXTURED pipeline compilation + surface blit + buffer copy + texture readback all passed |

## Project Structure

```
dx12-lib-template-26.1.2/
├── fabric/                          # Fabric mod (Java)
│   ├── src/main/java/com/dx12/
│   │   ├── Dx12Mod.java            # Mod entry point, sets graphics API preference + log self-test info
│   │   ├── ModMenuIntegration.java # ModMenuApi implementation, config UI integration
│   │   ├── config/
│   │   │   └── Dx12Config.java     # Persistent configuration (aa_mode, etc., Properties format)
│   │   ├── gui/
│   │   │   └── Dx12SettingsScreen.java # AA mode settings GUI (None/FXAA/SMAA/TAA)
│   │   ├── mixin/
│   │   │   ├── PreferredGraphicsApiMixin.java          # Force D3D12 as preferred graphics API
│   │   │   ├── GameRendererRenderDebugMixin.java       # P16: renderLevel diagnostics (frame/resourcesLoaded, etc.)
│   │   │   ├── BufferBuilderMixin.java                 # P17: Render target tracking instrumentation
│   │   │   ├── MinecraftRunDebugMixin.java             # P19: Minecraft.run() entry diagnostics
│   │   │   ├── MinecraftRunTickDebugMixin.java         # P19: runTick per-frame level/gameLoadFinished/pause
│   │   │   ├── MinecraftSetLevelDebugMixin.java        # P19: setLevel() call diagnostics
│   │   │   ├── MinecraftResourceLoadDebugMixin.java    # P19: onResourceLoadFinished/onGameLoadFinished
│   │   │   ├── MinecraftDoWorldLoadDebugMixin.java     # P0: doWorldLoad() entry diagnostics
│   │   │   └── ClientPacketListenerLoginDebugMixin.java  # P0: handleLogin() packet diagnostics
│   │   └── dx12/                    # D3D12 backend core implementation (mirrors official Vulkan backend)
│   │       ├── Dx12Native.java               # JNI bridge layer (60 native methods, 318 lines)
│   │       ├── Dx12Backend.java              # GpuBackend implementation: window/device creation + 4-round self-test (361 lines)
│   │       ├── Dx12Device.java               # GpuDeviceBackend implementation: resource creation + shader compilation cache (519 lines)
│   │       ├── Dx12ShaderCompiler.java       # GLSL→SPIR-V→HLSL compilation chain (shaderc+spvc, 246 lines)
│   │       ├── Dx12IntermediaryShaderModule.java  # SPIR-V reflection binding info (spvc semantic injection, 337 lines)
│   │       ├── Dx12CompiledShader.java       # Compilation output (HLSL source + binding list)
│   │       ├── Dx12CompiledRenderPipeline.java  # Compiled render pipeline
│   │       ├── Dx12BindGroupEntry.java       # Pipeline binding entry (UBO/SRV/TexelBuffer)
│   │       ├── Dx12GpuSurface.java           # DXGI swapchain (P5+P17, 144 lines)
│   │       ├── Dx12CommandEncoderBackend.java    # Command encoding layer (P3, 313 lines)
│   │       ├── Dx12RenderPassBackend.java        # Render pass layer (P6+P17, 432 lines)
│   │       ├── Dx12TransientMemory.java          # Transient memory management (per-frame buffer recycling, 238 lines)
│   │       ├── Dx12GpuTexture.java             # D3D12 texture resource wrapper (view reference counting, 68 lines)
│   │       ├── Dx12GpuTextureView.java         # D3D12 texture view (SRV, deferred destruction, 43 lines)
│   │       ├── Dx12GpuBuffer.java              # D3D12 buffer resource wrapper (61 lines)
│   │       ├── Dx12GpuSampler.java             # D3D12 sampler wrapper (86 lines)
│   │       └── Dx12GpuQueryPool.java           # D3D12 GPU timestamp query pool (72 lines)
│   │   └── d3d12/                      # Experimental pure Java D3D12 wrapper (not yet in production)
│   │       ├── Dx12Device.java             # Adapter enumeration + device factory
│   │       ├── Dx12DeviceContext.java      # Full context (device+queue+surface)
│   │       ├── Dx12AdapterInfo.java        # Adapter information
│   │       └── Dx12Exception.java          # Exception wrapper
│   ├── src/test/java/com/dx12/d3d12/
│   │   └── Dx12DeviceTest.java           # Unit tests (render loop verification)
│   ├── src/main/resources/
│   │   ├── fabric.mod.json           # Fabric mod description (client + modmenu entrypoints)
│   │   ├── gl4dx12.mixins.json       # Mixin configuration (9 mixins)
│   │   ├── dx12_mc.dll               # Native DLL (extracted from JAR at runtime to {user.dir})
│   │   └── assets/dx12mod/icon.png   # Mod icon (16x16)
│   ├── libs/
│   │   └── modmenu-20.0.1.jar        # ModMenu local dependency (MC 26.2)
│   ├── build.gradle                  # Gradle build config (loom 1.15.5)
│   └── gradle.properties             # Version parameters
├── native/                          # D3D12 native layer (C++17, MSVC + CMake)
│   ├── src/
│   │   ├── dx12_device.cpp           # D3D12 device/resources/commands/pipeline/Draw (3067 lines)
│   │   ├── dx12_device.h             # Public header (347 lines, defines DeviceContext/CommandContext, etc.)
│   │   ├── dx12_surface.cpp          # DXGI swapchain + blit + present + readback diagnostics (551 lines)
│   │   ├── jni_bridge.cpp            # JNI entry (112 lines)
│   │   ├── jni_bridge_p3.cpp         # P3 command layer native (293 lines)
│   │   ├── jni_bridge_p4.cpp         # P4 pipeline compilation native (168 lines)
│   │   ├── jni_bridge_p5.cpp         # P5 swapchain + readback native (376 lines)
│   │   └── jni_bridge_p6.cpp         # P6 draw native (156 lines)
│   ├── CMakeLists.txt                # CMake build config
│   └── build/bin/Release/dx12_mc.dll # Precompiled DLL (for development, JAR-packaged version built separately)
├── docs/
│   ├── official-262/                 # Minecraft 26.2 official source reference
│   ├── code-review-deep.md           # Deep code review report (BUG-01 ~ BUG-17)
│   └── steps.md                      # Detailed development steps document
├── debug.log                         # Runtime diagnostic logs
└── issues.md                         # Black screen issue review report (P0 BUG-00 ~ P3 BUG-17)
```

## Architecture Design

### Rendering Pipeline: Fully Taking Over Minecraft's Official Rendering Flow

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
  │  spvc rebind: rewrite SPIR-V binding decoration to 0..n-1
  │
  ▼
Dx12CompiledShader
  │  spvc HLSL backend: SPIR-V → HLSL SM5.1
  │
  ▼
Dx12Device.precompilePipeline()
  │  Dx12ShaderCompiler.compilePipeline()
  │  pass packed descriptor buffer to native layer
  │
  ▼
dx12_mc.dll: D3DCompile → DXBC + Root Signature + PSO
  │
  ▼
Dx12CompiledRenderPipeline (handle ≠ 0 indicates success)
```

### Mixin Injection Points

9 Mixins covering the full diagnostic chain from API selection to world loading:

```java
// PreferredGraphicsApiMixin.java — Force D3D12 as preferred
@Mixin(GdxApplicationParameters.class)
public abstract class PreferredGraphicsApiMixin {
    @Overwrite
    public String getPreferredGraphicsApi() {
        return "D3D12";
    }
}

// GameRendererRenderDebugMixin.java — P16: renderLevel diagnostics
//   inject: GameRenderer.render() HEAD → print frame/resourcesLoaded/advanceGameTime/levelNotNull

// BufferBuilderMixin.java — P17: Render target tracking
//   inject: BufferBuilder.begin() → record activeColorTargets

// MinecraftRunDebugMixin.java — P19: Minecraft.run() entry
//   inject: Minecraft.run() HEAD → confirm render loop started

// MinecraftRunTickDebugMixin.java — P19: Per-frame tick status
//   inject: Minecraft.runTick() HEAD → print tick/level/gameLoadFinished/pause

// MinecraftSetLevelDebugMixin.java — P19: World loading
//   inject: Minecraft.setLevel() HEAD → print if level is null (black screen root cause investigation)

// MinecraftResourceLoadDebugMixin.java — P19: Resource loading complete
//   inject: onResourceLoadFinished/onGameLoadFinished → confirm game loading flow

// MinecraftDoWorldLoadDebugMixin.java — P0: World loading entry
//   inject: Minecraft.doWorldLoad() HEAD → confirm world loading path entered (black screen root cause)

// ClientPacketListenerLoginDebugMixin.java — P0: Login packet received
//   inject: ClientPacketListener.handleLogin() HEAD → confirm server login packet arrived (black screen root cause)
```

When Minecraft selects the backend, it prioritizes `D3D12`, which then instantiates our `Dx12Backend`.

## Completed Features

| Module | Description |
|--------|-------------|
| **P0 Native Layer** | dx12_mc.dll: D3D12 device creation, texture/buffer/sampler/view resource management, command lists, fences, swapchains |
| **P1 Device Self-Test** | Dx12Native.dx12CreateDevice() returns adapter name + feature level + self-test result |
| **P2 Resource Layer** | Dx12GpuTexture/Dx12GpuBuffer/Dx12GpuSampler/Dx12GpuTextureView — all create real D3D12 resources via JNI |
| **P3 Command Layer** | Dx12CommandEncoderBackend: submit/fence/copyBuffer/copyTexture/writeToTexture/clear/startEndRenderPass/timestamp |
| **P4 Pipeline Layer** | GLSL→SPIR-V→HLSL→DXBC compilation, Pipeline cache (IdentityHashMap), Shader source cache (HashMap) |
| **P5 Swapchain** | Dx12GpuSurface: DXGI flip-model swapchain, supports IMMEDIATE/MAILBOX/RELAXED present modes |
| **P6 Draw Full Chain** | Dx12RenderPassBackend: setPipeline + pushDescriptors(UBO/SRV/TexelBuffer) + draw/drawIndexed/drawIndirect |
| **P15 Log Tiers** | dbgLog(ERROR/WARN)/dbgLogInfo(INFO)/dbgLogDebug(DEBUG) three-level output, DX12_LOG_VERBOSE=1 enables detailed logs |
| **P16 renderLevel Diagnostics** | Frame counter (every 30 frames) + advanceGameTime/pause/native submit+present logging |
| **P17 Render Target Tracking** | activeColorTargetsTouched vector + dbgReadbackSurfacePixels() 3×3 sampling diagnostic readback |
| **P18 Surface Fence** | Per-backbuffer fence tracking, GPU occupancy check before acquireSurface |
| **P20 Descriptor Offset Fix** | pushDescriptors root descriptor table GPU address offset correction, preventing reading previous frame residual descriptors causing black screen |
| **P21 Depth Test Fix** | Remove depthClearFlag=0 unconditional clear=1.0 fallback (pre-clear already done by MC); fix reverse-Z comparison function |
| **P22 Descriptor Heap Expansion** | drawHeap expanded from 2 half-regions to 4 half-regions, supporting triple-frame parallel flight (fenceValue%4 alternating write) |
| **BUG-01 semanticNames Fix** | `semanticNames`补齐 uses `vertex.inputs().size()` aligned with spvc remap baseline |
| **Shader Compilation Self-Test** | Embedded core/gui + core/position_tex_color GLSL sources, can compile even when resource pack not yet loaded during createDevice |
| **4-Round Self-Test** | Java resources(self-test)→command layer→pipeline→surface progressive verification, any failure immediately terminates and falls back to OpenGL |
| **D3D12 Resource Management** | AutoCloseable mode + TextureView reference counting + gPendingDeletes deferred destruction |
| **ModMenu Integration** | Dx12Config + Dx12SettingsScreen + ModMenuApi entrypoint |
| **AA Mode Persistence** | Properties format stored to `config/gl4dx12.properties`, 4 modes (None/FXAA/SMAA/TAA) |
| **Exit Watchdog** | Dx12Mod: Render thread disappears within 20s forces System.exit(1), preventing launcher hang |

## Key Design Principles

- **Mixin Only Modifies API Selection**: Does not override any rendering logic; fully relies on Minecraft's official `RenderSystem` to call our backend
- **Mirror Official Vulkan Backend**: Each Java class corresponds to an equivalent implementation of the official `com.mojang.blaze3d.vulkan.Vulkan*`
- **Safe Resource Release**: All `AutoCloseable`, close() destroys all D3D12 handles; TextureView reference counting + deferred destruction queue prevents use-after-free
- **Self-Test Driven Development**: 4-round self-test (resources/commands/pipeline/surface) in `createDevice()` progressive verification, failure immediately terminates
- **Lazy Shared Encoder**: `createCommandEncoder()` returns the same instance (mirrors official semantics), avoiding per-frame new CommandContext causing command loss
- **Shader Cache**: Pipeline cache (IdentityHashMap) + Shader source cache (HashMap), same shader only compiled once
- **DLL Version Isolation**: Re-extracted from JAR every launch, ensuring DLL matches JAR version
- **Triple-Frame Parallel Commands**: 3 allocator + value-2 completion wait; drawHeap x4 half-regions prevents triple-frame parallel conflicts
- **Diagnostic Switches**: `DX12_LOG_VERBOSE=1` enables detailed logs, `DX12_DIAG_GREEN=1` enables green shader diagnostics

## Debugging & Verification

### Key Startup Log Output

When the mod loads, it prints sequentially:

```
[dx12] Loading D3D12 mod...
[dx12] Preferred graphics API: D3D12
[dx12] dx12CreateDevice() result: <adapter name> (D3D_FEATURE_LEVEL <level>); SELF-TEST OK (...)
[dx12] Created GpuBackend: dx12.Dx12Backend
[dx12] Java resource self-test OK (texture/buffer/sampler/view via JNI)
[dx12] Command layer self-test OK (submit/fence/copy/readback via JNI)
[dx12] Pipeline self-test OK (GLSL->SPIR-V->HLSL->DXBC->PSO for core/gui + core/position_tex_color)
[dx12] Surface self-test OK (DXGI swapchain configure/acquire/blit/present via JNI)
[dx12] D3D12 backend initialized successfully.
[dx12] Device name: <adapter name>
[dx12] [P16] Frame #N submit (queueFence=X) / present idx=Y suboptimal=false
[dx12] [P17] activeColorTargetsTouched=[true] / dbgReadback center=[r,g,b,a]
[dx12-debug] Minecraft.setLevel() called: level=<non-null/NULL>   ← P19 diagnostics
[dx12-debug] runTick tick=<N> gameLoadFinished=<true/false> level=<non-null/NULL> pause=<true/false>  ← P19 diagnostics
```

### Self-Test Failure Behavior

Any self-test failure will:
1. Close the created D3D12 device
2. Throw `BackendCreationException`
3. Minecraft automatically falls back to OpenGL rendering
4. Print full error stack trace in logs

### Additional Diagnostic Logs

In addition to the above standard output, the following diagnostic methods are supported:
- **Tiered Logging**: `DX12_LOG_VERBOSE=1` enables detailed logs, simultaneously written to `%TEMP%\dx12-native.log`
- **3×3 Sampling Readback**: `dbgReadbackSurfacePixels()` returns center 3×3 pixel RGBA array for verifying backbuffer content
- **Frame Counter**: Prints submit/present status every 30 frames, convenient for judging if render loop is functioning normally
- **pushDescriptors Diagnostics**: First pushDescriptors per frame prints binding count and UBO/SRV pointers

### 4-Round Self-Test Details

| Round | Test Content | Example Failure Causes |
|-------|--------------|------------------------|
| **1. Java Resources** | texture/buffer/sampler/view creation + map/unmap read/write | DLL load failure, D3D12 initialization failure |
| **2. Command Layer** | submit + fence wait + buffer copy readback + texture write/readback | Command list submission failure, copy data mismatch |
| **3. Pipeline** | core/gui + core/position_tex_color full-chain compilation (GLSL→SPIR-V→HLSL→DXBC→PSO) | shaderc/spvc/D3DCompile compilation failure |
| **4. Surface** | swapchain creation → configure → acquire → blit → submit → present | Invalid HWND, DXGI swapchain creation failure |

## Known Issues

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| **`minecraft.level` always null** | 🔴 P0 | `level=null` causes `renderLevel()` never executes, terrain pipeline zero draw calls, black screen root cause to be confirmed (whether mixins interfere with world loading flow) | 🔍 Under investigation |
| **`beginRenderPass` activeColorTargets duplicate push_back** | 🟠 Medium | Both L1701 and L1767 push_back, causing endRenderPass transition to execute one extra barrier (idempotent, currently harmless) | 🔧 Pending fix |
| **`toPrimitiveTopology` case 4 (TRIANGLES) missing** | 🟡 Low | switch lacks case 4, falls through to default returning TRIANGLELIST (correct result), but insufficient defensively | 🔧 Pending fix |
| **CBV offset 256 alignment not verified** | 🟡 Low | `pushDescriptors` requires offset 256 alignment, but no assertion in native layer; if Java side passes unaligned value may cause shader to read wrong data | 🔧 Pending fix |
| **`createFence` uses global queue fence** | 🟠 Medium | In multi-encoder scenarios, fence may be completed early by other encoder's submit | 🔧 Pending fix |
| **Temporary encoder competes with global fence** | 🟠 Medium | Temporary submit in `createBuffer(data)` increments global `queueFenceValue`, may race with `StagedVertexBuffer` fence | 🔧 Pending fix |
| **transientMemory queuedFrames leak** | 🟡 Low | `transientMemory.close: queuedFrames=1` appears every frame, indicating 1 path ubo ring buffer not reclaimed | 🔧 Pending fix |
| **`d3d12` package is unused experimental code** | 🔵 Low | `com.dx12.d3d12.*` is JNA migration exploration半成品, still called via JNI, `close()` is no-op | ⚠️ Pending cleanup |
| **Excessive debug log residue** | 🔵 Low | `getStackTrace()`/high-frequency prints scattered in render path, affecting performance | ⚠️ Pending cleanup |
| **`ensureDevice` lacks idempotency protection** | 🟡 Low | Midway creation failure retry will leak all D3D12 resources from first creation | ⚠️ Known |
| **`dx12_mc_new.dll` residue** | 🔵 Low | Old renamed DLL still exists, needs cleanup | ⚠️ Pending cleanup |

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Game | Minecraft | 26.2 |
| Loader | Fabric Loader | 0.19.3 |
| API | Fabric API | 0.156.0+26.2 |
| Mixin | SpongePowered Mixin | 0.8.7 (via Fabric 0.17.3) |
| Mod Browser | ModMenu | 20.0.1 |
| Language | Java | 25 |
| Native Layer | C++ D3D12 (JNI) | dx12_mc.dll (precompiled) |
| Shader Compilation | shaderc (GLSL→SPIR-V) | LWJGL shaderc |
| Shader Reflection | spvc (SPIR-V→HLSL) | LWJGL spvc |
| Dependency | JNA | 5.17.0 (reserved, not yet in production) |

## Roadmap

### P0-P22: D3D12 Backend Core Layer ✅ All Complete

| Phase | Status | Description |
|-------|--------|-------------|
| **P0: Native Layer Foundation** | ✅ | dx12_mc.dll: D3D12 initialization + resource creation |
| **P1: Device Self-Test** | ✅ | Dx12Native.dx12CreateDevice() + resource self-test |
| **P2: Resource Layer** | ✅ | Dx12GpuTexture/Dx12GpuBuffer/Dx12GpuSampler/Dx12GpuTextureView |
| **P3: Command Encoding Layer** | ✅ | Dx12CommandEncoderBackend: submit/fence/copy/clear/timestamp |
| **P4: Pipeline Compilation Layer** | ✅ | shaderc SPIR-V → spvc reflection/rebind → HLSL → D3DCompile DXBC |
| **P5: Swapchain Layer** | ✅ | Dx12GpuSurface: DXGI flip-model swapchain |
| **P6: Draw Full Chain** | ✅ | Dx12RenderPassBackend: setPipeline + pushDescriptors + draw |
| **P15-P22: Diagnostic Enhancement** | ✅ | Log tiers/frame counter/render tracking/Surface fence/descriptor offset/depth test/heap expansion |
| **BUG-01: semanticNames** | ✅ |补齐 logic aligned with spvc baseline |
| **Self-Test Passed** | ✅ | GUI + GUI_TEXTURED pipeline + surface blit + buffer copy + texture readback |

### 🔜 Upcoming Optimizations

| Task | Priority | Description |
|------|----------|-------------|
| **Investigate level=null root cause** | 🔴 P0 | Confirm whether MinecraftSetLevelDebugMixin triggers; check if mixins interfere with world loading flow |
| **Full Shader Support** | 🔴 P0 | terrain/entity/particle full shader draw calls not verified (currently only GUI layer visible) |
| **BUG-01 duplicate push_back fix** | P2 | Remove duplicate activeColorTargets.push_back in beginRenderPass diagnostic loop |
| **BUG-02 case 4 completion** | P3 | Complete TRIANGLES case in toPrimitiveTopology |
| **BUG-06 CBV alignment verification** | P2 | Add offset%256 assertion in native layer |
| **Cleanup d3d12 experimental package** | P1 | Remove unused `com.dx12.d3d12` package |
| **Diagnostic log downgrade** | P1 | Change high-frequency `getStackTrace()`/readback to conditional logs (environment variable controlled) |
| **Performance Benchmarking** | P1 | Compare GL/Vulkan/D3D12 FPS, memory usage, GPU utilization |

### 🎯 Final Goals

| Phase | Goal | Status |
|-------|------|--------|
| **Transition Solution** | Fully take over Minecraft rendering via GpuBackend interface (current phase) | ✅ Complete |
| **Feature Complete** | terrain/entity/particle full shader rendering normal + level=null root cause located | 🔜 In progress |
| **Official Release** | Release as Minecraft 26.2+ D3D12 backend mod through official channels | 🔜 To be implemented |

---

## How to Build

### Before building, ensure you have MSVC compiler, CMake, and Gradle installed

First install CMake, then execute the following commands to build the project:

```bash
// Before this, delete the build directory under native to ensure the compiled DLL is the latest
cd native
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

The build artifact is located at:
```bash
\native\build\bin\Release\dx12_mc.dll
``` 
Copy it to \fabric\src\main\resources, overwriting if it already exists.

Install Gradle, then execute the following command to build:
```bash
cd fabric
gradlew clean build
```

Find your compiled mod file here:
```bash
\fabric\build\libs\gl4dx12-0.1.0.jar
```

## Contributing Guide

> Contributions are not currently accepted

## License

MIT License

---