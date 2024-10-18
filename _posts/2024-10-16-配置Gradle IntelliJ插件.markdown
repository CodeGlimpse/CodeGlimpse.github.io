---
layout: post
title: "配置Gradle IntelliJ插件"
date:  2024-10-16 14:29:54 +0800
categories: jekyll update
permalink: /zh/Intellij/Configuring-Gradle-IntelliJ-Plugin
background: '/assets/images/banner.jpg'
language: "zh"
item: post
menu-url: /zh/Intellij
menu-title: IntelliJ平台插件SDK文档
last-url: /zh/Intellij/Migrating-DevKit-Plugin-to-Gradle
last-title: 将 DevKit 插件迁移到 Gradle
next-url: /zh/Intellij/Configuring-Kotlin-Support
next-title: 配置 Kotlin 支持
---

# 配置 Gradle IntelliJ 插件

本部分将提供 Gradle 插件属性的指导教程，以实现通常所需的功能。有关更多高级选项，请参阅完整的 Gradle IntelliJ 插件 （1.x） 参考。

> ##### 仅限 Gradle IntelliJ 插件 （1.x）
> 本页仅涵盖 Gradle IntelliJ 插件 （1.x）。
> 请参阅 IntelliJ 平台 Gradle 插件 （2.x） 参考。稍后将提供它的专用页面。
>
> ##### Gradle 插件
>
> 必须根据目标平台版本选择 Gradle 插件。
>
> - 2024.2+：**需要** IntelliJ 平台 Gradle 插件 （2.x）
> - 2022.3+： **推荐** IntelliJ 平台 Gradle 插件 （2.x），**需要** Gradle IntelliJ 插件 （1.x） 版本 1.10.1+（当前版本：1.17.4）

## 保持最新状态

Gradle IntelliJ 插件和 Gradle 构建系统不断开发，每个新版本都会带来重要的错误修复、新功能和改进，从而提高开发效率。强烈建议将 Gradle 和 Gradle IntelliJ 插件更新到最新版本。较新的 IDE 版本在较旧版本的 Gradle IntelliJ 插件中可能不完全受支持。

> 当前的 Gradle IntelliJ 插件版本为 1.17.4

## 目标平台和依赖项

> 您的插件应该支持哪些版本？我们根据 [Statistics： Product Versions in Use](https://plugins.jetbrains.com/docs/marketplace/product-versions-in-use-statistics.html) 中的下载统计数据收集了一些见解。

默认情况下，Gradle 插件将针对 IntelliJ 平台构建插件项目，该平台由 IntelliJ IDEA Community Edition 的最新 EAP 快照定义。

如果本地计算机上没有指定 IntelliJ Platform 的匹配版本，则 Gradle 插件会下载正确的版本和类型。然后，IntelliJ IDEA 会为构建版本和任何关联的源代码以及 JetBrains Java 运行时编制索引。

要为多个目标平台版本构建插件，请参阅面向多个 IDE 版本了解重要说明。

### IntelliJ 平台配置

显式设置 `intellij.version` 和 `intellij.type` 属性会告知 Gradle 插件使用 IntelliJ 平台的该配置来创建插件项目。

> 有关如何开发与多个基于 IntelliJ 的 IDE 兼容的插件的信息，请参阅为多个产品开发页面。

所有可用的平台版本都可以在 IntelliJ Platform Artifacts Repositories 中浏览。

如果所选平台版本在存储库中不可用，或者目标 IDE 的本地安装是所需的 IntelliJ 平台类型和版本，请使用`intellij.localPath`指向该本地版本。如果设置了 `intellij.localPath` 属性，请不要设置 `intellij.version` 和 `intellij.type` 属性，因为这可能会导致未定义的行为。

### 插件依赖

IntelliJ Platform 插件项目可能依赖于捆绑插件或第三方插件。在这种情况下，项目应根据与用于构建插件项目的 IntelliJ Platform 版本匹配的插件版本进行构建。Gradle 插件将获取 `intellij.plugins` 定义的列表中的任何插件。有关指定插件和版本的信息，请参阅 Gradle 插件 IntelliJ 扩展。

请注意，此属性描述的是依赖项，以便 Gradle 插件可以获取所需的工件。运行时依赖项必须添加到 Plugin Configuration （**plugin.xml**） 文件中，如 Plugin Dependencies 中所述。

## 运行 IDE 任务

默认情况下，Gradle 插件将对 IDE 开发实例使用与构建插件时相同的 IntelliJ 平台版本。使用相应的 JetBrains Runtime 也是默认设置，因此对于此用例，不需要进一步配置。

### 针对基于 IntelliJ 平台的 IDE 的替代版本和类型运行

用于开发实例的 IntelliJ Platform IDE 可以不同于用于构建插件项目的 IntelliJ Platform IDE。设置 `runIde.ideDir` 属性将定义用于开发实例的 IDE。在基于 IntelliJ 平台的备用 IDE 中运行或调试插件时，通常使用此属性。

### 针对 JetBrains 运行时的替代版本运行

IntelliJ 平台的每个版本都有相应的 JetBrains 运行时版本。通过指定 `runIde.jbrVersion` 属性，可以使用 Run 的不同版本，该属性描述了 IDE 开发实例应使用的 JetBrains Runtime 版本。Gradle 插件将根据需要获取指定的 JetBrains 运行时。

## 修补插件配置文件

插件项目的 **plugin.xml** 文件具有在构建时从 `patchPluginXml` 任务的属性中“修补”的元素值。Patching DSL 中尽可能多的属性将被替换为插件项目的 **plugin.xml** 文件中的相应元素值：

- 如果定义了`patchPluginXml`属性默认值，则_无论`patchPluginXml`任务是否出现在Gradle构建脚本中_，该属性值都将在**plugin.xml**中进行修补。
    - 例如，属性`patchPluginXml.sinceBuild`和`patchPlugingXml.untilBuild`的默认值是基于`intellij.version`的声明（或默认）值定义的。因此，默认情况下，`patchPluginXml.sinceBuild`和`patchPlugingXml.untilBuild`被替换为**plugin.xml**文件中`<idea-version>`元素的`since-build`和`until-build`属性。
- 如果显式定义了 `patchPluginXml` 任务的属性值，则该属性值将在 **plugin.xml** 中替换。
    - 如果 `patchPluginXml.sinceBuild` 和 `patchPluginXml.untilBuild` 属性都已显式设置，则两者都将在 **plugin.xml** 中替换。
    - 如果一个属性被显式设置（例如`patchPluginXml.sinceBuild`），而一个属性没有被显式设置（例如`patchPluginXml.untilBuild`具有默认值），则两个属性都将按各自的（显式和默认）值进行修补。
- 为了**不替换**`<idea-version>`元素的`since-build`和`until-build`属性，请将`intellij.updateSinceUntilBuild`设置为`false`，并且不提供`patchPluginXml.sinceBuild`和patchPlugin Xml.untilBuild值。

避免混淆的最佳方法是将 **plugin.xml** 中由 Gradle 插件修补的元素替换为注释。这样，这些参数的值就不会出现在源代码中的两个位置。Gradle 插件将在修补过程中添加必要的元素。对于包含诸如 `patchPluginXml.changeNotes` 和 `patchPluginXml.pluginDescription` 之类的描述的 `patchPluginXml` 属性，在使用 HTML 元素时不需要 `CDATA` 块。

> 要维护和生成最新的 changelog，请尝试使用 Gradle Changelog Plugin。

如 向导生成的 Gradle IntelliJ 平台插件的组件中所述，Gradle 属性`project.version`、`project.group`和`rootProject.name`都是根据向导的输入生成的。但是，Gradle IntelliJ 插件 （1.x） 不会将这些 Gradle 属性组合和替换 **plugin.xml** 文件中的默认 `<id>` 和 `<name>` 元素。

最佳做法是使 `project.version` 保持最新。默认情况下，如果你在 Gradle 构建脚本中修改了 `project.version`，Gradle 插件会自动更新 **plugin.xml** 文件中的 `<version>` 值。这种做法使所有版本声明保持同步。

## 验证插件

Gradle 插件提供了允许运行完整性和兼容性测试的任务：

- `verifyPluginConfiguration` - 验证插件项目中配置的 SDK 版本、目标平台、API 等，
- `verifyPlugin` - 验证 **plugin.xml** 描述符的完整性和内容以及插件的存档结构，
- `runPluginVerifier` - 运行 IntelliJ Plugin Verifier 工具以检查与指定 IntelliJ IDE 构建的二进制兼容性。

Plugin Verifier 集成任务允许配置将检查插件的确切 IDE 版本。有关更多信息，请参阅 Plugin Verifier 。

## 发布插件

在使用 `publishPlugin` 任务之前，请查看 Publishing a Plugin 页面。该文档介绍了使用 Gradle 进行插件上传而不暴露帐户凭据的不同方法。