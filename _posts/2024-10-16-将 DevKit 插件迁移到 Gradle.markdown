---
layout: post
title: "将 DevKit 插件迁移到 Gradle"
date:  2024-10-16 11:10:35 +0800
categories: jekyll update
permalink: /zh/Intellij/Migrating-DevKit-Plugin-to-Gradle
background: '/assets/images/banner.jpg'
language: "zh"
item: post
menu-url: /zh/Intellij
menu-title: IntelliJ平台插件SDK文档
last-url: /zh/Intellij/Plugin-GitHub-Template
last-title: 插件Github模板库
next-url: /zh/Intellij/
next-title: 
---

# 将 DevKit 插件迁移到 Gradle

> 请参阅 [改进插件 #3 – 从 DevKit 迁移到 Gradle 构建系统](https：//blog.jetbrains.com/platform/2021/12/migrating-from-devkit-to-the-gradle-build-system/？_gl=1*hwhdkr*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w) 博客文章，了解分步演练。

使用旧的 DevKit 方法创建的插件（可用于创建主题）转换为基于 Gradle 的插件项目，可以使用 **New Project** 向导围绕基于 DevKit 的现有项目创建基于 Gradle 的项目：

- 确保包含基于 DevKit 的 IntelliJ Platform 插件项目的目录（如有必要）可以完全恢复。
- 删除基于 DevKit 的项目的所有工件：
    - **.idea** 目录
    - **[modulename].iml** 文件
    - **out** 目录
- 将项目目录中已有的源文件以 Gradle 源集格式排列。
- 使用 **New Project** 向导，就像从头开始创建一个新的基于 Gradle 的插件项目一样。在 **New Project** 页面上，选择 **IDE Plugin** 生成器并设置以下值：
    - **Group** 添加到初始源代码集中的现有包中。
    - **artifact** 添加到现有插件的名称中。
    - **Name** 设置为现有插件所在的目录名称，例如，如果插件项目基目录为 **/Users/john/Projects/old_plugin**，则应为 **old_plugin。
    - **Location** 添加到插件的父目录的名称中，例如，如果插件项目基目录是 **/Users/john/Projects/old_plugin**，它应该是 **/Users/john/Projects**。
- 点击 **完成** 以创建新的基于 Gradle 的插件。
- 根据需要使用 [Gradle 源代码集](https://www.jetbrains.com/help/idea/gradle.html?_gl=1*vksceu*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w#gradle_source_sets)来[添加更多模块](https://www.jetbrains.com/help/idea/gradle.html?_gl=1*5bfm1l*_gcl_au*MTc1NjE0ODc0OC4xNzI3ODMyMzM4*_ga*MTYxMDcwNjg1NS4xNzI3ODMyMzQx*_ga_9J976DJZ68*MTcyOTA0NDA4MS4yNy4xLjE3MjkwNDQ5MzkuNTkuMC4w#gradle_add_module)。