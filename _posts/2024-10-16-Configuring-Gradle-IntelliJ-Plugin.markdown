---
layout: post
title: "Configuring Gradle IntelliJ Plugin"
date: 2024-10-16 14:28:04 +0800
categories: jekyll update
permalink: /Intellij/Configuring-Gradle-IntelliJ-Plugin
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Migrating-DevKit-Plugin-to-Gradle
last-title: Migrating DevKit Plugin to Gradle
next-url: /Intellij/
next-title: 
---

# Configuring Gradle IntelliJ Plugin

This section presents a guided tour of Gradle plugin attributes to achieve the commonly desired functionality. For more advanced options, see the full Gradle IntelliJ Plugin (1.x) reference.

> ##### Gradle IntelliJ Plugin (1.x) Only
> This page covers Gradle IntelliJ Plugin (1.x) only.
> See the IntelliJ Platform Gradle Plugin (2.x) reference. A dedicated page for it will be provided later.
>
> ##### Gradle Plugin
> 
> The Gradle plugin must be chosen depending on the target platform version.
> 
> - 2024.2+:  **Requires** IntelliJ Platform Gradle Plugin (2.x)
> - 2022.3+:  **Recommended** IntelliJ Platform Gradle Plugin (2.x), **Requires** Gradle IntelliJ Plugin (1.x) version 1.10.1+ (current: 1.17.4)_

## Keep Up To Date

Gradle IntelliJ Plugin and Gradle build system are constantly developed, and every new release brings important bug fixes, new features, and improvements that makes the development more efficient. It is strongly recommended to keep updating both Gradle and Gradle IntelliJ Plugin to the latest versions. Newer IDE releases might not be supported fully in older releases of Gradle IntelliJ Plugin.

> Current Gradle IntelliJ Plugin version is 1.17.4

## Target Platform and Dependencies

> Which versions should your plugin support? We've collected some insights based on download statistics in [Statistics: Product Versions in Use](https://plugins.jetbrains.com/docs/marketplace/product-versions-in-use-statistics.html).

By default, the Gradle plugin will build a plugin project against the IntelliJ Platform defined by the latest EAP snapshot of the IntelliJ IDEA Community Edition.

If a matching version of the specified IntelliJ Platform is not available on the local machine, the Gradle plugin downloads the correct version and type. IntelliJ IDEA then indexes the build and any associated source code and JetBrains Java Runtime.

To build a plugin for more than one target platform version, see Targeting Multiple IDE Versions for important notes.

### IntelliJ Platform Configuration

Explicitly setting the `intellij.version` and `intellij.type` properties tells the Gradle plugin to use that configuration of the IntelliJ Platform to create the plugin project.

> See the Developing for Multiple Products page for information about how to develop a plugin that is compatible with multiple IntelliJ-based IDEs.

All available platform versions can be browsed in the IntelliJ Platform Artifacts Repositories.

If the chosen platform version is not available in the repositories, or a local installation of the target IDE is the desired type and version of the IntelliJ Platform, use `intellij.localPath` to point to that installation. If the `intellij.localPath` attribute is set, do not set the `intellij.version` and `intellij.type` attributes as this could result in undefined behavior.

### Plugin Dependencies

IntelliJ Platform plugin projects may depend on either bundled or third-party plugins. In that case, a project should build against a version of those plugins that match the IntelliJ Platform version used to build the plugin project. The Gradle plugin will fetch any plugins in the list defined by `intellij.plugins`. See the Gradle plugin IntelliJ Extension for information about specifying the plugin and version.

Note that this attribute describes a dependency so that the Gradle plugin can fetch the required artifacts. The runtime dependency must be added in the Plugin Configuration (**plugin.xml**) file as described in Plugin Dependencies.

## Run IDE Task

By default, the Gradle plugin will use the same version of the IntelliJ Platform for the IDE Development Instance as was used for building the plugin. Using the corresponding JetBrains Runtime is also the default, so for this use-case no further configuration is required.

### Running Against Alternate Versions and Types of IntelliJ Platform-Based IDEs

The IntelliJ Platform IDE used for the Development Instance can be different from that used to build the plugin project. Setting the `runIde.ideDir` property will define an IDE to be used for the Development Instance. This attribute is commonly used when running or debugging a plugin in an alternate IntelliJ Platform-based IDE.

### Running Against Alternate Versions of the JetBrains Runtime

Every version of the IntelliJ Platform has a corresponding version of the JetBrains Runtime. A different version of the runtime can be used by specifying the `runIde.jbrVersion` attribute, describing a version of the JetBrains Runtime that should be used by the IDE Development Instance. The Gradle plugin will fetch the specified JetBrains Runtime as needed.

## Patching the Plugin Configuration File

A plugin project's **plugin.xml** file has element values that are "patched" at build time from the attributes of the `patchPluginXml` task. As many as possible of the attributes in the Patching DSL will be substituted into the corresponding element values in a plugin project's **plugin.xml** file:

- If a `patchPluginXml` attribute default value is defined, the attribute value will be patched in **plugin.xml** _regardless of whether the `patchPluginXml` task appears in the Gradle build script_.
  - For example, the default values for the attributes `patchPluginXml.sinceBuild` and `patchPluginXml.untilBuild` are defined based on the declared (or default) value of `intellij.version`. So by default `patchPluginXml.sinceBuild` and `patchPluginXml.untilBuild` are substituted into the `<idea-version>` element's `since-build` and `until-build` attributes in the **plugin.xml** file.
- If a `patchPluginXml` task's attribute value is explicitly defined, the attribute value will be substituted in **plugin.xml**.
  - If both `patchPluginXml.sinceBuild` and `patchPluginXml.untilBuild` attributes are explicitly set, both are substituted in **plugin.xml**.
  - If one attribute is explicitly set (e.g. `patchPluginXml.sinceBuild`) and one is not (e.g. `patchPluginXml.untilBuild` has a default value), both attributes are patched at their respective (explicit and default) values.
- For **no substitution** of the `<idea-version>` element's `since-build` and `until-build` attributes, set `intellij.updateSinceUntilBuild` to `false`, and do not provide `patchPluginXml.sinceBuild` and `patchPluginXml.untilBuild` values.

The best practice to avoid confusion is to replace the elements in **plugin.xml** that will be patched by the Gradle plugin with a comment. That way, the values for these parameters do not appear in two places in the source code. The Gradle plugin will add the necessary elements as part of the patching process. For those `patchPluginXml` attributes that contain descriptions such as `patchPluginXml.changeNotes` and `patchPluginXml.pluginDescription`, a `CDATA` block is not necessary when using HTML elements.

> To maintain and generate an up-to-date changelog, try using Gradle Changelog Plugin.

As discussed in Components of a Wizard-Generated Gradle IntelliJ Platform Plugin, the Gradle properties `project.version`, `project.group`, and `rootProject.name` are all generated based on the input to the Wizard. However, the Gradle IntelliJ Plugin (1.x) does not combine and substitute those Gradle properties for the default `<id>` and `<name>` elements in the **plugin.xml** file.

The best practice is to keep `project.version` current. By default, if you modify `project.version` in Gradle build script, the Gradle plugin will automatically update the `<version>` value in the **plugin.xml** file. This practice keeps all version declarations synchronized.

## Verifying Plugin

The Gradle plugin provides tasks that allow for running integrity and compatibility tests:

- `verifyPluginConfiguration` - validates the versions of SDK, target platform, APIs, etc., configured in a plugin project,
- `verifyPlugin` - validates completeness and contents of **plugin.xml** descriptors as well as plugin's archive structure,
- `runPluginVerifier` - runs the IntelliJ Plugin Verifier tool to check the binary compatibility with specified IntelliJ IDE builds.

Plugin Verifier integration task allows for configuring the exact IDE versions that your plugin will be checked against. See Plugin Verifier for more information.

## Publishing Plugin

Please review the Publishing a Plugin page before using the `publishPlugin` task. That documentation explains different ways to use Gradle for plugin uploads without exposing account credentials.

