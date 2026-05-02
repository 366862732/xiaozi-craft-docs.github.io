# JVM 参数
## 在xiaozi craft中，有哪些JVM参数能给你优化游戏呢：
:::warning
Java21的参数不能和Java25以上的参数混合使用！
:::
### Java21的参数
在Java21中使用分代ZGC，可以显著提高游戏的性能。
```Java
-XX:+UseZGC -XX:+ZGenerational -XX:+AlwaysPreTouch
```
#### 使用G1GC内存管理器
```Java
-XX:+UseG1GC
```
#### 禁用自适应大小策略
禁用后，JVM 不会自动调整年轻代、老年代大小和 Survivor 空间比例,在游戏/模组服务端中，对象的晋升模式比较固定，自动调整可能导致突然的 Full GC 或晋升失败。手动固定分代大小（如 -XX:G1NewSizePercent、-XX:G1MaxNewSizePercent）可获得更稳定的 GC 行为。
```Java
-XX:-UseAdaptiveSizePolicy
```
#### 禁用快速抛异常时省略堆栈跟踪的优化
禁用快速抛异常时省略堆栈跟踪的优化。JVM 会优化，当同一个异常在同一个位置频繁抛出时（比如空指针），不再打印堆栈，只抛异常类型。这个参数就是在强制每次异常都打印完整堆栈。对调试模组冲突或插件问题非常有用，能准确定位哪个模组在不停抛 NPE。
```Java
-XX:-OmitStackTraceInFastThrow
```
#### 允许使用有歧义的进程命令字符串
允许使用有歧义的进程命令字符串,JDK 的 ProcessBuilder 在 Windows 上会对命令字符串做严格检查，歧义（如路径含空格未加引号）可能抛异常。这个参数的作用是放宽限制，避免 Minecraft 或某些模组在启动子进程（如调用外部脚本/程序）时因命令格式歧义而失败。
```Java
-Djdk.lang.Process.allowAmbiguousCommands=true
```
#### 忽略无效的 Minecraft 证书（FML = Forge Mod Loader 的遗留系统属性）。
作用：某些模组或核心修改会破坏 Minecraft 原版 jar 的签名检查，开启此参数后不会因证书错误而崩溃。常见于模组服务器或离线/破解环境（虽然官方正版通常不需要）。
```Java
-Dfml.ignoreInvalidMinecraftCertificates=True
```
#### 忽略模组补丁不一致的警告/错误。
当 Forge 对 Minecraft 类进行补丁（Patch）时，如果多个模组修改同一个类或版本不匹配，会触发报错。开启后强制忽略这些差异，可能允许运行，但可能引发奇怪 bug（主要用于风险自担的实验性环境）。
```Java
-Dfml.ignorePatchDiscrepancies=True
```
#### 禁用 Log4j2 的消息查找功能（Lookups）。
这是针对 Log4Shell 漏洞（CVE-2021-44228） 的缓解措施，作用是防止日志消息中的 ${jndi:...} 等表达式被执行远程代码。Minecraft 1.12+ 及许多模组使用 Log4j2，这个参数至关重要。
```Java
-Dlog4j2.formatMsgNoLookups=true
```
#### 设置年轻代（Young Generation）占整个堆内存的初始百分比。
5%（在某些 JDK 版本中可能是 5，实际范围 5%~60%）。作用是在JVM 启动后，年轻代大小会从堆的 5% 开始，后续根据自适应策略（如果开启）或你的其他参数调整。由于禁用自适应策略，这个值会作为年轻代大小的下限（除非显式设置了 -Xmn 或 -XX:NewSize）。
```Java
-XX:G1NewSizePercent=5
```
#### 设置年轻代可以膨胀到的最大百分比（占整个堆的比例）。
作用：限制年轻代的最大大小。即使通过自适应调整（或你的手动控制），年轻代也不能超过堆的 60%。
为什么重要：G1 的老年代收集是并发进行的，但如果年轻代过大，会导致：
年轻代 GC 停顿时间变长（因为存活对象多）
晋升压力增大，可能触发过早的并发标记周期
调优建议：如果你的应用对象生命周期短（如游戏服务器每 tick 产生大量临时对象），可以增大这个值（如 70%）以减少 Young GC 频率；如果对象晋升快（长时间存活），可以降低（如 40%）以避免频繁的 Mixed GC。
```Java
-XX:G1MaxNewSizePercent=50
```
#### 设置GC 停顿时间的目标最大值（单位：毫秒）。
作用：G1 会尝试通过调整年轻代大小、划分 Region 等方式，将每次 GC 的停顿时间控制在 200ms 内。这只是一个软目标，不是硬性保证。

设得太小（如 50ms）→ 年轻代变得很小 → 频繁 Young GC → 总吞吐量下降，CPU 占用升高。

设得太大（如 500ms）→ 年轻代很大 → GC 次数少，但每次停顿时间长 → 适合对吞吐量敏感、可容忍长停顿的场景（如批处理）。

对 Minecraft 服务器：200ms 是常见折中值，玩家能感知到 100~200ms 的卡顿，但不会太严重
```Java
-XX:G1GCauseTimeMillis=200
```
#### 当老年代占用达到整个堆的 45% 时，启动并发标记周期（Concurrent Marking Cycle）。
用：触发并发标记→最终会进行一次 Mixed GC（混合收集，同时回收年轻代和老年代部分 Region）。如果 IHOP 设得太低（如 35%），老年代还没满就提前标记，可能过度频繁触发 Mixed GC，浪费 CPU；设得太高（如 65%），老年代堆满风险增加，可能退化为 Full GC（非常糟糕，会导致服务器长时间卡死）。

调优经验：

观察 GC 日志，如果经常出现 Full GC（日志中看到 Full GC 字样），说明 IHOP 太高，老年代来不及回收就满了，可以降低此值（如 40%）。

如果 Mixed GC 太频繁但堆占用并不高，可以提高 IHOP（如 55%）。

```Java
-XX:G1MixedGCCountTarget=4
```
### Java25以上的参数
将 JVM 中的对象头大小从 96–128 位减少到 64 位，从而降低堆内存使用量并可能提升性能。Java 25 已将其作为正式功能引入
```Java
-XX:+UseCompactObjectHeaders
```
#### 设置并发 GC 阶段的线程数。
默认值：CPU 核心数的 1/4（向上取整）。

调优建议：如果你的服务器 CPU 核心充足（如 16 核以上），可设为 4~6。过高会导致 GC 抢占应用 CPU，影响 TPS。
```Java
-XX:ConcGCThreads=N
```
#### 设置对内存分配突增的敏感度。值越高，GC 触发越激进。
默认值：100（100%）。作用：当堆内存占用超过 100% 时，会触发 GC 以释放内存。如果设置为 200（200%），则会触发 GC 以释放内存，但 GC 会更频繁。

适用场景：Minecraft 模组服常因生物生成、红石运算、区块加载出现内存瞬时暴涨，提高到 5 可避免因 GC 跟不上分配导致的服务端卡死（Allocation Stall）。
```Java
-XX:ZAllocationSpikeTolerance=5
```
#### 设置ZGC 尝试保持的堆大小软上限（低于 -Xmx）。
作用：设置后 ZGC 会更积极地回收内存，避免堆无限膨胀到 -Xmx。例如 -Xmx8G -XX:SoftMaxHeapSize=7G，ZGC 会努力将堆控制在 7G 内，仅在必要时才用到 8G。
```Java
-XX:SoftMaxHeapSize //--->这后面跟数值，单位是 G 或 M，例如下方写法:
-Xmx8G -XX:SoftMaxHeapSize=7G       //这里的 7G 是 ZGC 尝试保持的堆大小软上限，8G 是最大堆内存,Xmx 8G 是最大堆内存,这里用做演示,别傻乎乎写两个Xmx，java不接受你的奇葩操作
```
#### 启动时向 OS 申请并“触摸”所有内存页，提前分配物理内存。
效果：消除运行时内存分配延迟，避免 GC 时因缺页中断导致的停顿尖峰。代价是启动变慢，但强烈建议开启。
```Java
-XX:+AlwaysPreTouch
```
#### 使用 2MB 巨页代替默认的 4KB 小页（Linux 巨页）
效果：减少 TLB 未命中，提升 GC 吞吐量 10%~15%，降低 CPU 开销。

代价：需要操作系统预先分配巨页池，配置稍复杂
```Java
-XX:+UseLargePages
```
:::warning
❌ 严禁使用的参数
在 Java 25+ ZGC 下，严禁设置 -XX:ZCollectionInterval（强制 GC 间隔）。ZGC 已内置智能调度算法，手动强制 GC 会打乱其节奏，导致原本 1ms 的停顿飙升到 100ms+，造成服务端周期性严重卡顿
:::
:::warning
#### 内存分配写法
Xmx 是最大堆内存,Xms 是初始堆内存大小，

注意这里踩坑的点

1. Xms 必须小于或者等于Xmx，如果是

```Java 
-Xms8G -Xmx1G       //错误的写法
``` 
最小8GB,最大1GB，你要TM要做什么？Java:“我做不到啊亲”

2. Xmx 必须是 2 的整数倍比如1,2，4，6，8，16，32，64

3. Xms 必须是 2 的整数倍比如1,2，4，6，8，16，32，64

而且你的客户端Minecraft启动器有对应的内存分配的设置，不要启动器本身设置内存参数，然后实例的JVM设置一个参数，你设置两个内存参数Java到底用哪个？只需要设置一个即可（两个会冲突）
```Java
-Xms8G -Xmx8G //，正确的写法，这里指最小堆内存和最大堆内存都设置为 8G
```
:::

