---
layout: post
title: "Configuring Kotlin Support"
date: 2024-10-17 16:17:50 +0800
categories: jekyll update
permalink: /Intellij/Configuring-Kotlin-Support
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Configuring-Gradle-IntelliJ-Plugin
last-title: Configuring Gradle IntelliJ Plugin
next-url: /Intellij/
next-title: 
---

# Configuring Kotlin Support

> Homepage: [Kotlin](https://kotlinlang.org/?_gl=1*6684a6*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTE1MzAzNC4zMy4xLjE3MjkxNTMwNDAuNTQuMC4w)
> Project Template: [IntelliJ Platform Plugin Template](/Intellij/Plugin-GitHub-Template)

This page describes developing plugins using the Kotlin programming language.

> ##### Operating on Kotlin code
> To implement a plugin _operating_ on Kotlin code in the IDE, configure Kotlin plugin dependency (`org.jetbrains.kotlin`).
> See also UAST on how to support multiple JVM languages, including Kotlin.

## Advantages of Developing a Plugin in Kotlin

Using Kotlin to write plugins for the IntelliJ Platform is very similar to writing plugins in Java. Existing Java classes can be converted to their Kotlin equivalents by using the J2K converter (part of Kotlin plugin).

In addition to null safety, type-safe builders, and Kotlin Coroutines, the Kotlin language offers many convenient features for plugin development, which make plugins easier to read and simpler to maintain. Much like Kotlin for Android, the IntelliJ Platform makes extensive use of callbacks, which are straightforward to express as lambdas in Kotlin.

Kotlin classes can be mixed in a project with existing Java code. This might come handy when certain APIs require the use of mentioned Kotlin Coroutines.

### Adding Extensions

Likewise, it is possible to customize the behavior of internal classes in the IntelliJ Platform using extensions. For example, it is common practice to guard logging statements to avoid the cost of parameter construction, leading to the following ceremony when using the log:

```
if(logger.isDebugEnabled()){
    logger.

debug("..."+expensiveComputation());
    }
```

We can achieve the same result more succinctly in Kotlin, by declaring the following extension method:

```
inline fun Logger.debug(lazyMessage: () -> String) {
  if (isDebugEnabled) {
    debug(lazyMessage())
  }
}
```

Now we can directly write:

```
logger.debug { "..." + expensiveComputation() }
```

to receive all the benefits of lightweight logging while reducing the code verbosity.

With practice, you will be able to recognize many idioms in the IntelliJ Platform that can be simplified with Kotlin.

### UI Forms in Kotlin

The IntelliJ Platform provides a type safe DSL to build UI forms in a declarative way.

> Using UI Designer plugin with Kotlin is not supported

### Kotlin Coroutines

Kotlin Coroutines are a lightweight and easy to implement alternative to threads with many advantages.

## Adding Kotlin Support

> The IntelliJ Platform Plugin Template provides a preconfigured project using Kotlin.

IntelliJ IDEA bundles the necessary Kotlin plugin, requiring no further configuration. For detailed instructions, please refer to the Kotlin documentation.

### Kotlin Gradle Plugin

Adding Kotlin source files compilation support to the Gradle-based project requires adding and configuring the Kotlin JVM Gradle plugin.

See the **build.gradle.kts** from kotlin_demo sample plugin using Gradle IntelliJ Plugin (1.x):

```
plugins {
  id("java")
  id("org.jetbrains.intellij") version "1.17.4"
  id("org.jetbrains.kotlin.jvm") version "1.9.25"
}

group = "org.intellij.sdk"
version = "2.0.0"

repositories {
  mavenCentral()
}

java {
  sourceCompatibility = JavaVersion.VERSION_17
}

// See https://plugins.jetbrains.com/docs/intellij/tools-gradle-intellij-plugin.html
intellij {
  version.set("2023.3.7")
}

tasks {
  buildSearchableOptions {
    enabled = false
  }

  patchPluginXml {
    version.set("${project.version}")
    sinceBuild.set("233")
    untilBuild.set("242.*")
  }

  compileKotlin {
    kotlinOptions.jvmTarget = "17"
  }

  compileTestKotlin {
    kotlinOptions.jvmTarget = "17"
  }
}
```

### Kotlin Standard Library (stdlib)

Since Kotlin 1.4, a dependency on the standard library stdlib is added automatically (API Docs). In nearly all cases, it is not necessary to include it in the plugin distribution as the platform already bundles it.

To opt out, add this line in **gradle.properties**:

> kotlin.stdlib.default.dependency = false

#### Gradle check

The presence of this Gradle property is checked with the corresponding Gradle task:

- IntelliJ Platform Gradle Plugin (2.x) : `verifyPlugin` task
- Gradle IntelliJ Plugin (1.x) : `verifyPluginConfiguration` task

If the property is not present, a warning will be reported during the plugin configuration verification. To bundle stdlib in the plugin distribution, specify explicitly `kotlin.stdlib.default.dependency = true`.

#### stdlib – Miscellaneous

If a plugin supports multiple platform versions, it must either target the lowest bundled stdlib version (see table below) or the specific version must be provided in plugin distribution.

See Dependency on the standard library for more details.

> ##### Adding stdlib in tests
> 
> If you need to add the Kotlin Standard Library to your **test project** dependencies, see the How to test a JVM language? section.

| IntelliJ Platform version (latest update) | Bundled stdlib version |
|-------------------------------------------|------------------------|
| 2024.2                                    | 1.9.24                 |
| 2024.1                                    | 1.9.22                 |
| 2023.3                                    | 1.9.21                 |
| 2023.2                                    | 1.8.20                 |
| 2023.1                                    | 1.8.0                  |
| 2022.3                                    | 1.7.22                 |
| 2022.2                                    | 1.6.21                 |
| 2022.1                                    | 1.6.10                 |

See [here](https://www.jetbrains.com/legal/third-party-software/?_gl=1*12sybgx*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTIyOTk5MC4zNS4xLjE3MjkyMzAwMTUuMzUuMC4w) for earlier versions.

#### Kotlin Coroutines Libraries (kotlinx.coroutines)

Plugins must always use the bundled library from the target IDE and not bundle their own version. Please make sure it is not added via transitive dependencies either (see View and Debug Dependencies in Gradle user guide).

Since 2024.2, a custom fork with additional patches is bundled.

See Kotlin Coroutines on how to use them in plugins.

| IntelliJ Platform version | Bundled kotlinx-coroutines version |
|---------------------------|------------------------------------|
| 2024.2                    | 1.8.0                              |
| 2024.1                    | 1.7.3                              |

#### Other Bundled Kotlin Libraries

In general, it is strongly advised to always use the bundled library version.

Please see Third-Party Software and Licenses for an overview of all bundled libraries.

#### Incremental compilation

The Kotlin Gradle plugin supports incremental compilation, which allows tracking changes in the source files so the compiler handles only updated code.

##### Kotlin 1.9.0 and later

No action required.

Remove additional `kotlin.incremental.useClasspathSnapshot=false` property in **gradle.properties** if present.

##### Kotlin 1.8.20

> Please consider using Kotlin 1.9.0 or later where this issue has been resolved.

Kotlin `1.8.20` has a new incremental compilation approach which is enabled by default. Unfortunately, it is not compatible with the IntelliJ Platform — when reading large JAR files (like **app.jar** or **3rd-party-rt.jar**), leading to an `Out of Memory` exception:

```
Execution failed for task ':compileKotlin'.
> Failed to transform app.jar to match attributes {artifactType=classpath-entry-snapshot, org.gradle.libraryelements=jar, org.gradle.usage=java-runtime}.
   > Execution failed for ClasspathEntrySnapshotTransform: .../lib/app.jar.
      > Java heap space
```

To avoid this exception, add the following line to **gradle.properties**:

```
kotlin.incremental.useClasspathSnapshot=false
```

### Plugin Implementation Notes

#### Do not use `object` but `class`

Plugins _may_ use Kotlin classes (class keyword) to implement declarations in the plugin configuration file. When registering an extension, the platform uses a dependency injection framework to instantiate these classes at runtime. For this reason, plugins _must_ not use Kotlin objects (`object` keyword) to implement any **plugin.xml** declarations. Managing the lifecycle of extensions is the platform's responsibility and instantiating these classes as Kotlin singletons may cause issues.

A notable exception is `com.intellij.openapi.fileTypes.FileType` (`com.intellij.fileType` extension point), see also the inspection descriptions below.

Problems are highlighted via these inspections (2023.2):

- **Plugin DevKit \| Code \| Kotlin object registered as extension** for Kotlin code
- **Plugin DevKit \| Plugin descriptor \| Extension class is a Kotlin object** for **plugin.xml**

#### Do not use `companion object` in extensions

Kotlin `companion object` is always created once you try to load its containing class, and extension point implementations are supposed to be cheap to create. To avoid unnecessary classloading (and thus slowdown in IDE startup), `companion object` in extensions must only contain simple constants or logger. Anything else must be a top-level declaration or stored in an `object`.

Use inspection **Plugin DevKit \| Code \| Companion object in extensions** to highlight such problems (2023.3).

### Kotlin Code FAQ

#### Testing K2 Mode

See [Testing in K2 Locally](https://kotlin.github.io/analysis-api/testing-in-k2-locally.html).

#### Analysis API

The Analysis API is a powerful library for analyzing code in Kotlin. Built on top of the Kotlin PSI syntax tree, it provides access to various semantic information, including reference targets, expression types, declaration scopes, diagnostics, and more.

See Kotlin Analysis API Documentation for details.

#### Miscellaneous

[How to shorten references](https://intellij-support.jetbrains.com/hc/en-us/community/posts/360010025120-Add-new-parameter-into-kotlin-data-class-from-IDEA-plugin?page=1&_gl=1*a4fe17*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTIyOTk5MC4zNS4xLjE3MjkyMzAwMTUuMzUuMC4w#community_comment_360002950760)

### Example Plugins Implemented in Kotlin

There are many open-source Kotlin plugins built on the IntelliJ Platform. For a readily available source of up-to-date examples of plugins implemented in Kotlin, developers may look to these projects for inspiration:

- [TeXiFy IDEA](https://github.com/Hannah-Sten/TeXiFy-IDEA)
- [Deno](https://github.com/JetBrains/intellij-plugins/tree/idea/242.23339.11/Deno)
- [Rust](https://github.com/intellij-rust/intellij-rust)

