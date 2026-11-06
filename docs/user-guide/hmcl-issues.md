# HMCL问题

## 现象

我使用 PCL / PCLCE 导出整合包，但是在 HMCL 中安装只安装了游戏本体，光影模组等资源并没有被正确地下载。

该整合包文件本质上是一个 `.zip` 文件：

##### 里面的 `manifest.json`（CurseForge 格式索引）中 `"files": []`，本身声明不安装任何文件；

##### 里面的真正的文件列表写在 `modrinth.index.json`（Modrinth 格式索引）里，但文件后缀不是规范的 `.mrpack`

结果是 HMCL 按照 CurseForge 整合包的规则读 `manifest.json`，认为不用装任何文件；而 PCL 系的启动器读 `.zip` 文件时读的是 `modrinth.index.json`，所以可以正常安装。

## 动机

##### 这种"畸形格式"整合包确实有人在下载使用，整条链路（PCL 导出"畸形格式" → 上传 CurseForge → 用户使用 PCL 下载 → PCL 导入）是跑得通的。

##### 我想把我的整合包上传到 CurseForge 上是为了无门槛下载 + 启动器自动安装，不被网盘影响，方便整合包的受众。

##### 我希望 HMCL 在读取 `.zip` 格式整合包文件时能兼容读取 `modrinth.index.json`，从而让使用 PCL"畸形格式"的这一类整合包在 HMCL 里面也能正常地安装，而不是要求整合包作者去改。

##### 借这个议题 把"PCL 系产出非规范整合包"这个长期无人提及的问题摆到明面上，推动社区面对。

## 请求

##### 请求

请求 HMCL 增加兼容：在导入 `.zip` 整合包时，除了读 `manifest.json`，也能识别并读取其中的 `modrinth.index.json`，按 Modrinth 格式安装文件。

> （隐含请求）希望维护者不要简单以"格式不规范"为由关闭，而是考虑实际用户链路和兼容成本。
