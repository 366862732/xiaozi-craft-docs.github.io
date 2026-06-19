# DX12-Lib 原生渲染库 贡献者快速上手技术文档
### 如果使用的是AI，在贡献之前请先确认是否符合项目规范。标注使用的什么模型，以及模型的版本。
## 文档基础信息
- 项目名称：dx12-lib-template-26.1.2
- 核心功能：Java JNI + D3D12 混合渲染（3D世界模型 + UI正交界面 + 粒子/半透明/天空渲染管线）
- 核心痛点修复：`javaw.exe 0x00000000 内存不能为written` 空指针写入崩溃
- 开发环境：Windows 10/11 + Visual Studio 2022 + JDK 64位
- 构建方式：CMake / VS文件夹原生编译（无固定vcxproj）
- 代码核心文件：`src/main/native/windows/d3d12bridge.cpp`

# 一、环境前置依赖（必须全部安装）
## 作者的开发环境配置（参考）
Visual Studio 2026+IntelliJ IDEA Community Edition 2025.2.6.2+Trae+VS Code
## 1. Windows SDK
安装对应VS版本Windows SDK（包含D3D12、DXGI头文件与静态库）
## 2. Visual Studio 2026
- 勾选组件：C++桌面开发、Windows 10/11 SDK、CMake工具集
- 无需手动创建vcxproj，支持「打开文件夹」直接编译C++源码
## 3. 64位JDK（与编译DLL位数严格统一）
- 推荐 JDK8 / JDK17 x64
- 环境变量配置`JAVA_HOME`，VS可自动读取jni.h头文件
## 4. 调试工具（必装，崩溃日志定位）
DebugView：捕获代码内`Log()`打印的运行时日志，区分正常/异常`[FATAL]/[ERROR]`

# 二、项目目录结构说明
```
dx12-lib-template-26.1.2
├─ src
│  ├─ main
│  │  ├─ native
│  │  │  └─ windows
│  │  │     └─ d3d12bridge.cpp  # 唯一核心C++ JNI+D3D12代码
│  │  └─ java
│  │     └─ DX12LibClient.java  # JNI Native接口声明
├─ lib        # 编译输出64位DLL存放目录
├─ run.bat    # Java程序启动脚本
└─ build-x64  # CMake编译生成目录（手动创建）
```

# 三、两种编译构建方案（任选其一）
## 方案1：VS图形界面「打开文件夹」编译（推荐新手，无需CMake命令）
1. 打开Visual Studio 2022 → 「打开文件夹」
2. 选中目录：`D:\dx12-lib-template-26.1.2\src\main\native\windows`
3. 顶部配置切换：
   - 解决方案平台：`x64`（**禁止x86，位数不匹配直接内存崩溃**）
   - 生成配置：`Release`
4. 手动配置链接依赖（仅首次配置）
   右键项目 → 属性 → 链接器 → 输入 → 附加依赖项，添加：
   ```
   d3d12.lib
   dxgi.lib
   d3dcompiler.lib
   ```
5. 菜单栏点击「生成」→「全部生成」
6. 编译产物：x64 Release DLL输出至项目`lib`文件夹

## 方案2：CMake命令行批量编译（自动化/CI场景）
### 1）根目录执行PowerShell
```powershell
# 1. 进入项目根目录
cd D:\dx12-lib-template-26.1.2
# 2. 创建x64编译目录
mkdir build-x64
cd build-x64
# 3. CMake生成VS x64解决方案
cmake .. -A x64
# 4. MSBuild编译Release版本
msbuild dx12-lib.sln /p:Platform=x64;Configuration=Release
```
### 2）编译完成后拷贝DLL至`lib`目录供Java调用

# 四、核心代码安全加固规范（修复0地址崩溃强制标准）
## 4.1 所有`->Map()`内存映射强制双校验（13处全覆盖标准模板）
### 错误写法（会触发0x00000000写入崩溃，禁止提交）
```cpp
void* dst;
g_imVB->Map(0, nullptr, &dst);
memcpy(dst, data, size);
```
### 规范加固写法（所有Map调用统一使用）
```cpp
void* dst = nullptr;
HRESULT hr = g_imVB->Map(0, nullptr, &dst);
// 双重校验：API调用失败 || 返回空指针
if (FAILED(hr) || dst == nullptr)
{
    // 1. 打印定位日志，格式固定[FATAL]
    Log("[FATAL] 【函数名】缓冲区Map返回空地址，阻断写入防止0地址崩溃");
    // 2. 根据场景补充资源释放，避免内存泄漏/死锁
    // JNI场景：释放Java数组、解锁临界区
    env->ReleaseFloatArrayElements(verts, buf, JNI_ABORT);
    LeaveCriticalSection(&g_stateLock);
    return;
}
// 正常业务memcpy逻辑不变
memcpy(dst, data, size);
```

## 4.2 D3D12命令列表`Reset()`强制返回值校验（2处RenderLoop固定点位）
### 规范模板
```cpp
HRESULT hr = g_alloc->Reset();
if (FAILED(hr)) {
    Log("[ERROR] 命令分配器 Reset 失败");
    continue; // 跳过当前渲染帧
}
hr = g_cl->Reset(g_alloc.Get(), nullptr);
if (FAILED(hr)) {
    Log("[ERROR] 命令列表 Reset 失败");
    continue;
}
```

## 4.3 全局Map点位覆盖清单（贡献者修改后必须核对）
1. MkUpload 通用上传缓冲
2. UploadTextureEx 纹理上传
3. CaptureMCFrame 帧截图捕获
4. EnsureIMVBCapacity 实例顶点扩容双Map
5. RenderLoop 循环内实例顶点写入Map
6. DrawChunk CBV常量缓冲刷新
7. 初始化阶段CBV缓冲创建
8. nativeRecordVertices JNI顶点接收缓冲
9. nativeRecordVerticesPT 粒子顶点接收
10. UploadVertexData（原生自带校验，无需修改）
11. nativeRenderSky 天空渐变常量缓冲
12. nativeRenderTransparent 半透明渲染常量缓冲
13. 实例化IB顶点扩容临时缓冲

# 五、JNI Java层对接规范（零修改原则）
1. **禁止删除原有旧native兼容接口**，新增功能使用`Safe`后缀重载接口
```java
// 旧兼容接口（保留不动）
public static native void nativeRecordVertices(float[] vertexData, int floatCount);
// 新安全接口（完整顶点字节参数，修复顶点解析错乱）
public static native void nativeRecordVerticesSafe(float[] vertexData, int coordType, int vertexCount, int vertexByteSize);
```
2. Java业务调用新接口计算规则
```java
float[] vertices = getMeshVertices();
int singleVertexFloatCount = 7; // xyz+color+uv，按顶点结构修改
int vertexCount = vertices.length / singleVertexFloatCount;
int vertexByteSize = singleVertexFloatCount * 4; // float固定4字节
nativeRecordVerticesSafe(vertices, 0/*0=3D,1=UI*/, vertexCount, vertexByteSize);
```
3. 无需新增`nativeSetCoordType`，通过DrawChunk独立MVP矩阵区分3D/UI渲染，不增加JNI交互开销

# 六、运行测试与崩溃验证流程
## 1. 部署步骤
1. 将编译完成x64 DLL放入项目`lib`文件夹
2. 执行`run.bat`启动Java渲染程序
```bat
@echo off
javaw -XX:+UseSerialGC -jar your-app.jar
pause
```
## 2. 日志调试（DebugView使用方法）
1. 打开DebugView，开启捕获Win32 OutputDebug日志
2. 正常渲染预期输出：仅打印`Vertex range: count=xxx`，无`[ERROR]/[FATAL]`
3. 异常边界场景（显存不足/缓冲扩容失败）：
   - 不会弹出`javaw.exe 应用程序错误 0x00000000不能为written`弹窗
   - DebugView打印对应`[FATAL]`日志，程序自动跳过异常帧继续运行

# 七、代码提交约束（贡献者PR合并标准）
## ✅ 允许提交
1. 仅增量添加安全校验代码，**不删除/覆盖原有业务逻辑**（天空、粒子、半透明排序、多PSO、独立MVP全部保留）
2. 全部`->Map()`/`Reset()`按标准模板添加双重校验日志
3. 不引入新架构冲突变量：不新增`g_3dRootSignature/g_uiPSO`等模板管线变量
4. 不依赖`d3dx12.h`，仅使用原生D3D12 API
5. Java接口向下兼容，旧native方法不删除

## ❌ 禁止提交
1. 完整替换`d3d12bridge.cpp`全文件，覆盖原有渲染业务代码
2. 新增冲突JNI接口、全局渲染管线变量
3. 移除Map/Reset的空指针拦截校验，删除`[FATAL]/[ERROR]`日志
4. 混用32/64位编译产物，提交x86 DLL
5. 修改原有天空、粒子、半透明、纹理、深度缓冲渲染逻辑

# 八、常见问题快速排错
## 1. MSBuild提示「项目文件不存在」
原因：目录无`.vcxproj`，本项目为CMake/文件夹编译架构
解决：使用VS「打开文件夹」图形编译，或执行CMake生成解决方案

## 2. 运行弹出javaw内存写入崩溃弹窗
排查点：
1. DLL与JDK位数不一致（必须全部x64）
2. 存在未加固的`->Map()`调用，全局搜索`->Map(`核对13处点位
3. JNI函数异常分支未释放数组/解锁临界区，导致内存悬空

## 3. 编译报`d3d12.h 找不到`
解决：安装完整Windows SDK，VS工具集切换至对应SDK版本

## 4. 渲染画面空白/模型扁平化
原因：业务MVP矩阵区分3D/UI逻辑问题，**与本次内存加固代码无关**，单独排查渲染管线coordType矩阵切换逻辑