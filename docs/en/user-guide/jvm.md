# JVM Arguments

## Which JVM arguments can help optimize `xiaozi craft`?

:::warning
Do not mix Java 21 arguments with Java 25+ arguments.
:::

### Java 21 arguments

Using generational ZGC on Java 21 can improve game performance significantly.

```Java
-XX:+UseZGC -XX:+ZGenerational -XX:+AlwaysPreTouch
```

#### Use the G1GC memory manager

```Java
-XX:+UseG1GC
```

#### Disable adaptive sizing policy

After disabling it, the JVM will no longer resize the young generation, old generation, or survivor spaces automatically. On heavily modded game servers, object promotion patterns are often predictable, so manual sizing can provide more stable GC behavior.

```Java
-XX:-UseAdaptiveSizePolicy
```

#### Disable the fast-throw optimization that omits stack traces

The JVM may omit stack traces when the same exception is thrown repeatedly from the same location. This option forces a full stack trace every time, which is useful when debugging mod conflicts or plugin issues.

```Java
-XX:-OmitStackTraceInFastThrow
```

#### Allow ambiguous process command strings

On Windows, `ProcessBuilder` can reject ambiguous command strings such as paths with spaces and missing quotes. This flag relaxes that behavior.

```Java
-Djdk.lang.Process.allowAmbiguousCommands=true
```

#### Ignore invalid Minecraft certificates

Some mods or core modifications can break the original Minecraft jar signature checks. Enabling this option prevents crashes caused by certificate validation failures.

```Java
-Dfml.ignoreInvalidMinecraftCertificates=True
```

#### Ignore mod patch discrepancy warnings and errors

When Forge patches Minecraft classes, conflicts between mods or version mismatches can trigger errors. This option forces those discrepancies to be ignored, which may help in experimental environments but can also cause unstable behavior.

```Java
-Dfml.ignorePatchDiscrepancies=True
```

#### Disable Log4j2 message lookups

This is a mitigation for the Log4Shell vulnerability and prevents dangerous lookups such as `${jndi:...}` from being evaluated inside log messages.

```Java
-Dlog4j2.formatMsgNoLookups=true
```

#### Set the initial heap percentage used by the young generation

```Java
-XX:G1NewSizePercent=5
```

#### Set the maximum heap percentage the young generation can grow to

```Java
-XX:G1MaxNewSizePercent=50
```

#### Set the target maximum GC pause time in milliseconds

G1 tries to keep each GC pause near this soft target by adjusting region and generation behavior.

```Java
-XX:G1GCauseTimeMillis=200
```

#### Control the mixed GC target count

```Java
-XX:G1MixedGCCountTarget=4
```

### Java 25 and later

Compact object headers reduce object header size and can lower heap memory usage on Java 25 and later.

```Java
-XX:+UseCompactObjectHeaders
```

#### Set the number of concurrent GC threads

Default: about one quarter of the available CPU cores.

```Java
-XX:ConcGCThreads=N
```

#### Set sensitivity to sudden allocation spikes

Useful for modded servers where mob spawning, redstone activity, or chunk loading may create sudden memory pressure.

```Java
-XX:ZAllocationSpikeTolerance=5
```

#### Set the ZGC soft heap limit below `-Xmx`

ZGC will try to keep heap usage under this value and only use the full `-Xmx` limit when necessary.

```Java
-XX:SoftMaxHeapSize
-Xmx8G -XX:SoftMaxHeapSize=7G
```

#### Touch all memory pages at startup

This reduces runtime allocation latency and avoids pause spikes caused by page faults, although startup becomes slower.

```Java
-XX:+AlwaysPreTouch
```

:::warning
#### Use large pages carefully

Large pages can improve throughput and reduce CPU cost, but JVM startup may fail if the operating system cannot provide suitable memory regions.

Known workarounds:

1. Make sure the operating system has enough clean memory.
2. On virtual machines, adjust memory allocation strategy if needed.
3. On physical machines, verify that enough RAM is available.
4. Consider transparent huge pages instead.

```Java
-XX:+UseTransparentHugePages
```

```Java
-XX:+UseLargePages
```
:::

:::warning
#### Arguments you must not use

With Java 25+ ZGC, do not set `-XX:ZCollectionInterval`. ZGC already contains its own scheduling strategy, and forcing collection intervals can cause severe periodic lag spikes.
:::

:::warning
#### Heap size examples

`-Xmx` is the maximum heap size and `-Xms` is the initial heap size.

Important notes:

1. `-Xms` must be less than or equal to `-Xmx`.
2. Use practical values such as 1G, 2G, 4G, 8G, 16G, 32G, or 64G when possible.
3. Do not set memory options in both the launcher and the instance JVM configuration at the same time.

Wrong example:

```Java
-Xms8G -Xmx1G
```

Correct example:

```Java
-Xms8G -Xmx8G
```
:::
