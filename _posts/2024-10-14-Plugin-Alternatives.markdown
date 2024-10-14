---
layout: post
title: "Plugin Alternatives"
date: 2024-10-14 10:35:00 +0800
categories: jekyll update
permalink: /Intellij/Plugin-Alternatives
background: '/assets/images/banner.jpg'
language: "en"
item: post
menu-url: /Intellij
menu-title: IntelliJ Platform Plugin SDK
last-url: /Intellij/Quick-Start-Guide
last-title: Quick Start Guide
---

# Alternatives to Implementing a Plugin

In some cases, implementing an actual IntelliJ Platform plugin can be overkill, and using one of the alternative approaches listed below may provide you with the required value in a much shorter time. If you need a functionality that is specific to your project domain, conventions, or practices, you can avoid all the steps that are required to implement and publish a plugin and provide these features as a part of your project or IDE configuration files.

Before you start the IntelliJ Platform plugin development, define your requirements and verify if they can be covered with any of the alternatives described below. Consider implementing an actual plugin only when the described solutions are insufficient in your case and there is a significant number of developers who can benefit from it.

## Structural Search and Replace Inspections

The Structural Search and Replace (SSR) functionality allows defining search patterns which are based not only on textual information but also on the structure of the searched code fragments, no matter how it is formatted or commented. The SSR templates can be used for creating custom inspections, which can be an alternative for programmatic code inspections. Depending on requirements, an inspection can report an issue for a code fragment matching a given template, but also provide a quick fix replacing the reported fragment with the configured replacement template. All inspection metadata like name, problem tooltip, and description are configurable. A single inspection can use multiple search and replacement templates.

Once SSR inspections are created and configured, they can be shared with other team members via inspection profiles.

SSR inspections can be created only for languages providing SSR support. To verify if a given language supports SSR, invoke the **Edit \| Find \| Search Structurally...** action in an IDE supporting the language, and check if it is present in the **Language** select list.

> See the I(J)nspector blog for practical SSR templates examples.

## IDE Scripting Console

The IDE scripting console can be used for automating IDE's features and extracting required information, e.g., about a current project. Scripts can access the IntelliJ Platform APIs and can be implemented in Kotlin, JavaScript, or Groovy by default, but it is also possible to use other languages compliant with the JCR-223 specification.

Created scripts are stored in the IDE configuration directory and can't be shared as part of project files or configuration.

## Flora Plugin

The Flora plugin allows for developing project-specific extensions as Kotlin Script **(*.kts)** or JavaScript **(*.js)** files. Flora extensions have access to all available IntelliJ Platform APIs, just like a regular plugin.

Every extension is represented by a single file and stored directly in a project's **.plugins** directory. Extensions can be easily shared with other team members by adding the **.plugins** directory to VCS. Also, adding the Flora plugin in the **Settings \| Build, Execution, Deployment \| Required Plugins** and sharing this configuration as part of a project makes it effortless to deliver additional IDE functionalities to your team without any manual setup.

> Please note that the Flora plugin is in an experimental state.

## LivePlugin

The LivePlugin allows for extending IntelliJ-based IDEs functionalities at the runtime, without the need of restarting IDE. It adds a new **Plugins** tool window that lists all available extensions and allows managing them. Extensions can be implemented in Kotlin or Groovy and edited directly in the IDE. Extensions can use all IntelliJ Platform APIs and additional LivePlugin API that shorten common use cases.

Created extensions are stored on the IDE level and can be shared with other team members as plain files, GitHub gists, or repositories. Additionally, if they are stored in a project's **.live-plugins** directory and LivePlugin's **Run Project Specific Plugins** option is enabled, all extensions from this directory will be loaded automatically when the project is opened and unloaded when the project is closed.

> See the LivePlugin description, presentation, and extensions examples for more information.

## PhpStorm Advanced Metadata

PhpStorm supports special metadata files describing the behavior of methods and functions. This information is used for using the existing IDE features such as code completion, navigation, finding usages, and others. The metadata files can be part of project files, which makes it easy to share it between team members via version control.
