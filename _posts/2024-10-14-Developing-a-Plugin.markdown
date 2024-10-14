---
layout: post
title: "Developing a Plugin"
date: 2024-10-14 17:02:44 +0800
categories: jekyll update
permalink: /Intellij/Developing-a-Plugin
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Plugin-Types
last-title: Plugin Types
next-url: /Intellij/
next-title: 
---

# Developing a Plugin

IntelliJ Platform plugins can be developed by using either IntelliJ IDEA Community Edition or IntelliJ IDEA Ultimate as your IDE. It is highly recommended to always use the latest available version, as the plugin development tooling support from _Plugin DevKit_ continues supporting new features.

Before starting with the actual development, make sure to understand all requirements to achieve best Plugin User Experience (UX).

> ##### Plugin Alternatives
> 
> In some cases, implementing an actual IntelliJ Platform plugin might not be necessary, as alternative solutions exist.

## Gradle Plugin

The recommended solution for building IntelliJ Platform plugins is using Gradle with a dedicated Gradle plugin: IntelliJ Platform Gradle Plugin (2.x) or Gradle IntelliJ Plugin (1.x).

> ##### Gradle Plugin
> The Gradle plugin must be chosen depending on the target platform version.
>
> - 2024.2+:  Requires IntelliJ Platform Gradle Plugin (2.x)
> - 2022.3+:  Recommended IntelliJ Platform Gradle Plugin (2.x), Requires Gradle IntelliJ Plugin (1.x) version 1.10.1+ (current: 1.17.4)

The IntelliJ IDEA Ultimate and Community editions provide the necessary plugins to support Gradle-based plugin development: _Gradle and Plugin DevKit_. To verify these plugins are installed and enabled, see the help section about Managing Plugins.

_Plugin DevKit_ plugin is bundled with IntelliJ IDEA until 2023.2.

> ##### Plugin DevKit Availability
> 
> When using IntelliJ IDEA 2023.3 or later, the _Plugin DevKit_ plugin must be installed from JetBrains Marketplace (Plugin Homepage) as it is no longer bundled with the IDE.
    
The Gradle plugin manages the dependencies of a plugin project – both the base IDE and other plugin dependencies. It provides tasks to run the IDE with your plugin and to package and publish your plugin to the JetBrains Marketplace. To make sure that a plugin is not affected by API changes, which may happen between major releases of the platform, you can quickly verify your plugin against other IDEs and releases.

There are two main ways of creating a new Gradle-based IntelliJ Platform plugin project:

- dedicated generator available in the New Project Wizard – it creates a minimal plugin project with all the required files
- IntelliJ Platform Plugin Template available on GitHub – in addition to the required project files, it includes configuration of the GitHub Actions CI workflows

This documentation section describes the plugin structure generated with the **New Project** wizard, but the project generated with _IntelliJ Platform Plugin Template_ covers all the described files and directories. See IntelliJ Platform Plugin Template for more information about the advantages of this approach and instructions on how to use it.

### Alternatives

The old DevKit project model and workflow are still supported in existing projects and are recommended for creating theme plugins. See how to migrate a DevKit plugin to Gradle.

A dedicated SBT plugin is available for plugins implemented in Scala.

## Plugin Development Workflow

- Creating a Gradle-based Plugin Project
- Configuring the Gradle IntelliJ Plugin
  - Adding Kotlin Support
- Publishing a Plugin