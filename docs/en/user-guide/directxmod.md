# GL4DX12 — Minecraft wgpu/DX12 Rendering Mod

:::warning
**WARNING! Do not trust any unofficial port of DirectXmod. The author assumes no responsibility for any issues arising from unofficial ports and strongly advises against using them.**
:::

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Fabric](https://img.shields.io/badge/Mod%20Loader-Fabric-blueviolet)](https://fabricmc.net/)
[![Minecraft](https://img.shields.io/badge/Minecraft-26.1.2-green)](https://www.minecraft.net/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange)](https://www.rust-lang.org/)
[![wgpu](https://img.shields.io/badge/wgpu-23-blue)](https://wgpu.rs/)

> A DirectX 12 rendering backend for Minecraft Java Edition 26.1.2, bridged via Rust + wgpu + JNI to replace OpenGL rendering with D3D12/WebGPU, resolving TDR crashes and improving graphics performance.

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Project Status](#project-status)
- [Changelog](#changelog)
- [Tech Stack](#tech-stack)
- [Build and Run](#build-and-run)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Known Issues and Solutions](#known-issues-and-solutions)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**GL4DX12** is a Fabric mod that implements a DirectX 12 rendering backend via Rust + wgpu, leveraging JNI (Java Native Interface) to bridge Minecraft's Java layer with the native rendering engine.

### Core Design Principles

- **Mixin Smart Capture** — Surface + chunk ready → cancel GL world rendering; otherwise normal GL rendering and capture framebuffer
- **No extra windows created** (uses Minecraft's window HWND directly)
- **Version agnostic** (1.21.1 ~ 1.21.11 + 26.x, no Yarn mappings dependency)
- **Three-pass rendering (Surface mode)**: Pass 1 World render → Pass 2 Post-processing (FXAA/tonemapping/gamma) → Pass 3 HUD overlay
- **Two-pass Chunk rendering**: Opaque Pass (depth_write=true) + Transparent Pass (alpha blending) handling CUTOUT/TRANSLUCENT vegetation
- **ChunkVertex 40 bytes**: position + color + terrain UV + light UV, supporting dynamic lightmap
- **PBO async HUD readback**: 3×PBO triple-buffer + glFlush replacing glFinish, eliminating CPU-GPU sync blocking
- **Rust wgpu engine completely independent of Minecraft**, communicating via JNI, panics safely captured via catch_unwind

### Why Refactor to Rust + wgpu?

| Old Approach (C++/D3D12) | New Approach (Rust/wgpu) |
|--------------------------|--------------------------|
| Manual D3D12 resource management | wgpu automatic resource management |
| OpenGL + D3D12 shared HWND causing GPU device removal | GL frame capture + D3D12 swapchain presentation |
| Memory safety relies on developer | Rust compiler guarantees memory safety |
| Complex C++ build configuration | Cargo dependency management |
| Frequent TDR crashes | GLFW context separation + GL frame capture |

### Core Advantages

- **Memory safety**: Rust compiler eliminates common bugs like use-after-free and data races at compile time
- **Cross-platform**: wgpu abstraction layer supports DX12/Vulkan/Metal, write once, run on multiple platforms
- **High performance**: WebGPU standard drives modern GPU API, close to native C++ performance
- **Easy maintenance**: Cargo ecosystem + type system reduces long-term maintenance costs

### Dual-Mode Rendering Architecture

| Mode | Rendering Path | Use Case |
|------|----------------|----------|
| **Surface mode** (smart rendering) | Pass 1: chunks/entities/particles → post_texture + depth<br>Pass 2: FXAA/tonemapping/gamma → swapchain<br>Pass 3: HUD overlay (alpha blending) → swapchain | In-world, D3D12 renders MC scene directly (with chunks) or presents GL frame capture (without chunks) |
| **Offscreen mode** | Rust wgpu → staging buffer → byte[] → PBO → OpenGL fullscreen quad | Title screen / initialization phase |

### TDR Problem Resolution Principle

The core challenge of Surface mode: GL + D3D12 in the same window causes NVIDIA driver TDR timeout. The solution works through 5 Mixins collaborating:

1. **GameRendererMixin** — HEAD: Surface+chunks → cancel GL world render (keep HUD); TAIL: HUD capture via PBO async DMA; Surface+no chunks → FBO-aware GL frame capture; Offscreen → PBO upload
2. **MinecraftMixin** — `runTick` TAIL: `glfwMakeContextCurrent(0)` to separate GL context, call D3D12 Present() then restore
3. **GlDeviceMixin** — Cancel GL buffer swap in `GlDevice.presentFrame()`
4. **SectionCompilerMixin** — Intercept MC chunk mesh `compile()` RETURN, upload chunk mesh to D3D12
5. **TextureAtlasMixin** — Intercept MC terrain atlas pixels, upload to D3D12 + CPU mip chain

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Minecraft 26.1.2                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Fabric Loader 0.19.3                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Fabric API (ClientTickEvents)          │  │  │
│  │  │  Tick Callback → full-speed render → Rust renderFrame()   │  │  │
│  │  │  + Camera MVP matrix extraction → nativeUpdateCamera()      │  │  │
│  │  │  + Camera position passing → nativeUpdateCameraPos()        │  │  │
│  │  │  + Chunk mesh upload → nativeUploadChunkMesh()        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Mixin: GameRenderer.render() HEAD/TAIL   │  │  │
│  │  │  Surface+chunks: cancel GL render                    │  │  │
│  │  │  Surface+no chunks: GL render → capture framebuffer    │  │  │
│  │  │  Offscreen mode: PBO texture upload + fullscreen quad        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Mixin: Minecraft.runTick() HEAD          │  │  │
│  │  │  glfwMakeContextCurrent(0) → D3D12 Present()     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ JNI                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              wgpu_mc_jni.dll (Rust)                    │  │
│  │  nativeSetWindow(HWND) → initialize DX12 Surface/Swapchain │  │
│  │  nativeRenderFrame() → Surface mode present directly,        │  │
│  │                       Offscreen mode returns byte[]         │  │
│  │  nativeResize(width, height) → update window size            │  │
│  │  nativeUpdateCamera(float[16]) → sync camera MVP matrix     │  │
│  │  nativeSetFramePixels(byte[], w, h) → Surface mode receives │  │
│  │                       GL captured framebuffer pixels       │  │
│  │  nativeUploadChunkMesh(sectionXYZ, buffer, verts, stride) → upload MC chunk mesh │  │
│  │  nativeUploadTerrainAtlas(buffer, w, h) → upload terrain atlas + mip chain  │  │
│  │  nativeHasChunkGeometry() → returns whether chunk geometry is uploaded |  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              wgpu-mc (Rust)                            │  │
│  │  wgpu::Instance(DX12) → Adapter → Device + Queue       │  │
│  │  render_frame() → 3D scene rendering (ground + cubes + depth)  │  │
│  │  WGSL shader + camera_pos + shared IB + depth test        │  │
│  │  CHUNK_SHADER_SRC: chunk rendering + texture atlas UV       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ ✅ Surface mode: chunk→direct render / no-chunk→GL frame capture │  │  │
│  │  │ ✅ Offscreen mode: triple-buffer async readback        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
dx12-lib-template-26.1.2/
├── fabric/                          # Fabric mod (Java)
│   ├── src/main/java/com/dx12/
│   │   ├── Dx12Mod.java            # Mod entry, register event callbacks (tick: camera extraction, lightmap, fog, entities, particles)
│   │   ├── D3D12Bridge.java        # JNI bridge layer (16+ native method encapsulation)
│   │   ├── ModMenuIntegration.java # ModMenuApi implementation, config screen integration
│   │   ├── config/
│   │   │   └── Dx12Config.java     # Config persistence (aa_mode, etc.)
│   │   ├── gui/
│   │   │   └── Dx12SettingsScreen.java # AA mode settings GUI
│   │   └── mixin/
│   │       ├── MinecraftMixin.java      # runTick TAIL: GL detach → D3D12 Present
│   │       ├── GameRendererMixin.java   # HEAD pass through / TAIL HUD/FBO capture + PBO async readback
│   │       ├── GlDeviceMixin.java       # HEAD suppress GL swap
│   │       ├── SectionCompilerMixin.java# Intercept chunk mesh compile() → upload chunk mesh
│   │       └── TextureAtlasMixin.java   # Capture terrain atlas sprite pixels
│   ├── src/main/resources/
│   │   ├── fabric.mod.json         # Fabric mod descriptor (client + modmenu entrypoints)
│   │   └── gl4dx12.mixins.json     # Mixin configuration (5 mixins)
│   ├── libs/
│   │   └── modmenu-18.0.0.jar     # ModMenu local dependency (MC 26.1.2)
│   ├── build.gradle                # Gradle build config (loom 1.10.3)
│   └── gradle.properties           # Version parameters
├── rust/
│   ├── Cargo.toml                  # Workspace config
│   ├── wgpu-mc/                    # Core rendering library (~3400 lines)
│   │   ├── src/lib.rs              # WmRenderer + Surface/Offscreen dual-mode + chunk + HUD + FXAA
│   │   └── Cargo.toml              # wgpu 23, raw-window-handle, bytemuck, image
│   └── wgpu-mc-jni/                # JNI bridge layer (~657 lines)
│       ├── src/lib.rs              # 16+ native methods
│       └── Cargo.toml              # jni 0.21, log, env_logger
└── steps.md                        # Detailed development steps documentation
```

---

## Project Status

### Current Phase: Phases 1-11a Complete, Phases 11b-f In Progress

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1: JNI Communication Link** | ✅ Completed (2026-07-09) | 16 native methods, Java ↔ Rust bidirectional communication |
| **Phase 2: wgpu Rendering Engine Skeleton** | ✅ Completed (2026-07-09) | DX12 adapter + 3D geometry pipeline + Surface/Offscreen dual-mode |
| **Phase 3: Fabric Event System + Mixin Integration** | ✅ Completed (2026-07-10) | 3 Mixins + ClientTickEvents |
| **Phase 4: 3D Scene Rendering Basics** | ✅ Completed (2026-07-10) | WGSL shader + depth test + back-face culling |
| **Phase 5: Performance Optimization** | ✅ Completed (2026-07-10) | Triple-buffer, lazy resize, lock_or_poisoned, camera LERP |
| **Phase 6: D3D12 Surface Mode** | ✅ Completed (2026-07-11) | Native swapchain direct output to MC window HWND |
| **Phase 7: Chunk Geometry Rendering** | ✅ Completed (2026-07-11~16) | MC chunk mesh upload + Terrain atlas + two-pass vegetation rendering |
| **Phase 8: HUD/UI Overlay** | ✅ Completed (2026-07-22) | renderLevel HEAD cancel + GL readback → D3D12 alpha composite |
| **Phase 9: Lighting System** | ✅ Completed (2026-07-22) | Dynamic lightmap (lightmap) + day-night cycle |
| **Phase 10: Post-Processing Effects + Mod Settings** | ✅ Completed (2026-07-22) | FXAA + Reinhard tone mapping + Gamma + ModMenu integration |
| **Phase 11a: PBO Async HUD Readback** | ✅ Completed (2026-07-22) | Eliminate glFinish blocking, save ~2-5ms |
| **Phase 11b-f: More Performance Optimizations** | 🔜 In Progress | GL detach optimization, reflection caching, on-demand lightmap upload, chunk batching, frustum culling |

### Completed Features

| Module | Description |
|--------|-------------|
| **Rust Workspace** | `wgpu-mc` (rendering engine) + `wgpu-mc-jni` (JNI bridge) dual crate structure |
| **Mixin Framework** | 5 Mixins precisely control GL/D3D12 coexistence: GameRendererMixin, MinecraftMixin, GlDeviceMixin, SectionCompilerMixin, TextureAtlasMixin |
| **JNI Bridge Layer** | 16 native methods fully implemented (`nativeInit`, `nativeHello`, `nativeTestDeviceInfo`, `nativeSetWindow`, `nativeRenderFrame`, `nativeResize`, `nativeUpdateCamera`, `nativeUpdateCameraPos`, `nativeSetFramePixels`, `nativeUploadChunkMesh`, `nativeClearChunkSection`, `nativeUploadTerrainAtlas`, `nativeHasSurface`, `nativeHasChunkGeometry`, `nativeIsReady`, `nativeGetStatus`, `nativeSetHudPixels`, `nativeUploadLightmap`, `nativeSetAaMode`) |
| **Java Fabric Mod** | Based on Fabric Loom 1.10.3, MC 26.1.2, Fabric API 0.154.2 |
| **DLL Auto-loading** | Extracted from JAR to `{user.dir}/dx12mod/wgpu_mc_jni.dll`, supports version isolation |
| **GPU Adapter Detection** | Creates DX12 backend instance via wgpu and detects adapter availability |
| **Logging System** | Rust `env_logger` + Java SLF4J dual-end logging |
| **Surface Mode** | Smart rendering: chunk ready → D3D12 direct render MC scene / chunk not ready → GL frame capture → D3D12 texture present |
| **Offscreen Mode** | Triple-buffer async readback + PBO texture upload (title screen / initialization phase) |
| **Chunk Geometry Upload** | SectionCompilerMixin intercepts MC chunk mesh → JNI transfer → D3D12 TriangleList rendering |
| **Terrain Texture Atlas Upload** | TextureAtlasMixin captures sprite pixels → CPU mip chain → GPU sampling |
| **Chunk Two-Pass Rendering** | Opaque Pass (depth_write=true) + Transparent Pass (alpha blending) handling CUTOUT/TRANSLUCENT vegetation |
| **Lighting System** | Dynamic lightmap texture upload + WGSL fragment shader sampling + day-night cycle |
| **Exponential Fog** | WGSL fog uniform + `abs(clip_w)` distance calculation + weather-adaptive density |
| **Entity Rendering** | Reflection extract Entity Bounding Box + hash color + 36 vertices/entity Box Mesh |
| **Particle System** | PointList point sprites + WGSL soft circle discard + MC ParticleEngine reflection extraction |
| **HUD/UI Overlay** | renderLevel HEAD cancel + PBO async readback + D3D12 alpha blending compositing |
| **PBO Async HUD Readback** | 3×PBO triple-buffer + glFlush replacing glFinish, eliminating CPU-GPU sync blocking |
| **Camera MVP Passing** | Java extracts MC camera view → `nativeUpdateCamera(float[])` → Rust LERP smoothing |
| **Camera Position Passing** | Java extracts MC player world coordinates → `nativeUpdateCameraPos()` → Rust offset geometry |
| **3D Geometry Pipeline** | WGSL shaders + camera_pos + depth testing + back-face culling |
| **Ground Plane Mesh** | 200x200 green plane (y=0) |
| **Colored Cube Mesh** | 5 cubes, each with independent VB (pre-baked offsets), sharing IB |
| **Depth Buffer** | `Depth32Float` format, supporting correct occlusion relationships |
| **FXAA Anti-Aliasing** | 4-sample edge detection + Reinhard tone mapping + Gamma correction |
| **Three-Pass Rendering Architecture** | Pass 1 World → Pass 2 Post-process (FXAA/tonemapping/gamma) → Pass 3 HUD overlay |
| **Mod Settings Interface** | Dx12Config (Properties persistence) + Dx12SettingsScreen (MC GUI) + ModMenu integration |
| **AaMode Enum** | None=0 / FXAA=1 / SMAA=2 (placeholder) / TAA=3 (placeholder) |
| **ChunkVertex Format** | 40 bytes (position xyz + color rgba + UV xy + light_uv xy) |
| **AA Mode Switching** | Java → JNI → Rust marks pipeline invalid → rebuild on next render |
| **Resource Reload Detection** | Automatically detects MC resource reload and delays rendering |
| **Standalone Test Program** | `examples/simple.rs` — winit + wgpu popup window rendering colored triangles |

### Acceptance Results

- Mod loads successfully, no crash
- **Surface Mode (Smart Rendering)**: When chunks are ready, D3D12 directly renders complete MC scene (including terrain atlas, entities, particles, fog, lightmap); when chunks are not ready → GL frame capture → D3D12 textured quad
- **Offscreen Mode**: PBO texture upload + OpenGL fullscreen quad overlay (title screen phase)
- **Enhanced GL Frame Capture**: FBO-aware, reads from MC actual draw FBO instead of GL_BACK
- **HUD/UI Overlay**: renderLevel HEAD cancels GL world render → HUD/GUI retained → PBO async DMA → D3D12 alpha blending composition
- **Chunk Geometry Rendering**: Two-pass (Opaque Pass depth_write + Transparent Pass alpha blending), supports CUTOUT/TRANSLUCENT vegetation
- **Dynamic Lighting**: lightmap texture updated every frame → WGSL fragment shader sampling → day-night cycle/torch lighting
- **Exponential Fog**: Weather-adaptive density, `abs(clip_w)` correct distance calculation
- **Entity Rendering**: Reflection extract Entity Bounding Box → hash color → 36 vertices/entity box mesh
- **Particle System**: MC ParticleEngine reflection extraction → PointList point sprites + WGSL soft circle discard
- **FXAA Anti-Aliasing**: 4-sample edge detection + Reinhard tone mapping + Gamma correction
- **Three-Pass Rendering**: World → Post-process → HUD overlay
- **Camera View** updates in real-time as MC moves (MVP matrix + LERP smoothing)
- **Camera World Coordinates** passed, geometry follows player position
- Entering game, pressing Esc, adjusting settings — no JVM crashes
- TDR issue resolved: GL context separation + Mixin cancels GL swap

---

## Changelog

### [1.5.0] - 2026-07-08

> **Note: This version is a development preview and has not generated a `.jar` release file yet.** Manual Fabric mod build (`gradlew build`) is required to run.

#### Added
- **Chunk geometry upload**: `nativeUploadChunkMesh()` — Java → Rust chunk mesh data (vertex + index), D3D12 direct MC scene rendering
- **Smart Surface rendering**: `render_surface()` three modes — chunk geometry → D3D12 direct render / GL frame capture → textured quad / fallback to 3D test scene
- **FBO-aware frame capture**: GameRendererMixin reads from MC actual draw FBO instead of GL_BACK
- **Shader camera_pos**: Vertex shader `world_pos = pos + camera.camera_pos`, geometry follows player position
- **`nativeHasChunkGeometry()`** — Java-side detection of whether chunk geometry has been uploaded
- **Texture format reverted to `Rgba8UnormSrgb`** (pipeline fragment target format)
- **Chunk mesh upload**: MC GL_QUADS → D3D12 TriangleList conversion, world coordinate offset

#### Changed
- **Surface mode upgraded to smart rendering**: No longer always GL frame capture, chooses rendering path based on chunk geometry availability
- **GameRendererMixin smart judgment**: Surface + chunk ready → cancel GL render, otherwise normal GL render + capture
- **MinecraftMixin remains `runTick` TAIL** (not render HEAD)
- **Shader adds `camera_pos: vec3<f32>`** uniform, geometry offset follows player
- **`captureFramebufferForD3D12()` FBO-aware**: Reads from MC draw FBO, not fixed GL_BACK
- **Texture format changed from `Bgra8UnormSrgb` back to `Rgba8UnormSrgb`**

#### Fixed
- Visual anomalies caused by D3D12 texture format mismatch in Surface mode
- Black screen caused by GL frame capture reading from MC custom FBO (instead of GL_BACK)

---

### [2.0.0] - 2026-07-22 (Phases 6-10)

> **Major Update: Surface Mode Full Features Complete** — Chunk geometry rendering, HUD/UI overlay, lighting system, post-processing effects + FXAA, mod settings interface, PBO async HUD readback

#### Added
- **Phase 6: D3D12 Surface Mode Complete Version**
  - `init_surface(hwnd)` creates DXGI swapchain on MC window
  - Three rendering paths auto-switch: chunk geometry / GL frame capture / test scene
  - Surface resize protection: Auto reconfigure on Lost/Outdated (don't call configure in resize())
  - Depth buffer: Reuse surface_depth texture every frame
  - **Vegetation two-pass rendering fix**: Opaque Pass (depth_write=true, no blending) + Transparent Pass (depth_write=false, ALPHA_BLENDING), solves tree top-down penetration bottom bug
  - **Entity Box rendering**: Reflection extract Entity Bounding Box + hash color + 36 vertices/entity independent VB
  - **Particle point sprite system**: PointList topology + WGSL soft circle discard + MC ParticleEngine reflection extraction
  - **Exponential fog**: WGSL fog uniform + `abs(clip_w)` distance calculation + weather-adaptive density (normal/raining/thundering)
  - **`lock_or_poisoned()`**: Mutex poison safe recovery, prevents panic cascade JVM crash
  - **`catch_unwind`**: Panic protection for all native calls
  - Diagnostic logs: chunk vertex dump, atlas pixel saved as PNG, surface format matching

- **Phase 7: Actual Minecraft Scene Rendering**
  - **SectionCompilerMixin**: Intercepts `compile()` RETURN, iterates `results.renderedLayers`, uploads chunk mesh
  - **TextureAtlasMixin**: Captures sprite pixels → composes complete atlas → CPU mip chain → GPU sampling
  - **ChunkVertex 40 bytes**: New `light_uv: [f32; 2]` field, supports lightmap UV
  - Supports u16/u32 indices (`index_is_u32` field)
  - Chunk render panic protection: `catch_unwind` ensures frame always present

- **Phase 8: HUD/UI Overlay (Scheme C)**
  - **renderLevel HEAD cancel**: Surface+chunks → cancel GL world render, keep framebuffer content → HUD/GUI overlay on top
  - **`setHudPixels()` + HUD pipeline**: Alpha blending fullscreen quad composites HUD above world canvas
  - **glFinish ensures flush**: MC 26.1.2 rendering graph system (SubmitNodes) batch commands, flush before glReadPixels
  - HUD texture shares bind group layout with frame_texture (texture2D + sampler)

- **Phase 9: Lighting System (Dynamic Lightmap)**
  - **Java-side reflection extract**: `LightmapTextureManager.textureId` → `glGetTexImage()` → RGBA8 lightmap
  - **`nativeUploadLightmap()`**: Updated every 10 ticks (day-night cycle needs)
  - **WGSL lightmap sampling**: `@group(0) @binding(3) var lightmap: texture_2d<f32>`
  - Fragment shader: `light_color = textureSample(lightmap, ..., in.light_uv)` → `tex_color * tint * light_color`
  - **Chunk vertex UV2 parsing**: Offset 24 → normalized to [0, 1]

- **Phase 10: Post-Processing Effects + Mod Settings Interface**
  - **Three-pass rendering architecture**: Pass 1 World (chunks → post_texture) → Pass 2 Post-process (FXAA → swapchain) → Pass 3 HUD overlay
  - **FXAA anti-aliasing**: 4-sample edge detection + Reinhard tone mapping + gamma correction (1/2.2)
  - **AaMode enum**: None=0 / FXAA=1 / SMAA=2 / TAA=3 (SMAA/TAA placeholder)
  - **`set_aa_mode(int)` JNI**: Marks pipeline invalid → rebuild on next render
  - **Dx12Config**: Java Properties persistence to `config/gl4dx12.properties`
  - **Dx12SettingsScreen**: MC native GUI Screen, Button loop switches AA mode
  - **ModMenu integration**: `ModMenuApi.getModConfigScreenFactory()` → Dx12SettingsScreen
  - fabric.mod.json adds `"modmenu"` entrypoint

- **Phase 11a: PBO Async HUD Readback**
  - **3×PBO ring buffer**: writeIdx writes → readIdx maps (skip 2 frames), prevents DMA conflicts
  - **`glFlush()` replacing `glFinish()`**: Doesn't wait for GPU completion, eliminates ~2-5ms CPU blocking
  - **`glMapBuffer(GL_READ_ONLY)`**: Blocks until DMA completes (~0ms), copy → unmap
  - **Sync fallback path**: Falls back to original `glFinish()` + `glReadPixels()` path if PBO init fails

- **ModMenu Local Dependency**
  - `modImplementation` → `implementation` (Loom 1.15.5 + Gradle 9.x incompatibility)
  - ModMenu 14.0.2 → 18.0.0 (MC 26.1.2 corresponding version)
  - Added Modrinth Maven + Terraformers Maven + libs/modmenu-18.0.0.jar

#### Changed
- **Surface mode fully implemented**: After 3 rounds of iteration (suppress GL swap → sub-window → GL context detach) final scheme
- **Chunk mesh parse format update**: MC BLOCK format 36 bytes → ChunkVertex 40 bytes (new light_uv)
- **Two-pass chunk rendering**: opaque (36 verts) + transparent (36 verts) = 72 vertices per chunk layer
- **Three-pass surface rendering**: world (post_texture) → post-process (swapchain) → HUD overlay
- **Lightmap upload throttling**: Upload every 10 frames (day-night cycle changes slowly)
- **`getSkyColor` reflection cached**: Cache flag after first failure, avoids log spam

#### Fixed
- **Title screen freeze (9s+)**: `inWorld` guard, only create surface in-world
- **C++ EXCEPTION_UNCAUGHT**: Lazy resize, don't call surface.configure() in resize()
- **White screen (sub-window scheme)**: Fallback GL context detach scheme
- **Stuck loading world (15s)**: setWindow moved to MinecraftMixin GL detach region
- **glfwGetCurrentContext()=0**: Capture HWND before detaching GL
- **Bgra8 != Rgba8 format panic**: Prefer matching Rgba8UnormSrgb
- **Surface image already acquired chain panic**: Automatically resolved after format fix
- **Test geometry invisible**: Use fullscreen triangle / always visible after chunks render
- **Tree top-down penetration bottom**: Two-pass rendering fix (Opaque Pass depth_write + Transparent Pass alpha blending)
- **Fog远处蒙黑**: `-clip_w` → `abs(clip_w)` ensures distance is positive
- **getSkyColor reflection failure**: Cache `fogReflectionWorks` flag, fallback to hardcoded values on first failure
- **Texture flicker**: Window resize tracks texWidth/texHeight + auto rebuild
- **NVIDIA DMA page boundary crash**: PBO + 4KB padding

---

### [1.4.0] - 2026-07-08

#### Added
- **Mixin Framework (3 Mixins)**: Precisely controls GL/D3D12 coexistence, resolves TDR issue
  - `GameRendererMixin` — HEAD cancels MC OpenGL render (TAIL uploads PBO in offscreen mode)
  - `MinecraftMixin` — TAIL injects to separate GL context (`glfwMakeContextCurrent(0)`), calls D3D12 Present() then restores
  - `GlDeviceMixin` — Cancels GL buffer swap in `GlDevice.presentFrame()`
- **Surface mode restored**: DX12 swapchain directly presents in-world, zero readback, zero PBO
- **Full-speed rendering**: Removed 50ms throttle, `render_frame()` called every tick
- **`create_cube_mesh_at()`** — Supports cube generation at specified position and color
- **`create_plane_mesh()`** — Ground plane mesh generation (200x200 green)
- Texture format changed from `Rgba8UnormSrgb` to `Bgra8UnormSrgb`

#### Changed
- Rendering architecture upgraded from "Offscreen primary" to "Surface mode priority"
- `render_frame()` returns different results based on Surface mode (Surface mode direct present, Offscreen mode returns byte[])
- `onInitializeClient()` camera extraction changed to in-world detection (`mc.player != null && mc.level != null`)
- `renderFrame()` moved from Tick Callback to `MinecraftMixin.runTick TAIL` call

#### Fixed
- GPU driver TDR timeout (~2 seconds before GPU device removal) — via Mixin cancel GL render + GLFW context separation
- Double buffer swap causing GPU race — GlDeviceMixin cancels GL swap

---

### [1.3.0] - 2026-07-08

#### Added
- 10 JNI native methods fully implemented (new `nativeIsReady`, `nativeGetStatus`)
- Rust Mutex poison handling: `lock_or_poisoned()` prevents panic cascade crash
- Shared index buffer: All cubes share one IB, reducing GPU memory
- Vertex pre-baked offsets: `create_cube_mesh_at()` each cube independent VB, removed push constants

#### Changed
- **Surface mode paused**: GPU driver TDR issue (GL/D3D12 same window coexistence), needs Mixin cancel GL render before re-enabling
- Removed push constants: `required_features: Features::empty()` compatible with all GPUs
- Geometry changed from "5 independent VB + 6 face dual-color" to "shared IB + independent VB per cube"
- Architecture regressed from dual-mode rendering to Offscreen mode primary

#### Fixed
- Panic in `render_frame()` no longer causes subsequent JNI calls cascade crash
- Push constants incompatible with some GPUs

---

### [1.2.0] - 2026-07-08

#### Added
- **Surface mode (DX12 direct presentation)**: Create swapchain after `nativeSetWindow`, `render_frame()` directly presents to window, zero readback
- **Offscreen mode (Triple-buffer async readback)**: Three-slot ring buffer + async map_async + Poll polling
- **`nativeHasSurface()`**: Java-side detection of current Surface mode
- **Camera matrix LERP smoothing**: `mat4_lerp(camera_prev, camera_target, 0.3)` avoids jitter
- **Surface adaptive resize**: Auto reconfigure swapchain in Surface mode
- **Surface error recovery**: Auto reconfigure on `SurfaceError::Outdated/Lost`
- **Offscreen mode fallback**: Auto use triple-buffer readback when Surface mode fails
- 8 JNI native methods fully implemented

#### Changed
- `render_frame()` returns different results based on Surface mode (Surface mode returns empty Vec)
- Throttle strategy maintains 50ms (~20fps), no performance bottleneck in Surface mode
- Architecture upgraded from single readback path to dual-mode rendering

#### Fixed
- No longer need PBO texture upload in Surface mode, eliminated all DMA-related crashes on NVIDIA drivers
- Camera matrix jitter (LERP smoothing replaces abrupt changes)

---

### [1.1.0] - 2026-07-08

#### Added
- 3D geometry pipeline: WGSL shaders + push constants (model matrix) + depth testing + back-face culling
- Ground plane mesh: 200x200 green ground (y=0)
- 5 colored cubes: Placed at different positions, each face has light/dark distinction
- Camera MVP matrix passing: Java extracts MC camera view → `nativeUpdateCamera(float[16])` → Rust real-time sync
- Depth buffer: `Depth32Float` format, supporting correct occlusion
- PBO (Pixel Buffer Object) texture upload: Bypasses NVIDIA driver DMA page boundary crash
- Resource reload detection: Automatically detects MC resource reload and resets rendering state
- VAO/Shader auto-rebuild: Auto-rebuilds when GL resources become invalid, no need to restart game

#### Changed
- `render_frame()` upgraded from solid color background to complete 3D scene rendering
- JNI bridge expanded from 6 methods to 7 methods (new `nativeUpdateCamera`)
- Throttle strategy adjusted to 50ms (~20fps)

#### Fixed
- Crash caused by GL resource destruction when Minecraft menu opens
- Rendering conflicts during resource reload
- Rendering anomalies caused by repeated texture name usage

---

### [1.0.0] - 2026-07-08

> **Note: This version is a development preview and has not generated a `.jar` release file yet.** Manual Fabric mod build (`gradlew build`) is required to run.

#### Added
- Complete GL state management mechanism: save/restore Minecraft VAO, Texture, Program, Blend, Depth states
- Resource reload detection: Determines MC resource reload via tick time interval, automatically resets rendering state
- VAO/Shader auto-rebuild: Auto-rebuilds when GL resources become invalid, no need to restart game
- PBO (Pixel Buffer Object) texture upload: Bypasses NVIDIA driver DMA page boundary crash
- Throttle strategy: Calls Rust render every 50ms (~20fps)
- Standalone test program `examples/simple.rs`: winit + wgpu popup window rendering colored triangles
- GitHub Actions CI workflow (`.github/workflows/build.yml`)

#### Changed
- Rendering flow upgraded from simple贴图 to complete GL state isolation solution
- `Dx12Mod.java` adopts try-finally structure to ensure GL state is always restored
- JNI bridge expanded from 3 methods to 6 methods
- Architecture documentation updated with actual method names and flow

#### Fixed
- Crash caused by GL resource destruction when Minecraft menu opens
- Rendering conflicts during resource reload
- Rendering anomalies caused by repeated texture name usage
- OpenGL + D3D12 shared HWND causing GPU device removal crash
- Gradle wrapper SSL certificate issue
- JNI library loading path issue

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Game | Minecraft | 26.1.2 |
| Loader | Fabric Loader | 0.19.3 |
| API | Fabric API | 0.154.2+26.1.2 |
| Mixin | SpongePowered Mixin | 0.8.7 (via Fabric 0.17.3) |
| Mod Browser | ModMenu | 18.0.0 |
| Language | Java | 25 |
| Graphics | wgpu (WebGPU) → DX12 | 23 |
| Language | Rust | 2021 edition |
| JNI | jni crate | 0.21 |
| Window Handle | raw-window-handle | 0.6 |
| Image Processing | image crate | 0.25 (PNG diagnostic) |
| Test GPU | NVIDIA GeForce RTX 4070 / 3080 | Driver 576.x |

---

## Build and Run

### System Requirements

- **Windows 10/11** (x64)
- **JDK 25** (BellSoft Liberica JDK or Adoptium recommended)
- **Rust 1.75+** (stable)
- **Gradle 8.13** (or via wrapper)

### Environment Setup

#### 1. Install Rust

```powershell
# Download from https://rustup.rs/, or:
rustup default stable
rustup component add rust-analyzer rust-src
```

#### 2. Install JDK 25

```powershell
# Verify Java version
java -version
# Should output Java 25.x.x

# If not installed, BellSoft Liberica JDK is recommended:
# https://bell-sw.com/pages/downloads/?version=java-25&os=Windows+amd64
```

#### 3. Configure Environment Variables (optional)

```powershell
# Set JAVA_HOME (if not already set)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.x"
```

### Build Steps

#### Option A: Separate Builds (recommended for debugging)

```powershell
# 1. Build Rust DLL
cd rust
cargo build --release
# Output: target/release/wgpu_mc_jni.dll

# 2. Build Fabric mod
cd fabric
gradlew build
# Output: build/libs/gl4dx12-*.jar
```

#### Option B: One-Click Build

```powershell
cd fabric
gradlew clean build --no-daemon
```

### Deploy to Minecraft

```powershell
# 1. Copy JAR to mods directory
copy fabric\build\libs\gl4dx12-*.jar ^
     "$env:APPDATA\.minecraft\versions\26.1.2-Fabric_0.19.3\mods\"

# 2. Copy DLL to dx12mod directory
copy rust\target\release\wgpu_mc_jni.dll ^
     "$env:APPDATA\.minecraft\versions\26.1.2-Fabric_0.19.3\dx12mod\"

# 3. Launch Minecraft 26.1.2-Fabric_0.19.3
```

> **Note**: When packaging the mod, the DLL is embedded in the JAR and will be automatically extracted to `{user.dir}/dx12mod/wgpu_mc_jni.dll` at runtime.

### Verify Installation

After launching the game, check the log for:

```
[INFO] GL4DX12 Mod initializing...
[D3D12Bridge] Native library loaded from: ...\dx12mod\wgpu_mc_jni.dll
[D3D12Bridge] Rust JNI library initialized.
[INFO] Rust responded: Hello from Rust wgpu! You said: Hello from Minecraft!
[INFO] Device info: wgpu-mc-jni loaded. DX12: READY
[dx12-wm] Creating WmRenderer 800x600 (triple-buffer + surface support)
[dx12-wm] Adapter: NVIDIA GeForce RTX 3080
[dx12-wm] Device created OK
[dx12-wm] Offscreen slots created (800x600)
[INFO] GL4DX12 Mod initialized!
```

Once in-game when HWND is available, you'll see:

```
[dx12-wm] Surface OK! HWND=0x123456 fmt=Rgba8UnormSrgb 1920x1080
```

At this point the rendering mode automatically switches to **Surface mode** (in-world). After chunk geometry + terrain atlas + lightmap upload, D3D12 directly renders the complete MC scene (including vegetation/entities/particles/fog/HUD), with FXAA anti-aliasing enabled.

---

## Configuration

### Minecraft Version Configuration

Edit `fabric/gradle.properties`:

```properties
minecraft_version=26.1.2
yarn_mappings=26.1.2+build.1
loader_version=0.19.3
fabric_version=0.154.2+26.1.2
```

### Rust Build Configuration

Edit `rust/wgpu-mc-jni/Cargo.toml` to adjust dependencies:

```toml
[dependencies]
jni = "0.21"
log = "0.4"
env_logger = "0.10"
wgpu-mc = { path = "../wgpu-mc" }
```

### DLL Loading Path

The mod automatically extracts the DLL at runtime to:

```
{user.dir}/dx12mod/wgpu_mc_jni.dll
```

For example, in a version-isolated directory:
```
D:\.minecraft\versions\26.1.2-Fabric_0.19.3\dx12mod\wgpu_mc_jni.dll
```

### Log Level Control

```powershell
# Rust-side logging (via environment variable)
$env:RUST_LOG = "debug"  # or info, warn, error
java -jar minecraft.jar
```

---

## Usage Guide

### Quick Start

1. Complete the build following the [Build and Run](#build-and-run) section
2. Deploy JAR and DLL to the Minecraft directory
3. Launch Minecraft 26.1.2-Fabric_0.19.3
4. Observe console logs to confirm mod loading success
5. Enter the game to verify — in Surface mode, MC normal GL rendering, D3D12 swapchain presents

### Debugging Tips

#### Check if Rust DLL is Loaded

```powershell
# Confirm DLL file exists
dir "$env:APPDATA\.minecraft\versions\26.1.2-Fabric_0.19.3\dx12mod\wgpu_mc_jni.dll"

# Check DLL dependencies (requires Dependency Walker or dumpbin)
dumpbin /dependents rust\target\release\wgpu_mc_jni.dll
```

#### View Rust Logs

```powershell
# Set log level
$env:RUST_LOG = "debug"

# Run Minecraft (logs output to latest.log)
```

#### Verify JNI Communication

On mod startup, the following tests are automatically executed:
- `nativeInit()` — Initialize Rust environment, create WmRenderer
- `nativeHello("Hello from Minecraft!")` — Bidirectional string passing
- `nativeTestDeviceInfo()` — GPU adapter detection
- `nativeSetWindow(hwnd)` — Pass MC window handle, create DX12 swapchain
- `nativeRenderFrame()` — Per-frame render (Surface mode direct present, Offscreen mode returns byte[])
- `nativeUpdateCamera(float[])` — Pass MC camera MVP matrix
- `nativeUpdateCameraPos(x, y, z)` — Pass MC camera world coordinates
- `nativeSetFramePixels(byte[], w, h)` — Surface mode receives GL captured pixels
- `nativeUploadChunkMesh(sectionXYZ, buffer, verts, stride)` — Upload MC chunk mesh
- `nativeClearChunkSection(sectionXYZ)` — Clear old chunk mesh
- `nativeUploadTerrainAtlas(buffer, w, h)` — Upload terrain atlas + CPU mip chain
- `nativeHasSurface()` — Detect if current is Surface mode
- `nativeHasChunkGeometry()` — Detect if chunk geometry has been uploaded
- `nativeIsReady()` — Returns status code 1/0/-1
- `nativeGetStatus()` — Returns human-readable status string
- `nativeSetHudPixels(byte[], w, h)` — HUD overlay pixel upload
- `nativeUploadLightmap(buffer, w, h)` — Dynamic lightmap upload
- `nativeSetAaMode(int)` — AA mode switch (None/FXAA/SMAA/TAA)

#### Run Standalone Test Program

```powershell
# Run in rust/wgpu-mc directory
cd rust\wgpu-mc
cargo run --example simple
# Pops up a 1280×720 window, renders red, green, and blue triangles
```

### Frequently Asked Questions

| Issue | Cause | Solution |
|-------|-------|----------|
| `NoClassDefFoundError: net/minecraft/client/Minecraft` | JAR version too old | Recompile and copy the latest JAR |
| `UnsatisfiedLinkError: wgpu_mc_jni.dll` | DLL path incorrect | Confirm DLL is in `dx12mod/` directory |
| `Unsupported class file major version 69` | JDK version mismatch | Use JDK 25 for compilation (not JDK 21) |
| `Incompatible mods found!` | fabric.mod.json version declaration error | Confirm `"minecraft": "~26.1.2"` |

---

## Known Issues and Solutions

| Issue | Cause | Solution | Status |
|-------|-------|----------|--------|
| `glTexImage2D(pixels)` one-step crash | NVIDIA driver bug | Use two-step: `glTexImage2D(null)` + `glTexSubImage2D(pixels)` | ✅ Fixed |
| `glTexSubImage2D` ACCESS_VIOLATION at page boundary | NVIDIA driver unstable DMA reads client memory at page granularity | **PBO solution**: `glMapBuffer` + CPU memcpy + `glTexSubImage2D(offset=0)` upload from GPU memory | ✅ Fixed |
| `MemoryUtil.memAlloc` crash | LWJGL allocator page alignment incompatible with nvoglv64 | Use `BufferUtils.createByteBuffer` | ✅ Fixed |
| Esc/settings menu crash | HUD callback conflicts with Screen render GL state | Skip GL drawing when `currentScreen != null` | ✅ Fixed |
| Texture flicker incomplete | Texture size mismatch after window resize | Track `texWidth`/`texHeight` + auto rebuild | ✅ Fixed |
| Rendering crash after resource reload | GL state not cleaned up | Reset `vaoId`/`shaderValid`/`texAllocated`/`pendingPixels` on reload detection | ✅ Fixed |
| Lag from debug logging | Writing to disk every tick | Removed all `C:\tmp\` file logs | ✅ Fixed |
| Duplicate `setWindow` calls | JNI overhead | `lastSetHwnd` cache | ✅ Fixed |
| **GPU TDR timeout (~2s crash)** | GL + D3D12 same window coexistence causes WDDM driver-level conflict | **5 Mixins**: GL context separation + Mixin cancel GL swap | ✅ Fixed |
| Title screen freeze (9s+) | Surface creation driver race | `inWorld` guard: only create surface in-world | ✅ Fixed |
| C++ EXCEPTION_UNCAUGHT | `resize()` calling `surface.configure()` triggers DXGI ResizeBuffers exception | Lazy resize: don't configure surface in resize(), handle on Lost/Outdated | ✅ Fixed |
| White screen (sub-window scheme) | STATIC class window covers MC window | Fallback GL context detach scheme | ✅ Fixed |
| Stuck loading world (15s no response) | setWindow calls surface.configure() while GL bound | Move to MinecraftMixin GL detach region | ✅ Fixed |
| `glfwGetCurrentContext()=0` log spam | Detach GL first then get HWND, depends on glfwGetCurrentContext() | Capture HWND before detaching GL: `GLFWNativeWin32.glfwGetWin32Window(glfwWindow)` | ✅ Fixed |
| Bgra8 != Rgba8 format panic | Pipeline format Rgba8 doesn't match Surface format Bgra8 | Prefer matching `Rgba8UnormSrgb` surface format | ✅ Fixed |
| Surface image already acquired chain panic | Format panic → present() not executed → texture permanently locked | Automatically resolved after format fix | ✅ Fixed |
| Test geometry invisible (light blue fullscreen) | Geometry at world origin, player spawns ~100 units away | Use fullscreen triangle (NDC space), always visible | ✅ Fixed |
| **Tree top-down penetration bottom** | Alpha Blending + depth_write conflict, transparent pixels incorrectly occlude behind | Two-pass rendering (Opaque Pass depth_write=true + Transparent Pass alpha blending) | ✅ Fixed |
| **Fog远处蒙黑** | `-clip_w` causes negative distance → fog_factor > 1 | Use `abs(clip_w)` to ensure distance is positive | ✅ Fixed |
| **getSkyColor reflection failure** | `Level.getSkyColor(Vec3, float)` doesn't exist in MC 26.1.2 | Cache `fogReflectionWorks` flag, fallback to hardcoded values on first failure | ✅ Fixed |
| **Internal HUD cleared by renderLevel** | TAIL glClearColor(0,0,0,0) clears rendered HUD | Change to HEAD cancel to prevent GL world render | ✅ Fixed |

---

## Roadmap

### Phase 1: JNI Communication Link ✅ Completed (2026-07-09)

| Task | Status | Description |
|------|--------|-------------|
| Rust Workspace setup | ✅ | `wgpu-mc` + `wgpu-mc-jni` dual crate |
| JNI bridge layer implementation | ✅ | 16+ native methods, `lock_or_poisoned()` safe recovery |
| Java Fabric mod entry | ✅ | `ClientModInitializer` + tick callback |
| DLL auto-loading | ✅ | JAR extract to `{user.dir}/dx12mod/` |
| GPU adapter detection | ✅ | wgpu DX12 adapter availability check |
| catch_unwind panic protection | ✅ | Both `nativeInit` + `render_frame` catch panics |

### Phase 2: wgpu Rendering Engine Skeleton ✅ Completed (2026-07-09)

| Task | Status | Description |
|------|--------|-------------|
| WmRenderer creation | ✅ | wgpu DX12 Instance → Adapter → Device + Queue |
| 3D geometry pipeline | ✅ | WGSL shader + camera_pos + depth test + back-face culling |
| Ground mesh | ✅ | 200x200 green plane |
| Cube mesh | ✅ | 5 independent VB + shared IB |
| Depth buffer | ✅ | `Depth32Float` format |
| Pixel Buffer Object (PBO) | ✅ | Bypasses NVIDIA DMA page boundary crash |
| Triple-buffer readback | ✅ | Offscreen mode three-slot ring buffer + async map_async |
| Window size sync | ✅ | `nativeResize()` lazy resize |
| Camera MVP sync | ✅ | Java → Rust LERP smoothing |
| Camera position sync | ✅ | World coordinate offset geometry |
| Standalone test program | ✅ | `examples/simple.rs` runs independently rendering triangles |
| Push constants baked | ✅ | Model transform pre-baked into vertex buffer, compatible with all GPUs |

### Phase 3: Fabric Event System + Mixin Integration ✅ Completed (2026-07-10)

| Task | Status | Description |
|------|--------|-------------|
| GameRendererMixin HEAD/TAIL | ✅ | Pass through GL / FBO-aware frame capture |
| MinecraftMixin runTick TAIL | ✅ | GLFW context separation → D3D12 Present |
| GlDeviceMixin HEAD | ✅ | Suppress GL swap (avoid DXGI ↔ WGL race) |
| GL state management | ✅ | Complete save/restore mechanism |
| VAO/Shader persistence | ✅ | Created once, auto-rebuilt on loss |

### Phase 4: Surface Mode (Native Swapchain) ✅ Completed (2026-07-11)

| Task | Status | Description |
|------|--------|-------------|
| Surface creation | ✅ | `create_surface_from_hwnd()` based on raw-window-handle |
| HWND shared conflict resolution | ✅ | GL context temporary detach + rebind scheme (Round 3 iteration success) |
| Swapchain configuration | ✅ | Match Rgba8UnormSrgb format + depth texture |
| Surface rendering path | ✅ | Chunk geometry / GL frame capture / test scene three-way smart switch |
| Surface adaptive resize | ✅ | Auto reconfigure on Lost/Outdated |
| Surface error recovery | ✅ | `catch_unwind` ensures frame always present |
| Dual-mode switch | ✅ | Auto switch to Surface mode after `nativeSetWindow` |
| inWorld guard | ✅ | Don't create surface on title screen |

### Phase 5: Performance Optimization ✅ Completed (2026-07-10)

| Task | Status | Description |
|------|--------|-------------|
| Triple-buffer async rendering | ✅ | Ring(3) rotation + map_async + mpsc |
| Camera smooth interpolation | ✅ | `mat4_lerp(prev, target, 0.3)` |
| Resize smooth transition | ✅ | Lazy resize + skip size mismatch |
| Poison mutex recovery | ✅ | `lock_or_poisoned()` |
| Surface resize protection | ✅ | Don't reconfigure in resize() |
| Chunk pipeline dynamic format | ✅ | `ensure_chunk_pipeline()` uses surface_format |
| Chunk render panic protection | ✅ | catch_unwind ensures frame always present |
| Chunk mesh u32 indices | ✅ | Large data chunks support u32 |

### Phase 6: Actual Minecraft Scene Rendering (VulkanMod-level Full Takeover) ✅ Completed (2026-07-11~16)

| Task | Priority | Status | Description |
|------|----------|--------|-------------|
| Chunk rendering | 🔴 P0 | ✅ | SectionCompilerMixin intercepts compile() RETURN, uploads chunk mesh, two-pass rendering |
| Terrain atlas | 🔴 P0 | ✅ | TextureAtlasMixin captures sprite pixels, CPU mip chain, GPU sampling |
| Vegetation rendering fix | 🟠 P1 | ✅ | Two Pipeline (Opaque + Transparent) solves CUTOUT + TRANSLUCENT same mesh rendering conflict |
| Fog | 🟠 P1 | ✅ | Exponential fog WGSL shader + MC sky color extraction + weather-adaptive density |
| Entity rendering | 🟡 P2 | ✅ | Reflection Entity Getter → Bounding Box + hash color + 36 vertices/entity Box |
| Particle system | 🟡 P2 | ✅ | PointList point sprites + WGSL soft circle discard + MC ParticleEngine reflection extraction |

### Phase 7: HUD/UI Overlay (Scheme C) ✅ Completed (2026-07-22)

| Task | Status | Description |
|------|--------|-------------|
| renderLevel HEAD cancel | ✅ | Prevents GL world render, keeps framebuffer, HUD/GUI overlays on top |
| HUD pipeline | ✅ | Alpha blending fullscreen quad composition, no depth write |
| glFinish ensures flush | ✅ | MC 26.1.2 SubmitNodes batch processing, full submission before glReadPixels |
| HUD texture shared layout | ✅ | Shares texture2D + sampler bind group with frame_texture |

### Phase 8: Lighting System (Dynamic Lightmap) ✅ Completed (2026-07-22)

| Task | Status | Description |
|------|--------|-------------|
| Lightmap texture extraction | ✅ | Java reflection `GameRenderer.lightmapTextureManager.textureId` → glGetTexImage |
| Lightmap upload throttling | ✅ | Updated every 10 frames (day-night cycle changes slowly) |
| ChunkVertex lighting UV | ✅ | New `light_uv: [f32; 2]`, offset 24 normalized to [0,1] |
| WGSL lightmap sampling | ✅ | `@group(0) @binding(3) var lightmap: texture_2d<f32>` |
| Fragment lighting | ✅ | `tex_color * tint * light_color` three-color multiplication |
| Two-pass pipeline update | ✅ | Both Opaque + Transparent pipelines include lightmap binding |

### Phase 9: Post-Processing Effects + Mod Settings Interface ✅ Completed (2026-07-22)

| Task | Status | Description |
|------|--------|-------------|
| Three-pass rendering architecture | ✅ | World → Post-process → HUD overlay |
| FXAA anti-aliasing | ✅ | 4-sample edge detection + Reinhard tonemapping + gamma (1/2.2) |
| AaMode enum switching | ✅ | None/FXAA/SMAA placeholder/TAA placeholder, pipeline invalid rebuild |
| Dx12Config persistence | ✅ | Java Properties → `config/gl4dx12.properties` |
| Dx12SettingsScreen GUI | ✅ | MC Screen subclass + Button loop switch |
| ModMenu integration | ✅ | `ModMenuApi.getModConfigScreenFactory()` → Dx12SettingsScreen |
| Build fixes | ✅ | modImplementation→implementation, ModMenu 14→18, Modrinth Maven |

### Phase 10: PBO Async HUD Readback ✅ Completed (2026-07-22)

| Task | Status | Description |
|------|--------|-------------|
| 3×PBO ring buffer | ✅ | Rotate write/read indices every frame, prevent DMA conflicts |
| glFlush replacing glFinish | ✅ | Flush command buffer without waiting (~0ms vs several ms) |
| glMapBuffer async readback | ✅ | Read 2-frame-old DMA result (~0ms) |
| Sync fallback path | ✅ | Falls back to original glFinish + glReadPixels if PBO init fails |
| **Expected improvement** | — | Eliminates ~2-5ms CPU-GPU sync blocking (~10-25% HUD readback performance gain) |

### 🔜 Future Optimizations (Phases 11b-f In Progress)

| Task | Priority | Description | Status |
|------|----------|-------------|--------|
| GL detach/reattach optimization | P0 | Reduce WDDM driver overhead | 🔜 |
| Reflection data extraction caching | P0 | MethodHandle lookup caching (entities/particles/lightmap/fog) | 🔜 |
| Lightmap incremental update | P1 | Don't upload to GPU if no changes | 🔜 |
| Chunk render batching | P1 | Merge same-screen chunks draw calls | 🔜 |
| Frustum culling | P1 | Don't render chunks far from camera | 🔜 |

### 🎯 Final Goals

| Phase | Goal | Status |
|-------|------|--------|
| Transition Plan | Surface mode: MC normal GL render → GameRendererMixin TAIL captures framebuffer → D3D12 texture → swapchain present | ✅ Completed |
| VulkanMod-level | Rust/DX12 directly renders MC chunk geometry, eliminates GL frame capture intermediate layer, zero readback, zero texture upload | ❌ Pending |

---

## Contributing

### Participation Methods

##### Currently not accepting any contributions

### Currently Claimable Tasks

| Task | Priority | Description |
|------|----------|-------------|
| Chunk rendering | 🔴 P0 | Precompute Chunk Mesh, direct DX12 rendering |
| Skybox rendering | 🟠 P1 | Simple shaders suffice |
| Entity rendering | 🟠 P1 | Model loading + skeletal animation |

---

## License

MIT License
