---
layout: post
title: "Plugin Types"
date: 2024-10-14 16:20:22 +0800
categories: jekyll update
permalink: /Intellij/Plugin-types
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Required-Experience
last-title: Required Experience
next-url: /Intellij/Developing-a-Plugin
next-title: Developing a Plugin
---

# Plugin Types

Products based on the IntelliJ Platform can be modified and adjusted for custom purposes by adding plugins. All downloadable plugins are available from the JetBrains Marketplace.

The most common types of plugins include:

- ustom language support
- Framework integration
- Tool integration
- User interface add-ons
- Themes

> Plugin Alternatives
> 
> In some cases, implementing an actual IntelliJ Platform plugin might not be necessary, as alternative solutions exist.

## Custom Language Support

Custom language support provides basic functionality for working with a particular programming language, that includes:

- File type recognition
- Lexical analysis
- Syntax highlighting
- Formatting
- Code insight and code completion
- Inspections and quick fixes
- Intention actions

Plugins can also augment existing (bundled) custom languages, e.g., by providing additional inspections, intentions, or any other features.

Refer to the Custom Language Support Tutorial to learn more about the topic.

## Framework Integration

Framework integration consists of improved code insight features, which are typical for a given framework, as well as the option to use framework-specific functionality directly from the IDE. Sometimes it also includes language support elements for a custom syntax or DSL.

- Specific code insight
- Direct access to framework-specific functionality

Refer to the IntelliJ-HCL as an example of framework integration. More reference plugins can be found on JetBrains Marketplace.

## Tool Integration

Tool integration makes it possible to manipulate third-party tools and components directly from the IDE without switching contexts, that implies:

- Implementation of additional actions
- Related UI components
- Access to external resources

Refer to the Gerrit integration plugin as an example.

## User Interface Add-Ons

Plugins in this category apply various changes to the standard user interface of the IDE. Some newly added components are interactive and provide new functionality, while others are limited to visual modifications only. The Foldable ProjectView plugin may serve as an example.

## Themes

Themes give designers the ability to customize the appearance of built-in IDE UI elements.
