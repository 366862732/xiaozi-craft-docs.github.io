# DirectXMod — Minecraft wgpu/DX12 Rendering Mod

> **WARNING! Do not trust any unofficial port of DirectXmod. The author assumes no responsibility for any issues arising from unofficial ports and strongly advises against using them.**
>
> **WARNING! Do not trust any unofficial port of DirectXmod. The author assumes no responsibility for any issues arising from unofficial ports and strongly advises against using them.**
>
> **WARNING! Do not trust any unofficial port of DirectXmod. The author assumes no responsibility for any issues arising from unofficial ports and strongly advises against using them.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Fabric](https://img.shields.io/badge/Mod%20Loader-Fabric-blueviolet)](https://fabricmc.net/)
[![Minecraft](https://img.shields.io/badge/Minecraft-1.21.1-green)](https://www.minecraft.net/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange)](https://www.rust-lang.org/)
[![wgpu](https://img.shields.io/badge/wgpu-23-blue)](https://wgpu.rs/)

> A DirectX 12 rendering backend for Minecraft Java Edition 1.21.1, bridged via Rust + wgpu + JNI to replace OpenGL rendering with D3D12/WebGPU, resolving TDR crashes and improving graphics performance.

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

**DirectXmod** is a Fabric mod that implements a DirectX 12 rendering backend via Rust + wgpu, leveraging JNI (Java Native Interface) to bridge Minecraft's Java layer with the native rendering engine.

### Core Design Principles

- **No Mixins used** (avoids conflicts with Fabric renderer)
- **No extra windows created** (uses Minecraft's window HWND directly)
- **Version agnostic** (1.21.1 ~ 1.21.11 + 26.x, no Yarn mappings dependency)
- **Background rendering**: Rust wgpu renders on a background thread → reads back pixels → Java uploads via OpenGL texture → draws fullscreen quad

### Why Refactor to Rust + wgpu?

| Old Approach (C++/D3D12) | New Approach (Rust/wgpu) |
|--------------------------|--------------------------|
| Manual D3D12 resource management | wgpu automatic resource management |
| OpenGL + D3D12 shared HWND causing GPU device removal | Independent surface architecture |
| Memory safety relies on developer | Rust compiler guarantees memory safety |
| Complex C++ build configuration | Cargo dependency management |
| Frequent TDR crashes | TDR avoided at architecture level |

### Core Advantages

- **Memory safety**: Rust compiler eliminates common bugs like use-after-free and data races at compile time
- **Cross-platform**: wgpu abstraction layer supports DX12/Vulkan/Metal, write once, run on multiple platforms
- **High performance**: WebGPU-standard modern GPU API, close to native C++ performance
- **Easy maintenance**: Cargo ecosystem + type system reduces long-term maintenance costs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Minecraft 1.21.1                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Fabric Loader 0.19.3                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Fabric API (ClientTickEvents)          │  │  │
│  │  │  Tick Callback → throttle 100ms → Rust renderFrame() │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Fabric API (HudRenderCallback)           │  │  │
│  │  │  GL draw → glTexSubImage2D + VAO + Shader → fullscreen quad │ │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ JNI                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              wgpu_mc_jni.dll (Rust)                    │  │
│  │  nativeSetWindow(HWND) → initialize DX12 Adapter       │  │
│  │  nativeRenderFrame() → return byte[] (RGBA pixel data) │  │
│  │  nativeResize(width, height) → update window size      │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              wgpu-mc (Rust)                            │  │
│  │  wgpu::Instance(DX12) → Adapter → Device + Queue       │  │
│  │  render_frame() → generate solid color/triangle pixels │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
dx12-lib-template-26.1.2/
├── fabric/                          # Fabric mod (Java)
│   ├── src/main/java/com/dx12/
│   │   ├── Dx12Mod.java            # Mod entry, register event callbacks
│   │   └── D3D12Bridge.java        # JNI bridge layer
│   ├── src/main/resources/
│   │   └── fabric.mod.json         # Fabric mod descriptor
│   ├── build.gradle                # Gradle build config
│   └── gradle.properties           # Version parameters
├── rust/
│   ├── Cargo.toml                  # Workspace config
│   ├── wgpu-mc/                    # Core rendering library
│   │   ├── src/lib.rs              # WmRenderer struct
│   │   └── Cargo.toml              # wgpu 23, futures, raw-window-handle
│   └── wgpu-mc-jni/                # JNI bridge layer
│       ├── src/lib.rs              # nativeSetWindow/renderFrame/resize
│       └── Cargo.toml              # jni 0.21, log, env_logger
```

---

## Project Status

### Current Phase: Phases 1-3 Completed, Phase 4 Not Started

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1: JNI Communication Link** | ✅ Completed | Java ↔ Rust bidirectional communication working |
| **Phase 2: wgpu Rendering Engine Skeleton** | ✅ Completed | DX12 adapter init + offscreen rendering + pixel feedback |
| **Phase 3: Fabric Event System Integration** | ✅ Completed | ClientTickEvents + HudRenderCallback, OpenGL fullscreen quad drawing working |
| **Phase 4: Actual Minecraft Scene Rendering** | ❌ Not Started | Currently solid color overlay (blue), awaiting real game scene integration |

### Completed Features

| Module | Description |
|--------|-------------|
| **Rust Workspace** | `wgpu-mc` (rendering engine) + `wgpu-mc-jni` (JNI bridge) dual crate structure |
| **JNI Bridge Layer** | 6 native methods: `nativeInit`, `nativeHello`, `nativeTestDeviceInfo`, `nativeRenderFrame`, `nativeSetWindow`, `nativeResize` |
| **Java Fabric Mod** | Based on Fabric Loom 1.10.3, MC 1.21.1, Fabric API 0.116.13 |
| **DLL Auto-loading** | Extracted from JAR to `{user.dir}/dx12mod/wgpu_mc_jni.dll`, supports version isolation |
| **GPU Adapter Detection** | Creates DX12 backend instance via wgpu and detects adapter availability |
| **Logging System** | Rust `env_logger` + Java SLF4J dual-end logging |
| **Offscreen Rendering** | `WmRenderer::render_frame()` outputs RGBA pixel buffer |
| **HWND Passing** | Java → Rust window handle passing, supports `nativeSetWindow` / `nativeResize` |
| **Pixel Feedback** | Rust → Java `byte[]` pixel data transfer + OpenGL texture upload + fullscreen quad drawing |
| **Standalone Test Program** | `examples/simple.rs` — winit + wgpu popup window rendering colored triangles |
| **GL State Management** | Complete Minecraft GL state save/restore mechanism to avoid conflicts with MC rendering |
| **Resource Reload Detection** | Automatically detects MC resource reload and delays rendering to avoid GL resource invalidation |
| **VAO Rebuild Mechanism** | Automatically rebuilds VAO/Shader when GL resource loss is detected |

### Acceptance Results

- Mod loads successfully, no crash
- Blue overlay displays correctly (1920x1080 @ RGBA)
- Log output: `Rendering frame: 1639680 bytes (frame=1/61/121...)`
- Pressing Esc does not crash
- Entering game, pressing Esc, adjusting settings — no JVM crashes

---

## Changelog

### [1.0.0] - 2026-07-08

> **Note: This version is a development preview and has not generated a `.jar` release file yet.** Manual Fabric mod build (`gradlew build`) is required to run.

#### Added
- Complete GL state management mechanism: save/restore Minecraft VAO, Texture, Program, Blend, Depth states
- Resource reload detection: determines MC resource reload via tick time interval, automatically resets rendering state
- Automatic VAO/Shader rebuild: automatically rebuilds when GL resources become invalid, no need to restart the game
- New Texture created per frame: avoids texture name conflicts with MC's shader loading
- Delayed rendering on startup: 10-second delay ensures rendering only activates after MC resources are fully loaded

#### Changed
- Rendering flow upgraded from simple texture mapping to complete GL state isolation solution
- `Dx12Mod.java` adopts try-finally structure to ensure GL state is always restored

#### Fixed
- Crash caused by GL resource destruction when Minecraft menu opens
- Rendering conflicts during resource reload
- Rendering anomalies caused by repeated texture name usage

---

### [0.2.0] - 2026-07-07

#### Added
- Complete implementation of 6 JNI native methods (`nativeRenderFrame`, `nativeSetWindow`, `nativeResize`)
- Per-frame rendering loop: Rust offscreen rendering → byte[] pixel feedback → OpenGL texture upload → fullscreen Quad drawing
- Window handle (HWND) passing mechanism: Java reflection gets GLFW window → `nativeSetWindow`
- Window size sync: `syncWindowSize()` deduplication + `nativeResize()` update
- Standalone test program `examples/simple.rs`: winit + wgpu popup window rendering colored triangles
- WGSL shaders: `triangle.wgsl` (2D) + `simple.wgsl` (3D)
- Dependencies: `winit = "0.30"` + `raw-window-handle = "0.6"` + `windows-sys = "0.59"`
- Precompiled DLL packaged into `fabric/src/main/resources/`
- GitHub Actions CI workflow (`.github/workflows/build.yml`)

#### Changed
- Rendering flow upgraded from pure initialization to per-frame rendering loop
- JNI bridge expanded from 3 methods to 6 methods
- Architecture documentation updated with actual method names and flow

#### Fixed
- Architecture diagram `check_gpu_availability()` → corrected to `WmRenderer::create()`
- DLL loading path description matches actual code (JAR sibling directory prioritized)

---

### [0.1.0] - 2026-07-04

#### Added
- Rust + wgpu project structure (workspace + wgpu-mc + wgpu-mc-jni)
- Fabric mod project (MC 1.21.1 + Fabric Loom 1.10.3)
- JNI bridge layer initial 3 native methods: `nativeInit`, `nativeHello`, `nativeTestDeviceInfo`
- Java-side `D3D12Bridge` class: DLL auto-loading + path search
- GPU adapter detection functionality
- WGSL basic shader templates

#### Changed
- Refactored from C++/D3D12 approach to Rust/wgpu approach
- MC version downgraded from 26.1.2 to 1.21.1 (obtaining full Fabric API support)
- Gradle config: uses JDK 21 for compilation (resolves JDK 25 compatibility issues)

#### Fixed
- OpenGL + D3D12 shared HWND causing GPU device removal crash
- Gradle wrapper SSL certificate issue
- JNI library loading path issue

#### Removed
- Deprecated C++ build configuration (archived)

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Game | Minecraft | 1.21.1 |
| Loader | Fabric Loader | 0.19.3 |
| API | Fabric API | 0.116.13+1.21.1 |
| Language | Java | 21 |
| Graphics | wgpu (WebGPU) → DX12 | 23 |
| Language | Rust | 2021 edition |
| JNI | jni crate | 0.21 |
| Rendering | OpenGL (Java side) | Core Profile 330 |

---

## Build and Run

### System Requirements

- **Windows 10/11** (x64)
- **JDK 21** (BellSoft Liberica JDK or Adoptium recommended)
- **Rust 1.75+** (stable)
- **Gradle 8.13** (or via wrapper)

### Environment Setup

#### 1. Install Rust

```powershell
# Download from https://rustup.rs/, or:
rustup default stable
rustup component add rust-analyzer rust-src
```

#### 2. Install JDK 21

```powershell
# Verify Java version
java -version
# Should output Java 21.x.x

# If not installed, BellSoft Liberica JDK is recommended:
# https://bell-sw.com/pages/downloads/?version=java-21&os=Windows+amd64
```

#### 3. Configure Environment Variables (optional)

```powershell
# Set JAVA_HOME (if not already set)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.x"
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
# Output: build/libs/DirectXmod-0.1.0.jar
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
     "$env:APPDATA\.minecraft\versions\1.21.1-Fabric_0.19.3\mods\"

# 2. Copy DLL to dx12mod directory
copy rust\target\release\wgpu_mc_jni.dll ^
     "$env:APPDATA\.minecraft\versions\1.21.1-Fabric_0.19.3\dx12mod\"

# 3. Launch Minecraft 1.21.1-Fabric_0.19.3
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
[INFO] GL4DX12 Mod initialized!
```

---

## Configuration

### Minecraft Version Configuration

Edit `fabric/gradle.properties`:

```properties
minecraft_version=1.21.1
yarn_mappings=1.21.1+build.3
loader_version=0.19.3
fabric_version=0.116.13+1.21.1
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
D:\.minecraft\versions\1.21.1-Fabric_0.19.3\dx12mod\wgpu_mc_jni.dll
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
3. Launch Minecraft 1.21.1-Fabric_0.19.3
4. Observe console logs to confirm mod loading success
5. Enter the game to verify — currently displays a blue rendering overlay (offscreen rendering output)

### Debugging Tips

#### Check if Rust DLL is Loaded

```powershell
# Confirm DLL file exists
dir "$env:APPDATA\.minecraft\versions\1.21.1-Fabric_0.19.3\dx12mod\wgpu_mc_jni.dll"

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
- `nativeInit()` — Initialize Rust environment
- `nativeHello("Hello from Minecraft!")` — Bidirectional string passing
- `nativeTestDeviceInfo()` — GPU adapter detection
- `nativeSetWindow(hwnd)` — Pass MC window handle
- `nativeRenderFrame()` — Per-frame rendering returning RGBA pixel data

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
| `Unsupported class file major version 69` | JDK version mismatch | Use JDK 21 for compilation (not JDK 25) |
| `Incompatible mods found!` | fabric.mod.json version declaration error | Confirm `"minecraft": "~1.21.1"` |

---

## Known Issues and Solutions

| Issue | Cause | Solution | Status |
|-------|-------|----------|--------|
| `glTexImage2D(pixels)` one-step crash | NVIDIA driver bug | Use two-step: `glTexImage2D(null)` + `glTexSubImage2D(pixels)` | ✅ Fixed |
| `glTexSubImage2D` ACCESS_VIOLATION at page boundary | NVIDIA driver pre-reads at page granularity, buffer not page-aligned | `MemoryUtil.memAlloc` + 4KB padding, `buf.limit(pixels.length)` | ✅ Fixed |
| Esc/settings menu crash | HUD callback conflicts with Screen rendering GL state | Skip GL drawing when Screen is not null | ✅ Fixed |
| Buffer size mismatch causing nvoglv64 out-of-bounds | Frame size inconsistent with window dimensions | Derive safe `height` from `bufferBytes` before calling glTexSubImage2D | ✅ Fixed |
| Rendering crash after resource reload | GL state not cleaned up | Reset `vaoId`/`shaderValid`/`texAllocated`/`pendingPixels` on reload detection | ✅ Fixed |
| Freezing from per-frame Rust rendering | GPU command queue contention | Throttle to every 100ms | ✅ Fixed |
| Lag from debug logging | Writing to disk every tick | Removed all non-essential logs | ✅ Fixed |
| Duplicate `setWindow` calls | JNI overhead + log spam | `lastSetHwnd` cache, skip if same HWND | ✅ Fixed |

---

## Roadmap

### Phase 1: JNI Communication Link ✅ Completed

| Task | Status |
|------|--------|
| Rust Workspace setup | ✅ |
| JNI bridge layer implementation | ✅ |
| Java Fabric mod | ✅ |
| DLL auto-loading | ✅ |
| GPU adapter detection | ✅ |

### Phase 2: wgpu Rendering Engine Skeleton ✅ Completed

| Task | Status | Description |
|------|--------|-------------|
| WmRenderer creation | ✅ | wgpu DX12 Instance → Adapter → Device |
| Offscreen rendering | ✅ | `render_frame()` outputs RGBA pixels |
| Pixel feedback | ✅ | Rust → Java byte[] → OpenGL texture → fullscreen Quad |
| Standalone test program | ✅ | `examples/simple.rs` runs independently rendering triangles |
| Window size sync | ✅ | `nativeResize()` updates renderer dimensions |

### Phase 3: Fabric Event System Integration ✅ Completed

| Task | Status | Description |
|------|--------|-------------|
| ClientTickEvents | ✅ | Timing, resource reload detection, calling Rust rendering |
| HudRenderCallback | ✅ | OpenGL texture upload + fullscreen quad drawing |
| GL state management | ✅ | Complete save/restore mechanism |
| VAO/Shader persistence | ✅ | Created once, automatically rebuilt on loss |

### Phase 4: Actual Minecraft Scene Rendering ❌ Not Started

Currently `render_frame()` only generates solid color frames (blue). To achieve actual Minecraft scene rendering:

| Task | Priority | Description |
|------|----------|-------------|
| Chunk rendering | 🔴 P0 | Block mesh generation + vertex buffers |
| Skybox and clouds | 🟠 P1 | Simple shaders suffice |
| Entity rendering | 🟠 P1 | Model loading + skeletal animation |
| Particle system | 🟡 P2 | Point sprites |
| Transparent object sorting | 🟡 P2 | Depth sorting algorithm |
| Post-processing effects | 🟢 P3 | Bloom, shadows, tone mapping |

#### Reference: wgpu-mc RenderGraph Design

```yaml
passes:
  - name: "sky_pass"
    render_target: "main"
    shader: "sky.wgsl"
    depth_test: false

  - name: "terrain_pass"
    render_target: "main"
    shader: "terrain.wgsl"
    depth_test: true

  - name: "entities_pass"
    render_target: "main"
    shader: "entity.wgsl"
    depth_test: true
    blending: alpha

  - name: "particles_pass"
    render_target: "main"
    shader: "particle.wgsl"
    depth_test: false
    blending: alpha
```

---

## Contributing

### Participation Methods

##### Currently not accepting any contributions

---

## License

MIT License
