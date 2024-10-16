---
layout: post
title: "Creating a Plugin Gradle Project"
date: 2024-10-15 11:10:21 +0800
categories: jekyll update
permalink: /Intellij/Creating-a-Plugin-Gradle-Project
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Developing-a-Plugin
last-title: Developing a Plugin
next-url: /Intellij/Plugin-GitHub-Template
next-title: Plugin GitHub Template
---

# Creating a Plugin Gradle Project

This documentation page describes a Gradle-based plugin project generated with the New Project Wizard, but the project generated with IntelliJ Platform Plugin Template covers all the described files and directories.

> ##### Gradle IntelliJ Plugin (1.x) Only
> 
> This page covers Gradle IntelliJ Plugin (1.x) only.
>
> See the IntelliJ Platform Gradle Plugin (2.x) reference. A dedicated page for it will be provided later.

## Creating a Plugin with New Project Wizard

> ##### Gradle Plugin
> 
> The Gradle plugin must be chosen depending on the target platform version.
>
> - 2024.2+:  **Requires** IntelliJ Platform Gradle Plugin (2.x)
> - 2022.3+:  **Recommended** IntelliJ Platform Gradle Plugin (2.x), **Requires** Gradle IntelliJ Plugin (1.x) version 1.10.1+ (current: 1.17.4)

#### Create IDE Plugin

_Plugin DevKit_ plugin is bundled with IntelliJ IDEA until 2023.2.

> ##### Plugin DevKit Availability
> 
> When using IntelliJ IDEA 2023.3 or later, the _Plugin DevKit_ plugin must be installed from JetBrains Marketplace (Plugin Homepage) as it is no longer bundled with the IDE.

Launch the **New Project** wizard via the **File \| New \| Project...** action and provide the following information:

1. Select the **IDE Plugin** generator type from the list on the left.
2. Specify the project **Name** and **Location**.
3. Choose the **Plugin** option in the project **Type**.
4. _Only in IntelliJ IDEA older than 2023.1:_    
   Choose the **Language** the plugin will use for implementation. For this example select the **Kotlin** option. See also Kotlin for Plugin Developers for more information.
   
   > ##### Using Kotlin and Java sources
   > 
   > Projects generated with IntelliJ IDEA 2023.1 or newer support both Kotlin and Java sources out of the box. The Project generator automatically creates **$PLUGIN_DIR$/src/main/kotlin** sources directory. To add Java sources, create the **$PLUGIN_DIR$/src/main/java** directory manually.
5. Provide the **Group** which is typically an inverted company domain (e.g. `com.example.mycompany`). It is used for the `Gradle property` project.group value in the project's Gradle build script.
6. Provide the **Artifact** which is the default name of the build project artifact (without a version). It is also used for the Gradle property `rootProject.name` value in the project's settings.gradle.kts file. For this example, enter `my_plugin`.
7. Select **JDK** 17. This JDK will be the default JRE used to run Gradle, and the JDK version used to compile the plugin sources.

   > ##### IDE and Java Versions
   > Java version must be set depending on the target platform version.
   > - 2024.2+: Java 21
   > - 2022.2+: Java 17 (blog post)
   > - 2020.3+: Java 11 (blog post)
8. After providing all the information, click the **Create** button to generate the project.

### Components of a Wizard-Generated Gradle IntelliJ Platform Plugin

For the example `my_plugin` created with the steps describes above, the `IDE Plugin` generator creates the following directory content:

![](/assets/images/Intellij/Creating%20a%20Plugin%20Gradle%20Project.png)

- The default IntelliJ Platform **build.gradle.kts** file (see next paragraph).
- The **gradle.properties** file, containing properties used by Gradle build script.
- The **settings.gradle.kts** file, containing a definition of the `rootProject.name` and required repositories.
- The Gradle Wrapper files, and in particular the **gradle-wrapper.properties** file, which specifies the version of Gradle to be used to build the plugin. If needed, the IntelliJ IDEA Gradle plugin downloads the version of Gradle specified in this file.
- The **META-INF** directory under the default `main` source set contains the plugin configuration file and plugin logo.
- The _Run Plugin_ run configuration.

The generated `my_plugin` project **build.gradle.kts** file:

```
plugins {
  id("java")
  id("org.jetbrains.kotlin.jvm") version "1.9.21"
  id("org.jetbrains.intellij") version "1.17.4"
}

group = "com.example"
version = "1.0-SNAPSHOT"

repositories {
  mavenCentral()
}

// Configure Gradle IntelliJ Plugin
// Read more: https://plugins.jetbrains.com/docs/intellij/tools-gradle-intellij-plugin.html
intellij {
  version.set("2022.2.5")
  type.set("IC") // Target IDE Platform

  plugins.set(listOf(/* Plugin Dependencies */))
}

tasks {
  // Set the JVM compatibility versions
  withType<JavaCompile> {
    sourceCompatibility = "17"
    targetCompatibility = "17"
  }
  withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions.jvmTarget = "17"
  }

  patchPluginXml {
    sinceBuild.set("222")
    untilBuild.set("232.*")
  }

  signPlugin {
    certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
    privateKey.set(System.getenv("PRIVATE_KEY"))
    password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
  }

  publishPlugin {
    token.set(System.getenv("PUBLISH_TOKEN"))
  }
}
```

- Three Gradle plugins are explicitly declared:
  - The Gradle Java plugin (`java`).
  - The Kotlin Gradle plugin (`org.jetbrains.kotlin.jvm)`.
  - The Gradle IntelliJ Plugin (1.x) (`org.jetbrains.intellij`).
- The **Group** from the New Project wizard is the `project.group` value.
- The `sourceCompatibility` line is injected to enforce using Java 17 JDK to compile Java sources.
- The values of the `intellij.version` and `intellij.type` properties specify the version and type of the IntelliJ Platform to be used to build the plugin.
- The empty placeholder list for plugin dependencies.
- The values of the `patchPluginXml.sinceBuild` and `patchPluginXml.untilBuild` properties specifying the minimum and maximum versions of the IDE build the plugin is compatible with.
- The initial signPlugin and publishPlugin tasks configuration. See the Publishing Plugin With Gradle section for more information.

> Consider using the IntelliJ Platform Plugin Template which additionally provides CI setup covered with GitHub Actions.

#### Plugin Gradle Properties and Plugin Configuration File Elements

The Gradle properties `rootProject.name` and `project.group` will not, in general, match the respective plugin configuration file **plugin.xml** elements `<name>` and `<id>`. There is no IntelliJ Platform-related reason they should as they serve different functions.

The `<name>` element (used as the plugin's display name) is often the same as `rootProject.name`, but it can be more explanatory.

The `<id>` value must be a unique identifier over all plugins, typically a concatenation of the specified **Group** and **Artifact**. Please note that it is impossible to change the **<id>** of a published plugin without losing automatic updates for existing installations.

## Running a Plugin With the runIde Gradle task

Gradle projects are run from the IDE's Gradle Tool window.

### Adding Code to the Project

Before running `my_plugin`, some code can be added to provide simple functionality. See the Creating Actions tutorial for step-by-step instructions for adding a menu action.

### Executing the Plugin

The _IDE Plugin_ generator automatically creates the _Run Plugin_ run configuration that can be executed via the **Run \| Run...** action or can be found in the **Gradle** tool window under the **Run Configurations** node.

To execute the Gradle `runIde` task directly, open the **Gradle** tool window and search for the **runIde** task under the **Tasks** node. If it's not on the list, hit the re-import button in the toolbar at the top of the Gradle tool window. When the **runIde** task is visible, double-click it to execute.

To debug your plugin in a _standalone_ IDE instance, please see How to Debug Your Own IntelliJ IDEA Instance blog post.

> For more information about how to work with Gradle-based projects see the Working with Gradle in IntelliJ IDEA screencast and working with Gradle tasks in the IntelliJ IDEA help.
