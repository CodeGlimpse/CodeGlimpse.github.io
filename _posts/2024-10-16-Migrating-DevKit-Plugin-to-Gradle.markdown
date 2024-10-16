---
layout: post
title: "Migrating DevKit Plugin to Gradle"
date: 2024-10-16 10:15:55 +0800
categories: jekyll update
permalink: /Intellij/Migrating-DevKit-Plugin-to-Gradle
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Plugin-GitHub-Template
last-title: Plugin GitHub Template
next-url: /Intellij/Configuring-Gradle-IntelliJ-Plugin
next-title: Configuring Gradle IntelliJ Plugin
---

# Migrating DevKit Plugin to Gradle

> See [Revamping Plugins #3 – Migrating from DevKit to the Gradle build system](https://blog.jetbrains.com/platform/2021/12/migrating-from-devkit-to-the-gradle-build-system/?_gl=1*hwhdkr*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w) blog post for a step-by-step walk-through.

Converting a plugin created with the old DevKit approach (which can be used for creating themes) to a Gradle-based plugin project can be done using the **New Project** wizard to create a Gradle-based project around the existing DevKit-based project:

- Ensure the directory containing the DevKit-based IntelliJ Platform plugin project can be fully recovered if necessary.
- Delete all the artifacts of the DevKit-based project:
  - **.idea** directory
  - **[modulename].iml** file
  - **out** directory
- Arrange the existing source files within the project directory in the Gradle source set format.
- Use the **New Project** wizard as though creating a new Gradle-based plugin project from scratch. On the **New Project** page choose the **IDE Plugin** generator and set the values of:
  - **Group** to the existing package in the initial source set.
  - **Artifact** to the name of the existing plugin.
  - **Name** to the name of the directory where the existing plugin is located, e.g. if the plugin project base directory is **/Users/john/Projects/old_plugin**, it should be the **old_plugin**.
  - **Location** to the name of the plugin's parent directory, e.g. if the plugin project base directory is **/Users/john/Projects/old_plugin**, it should be the **/Users/john/Projects**.
- Click **Finish** to create the new Gradle-based plugin.
- [Add more modules](https://www.jetbrains.com/help/idea/gradle.html?_gl=1*1mmbmcz*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w#gradle_add_module) using Gradle [source sets](https://www.jetbrains.com/help/idea/gradle.html?_gl=1*1dabiws*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w#gradle_source_sets) as needed.

