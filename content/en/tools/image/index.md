---
title: "Image Compressor and Resizer"
description: "Resize images and adjust quality locally, export JPEG or WebP, and compare dimensions and file sizes."
date: 2026-09-09T00:00:00+08:00
layout: page
category: conversion
keywords: [image, resize, compress]
tool_related: [qrcode, color]
---

Choose one image, reduce its dimensions proportionally, and adjust output quality. All processing stays in your browser; the image is not uploaded.

{{< tool id="image" >}}

### Examples and limits

Setting a 1200 × 800 image's output width to 600 produces 600 × 400 pixels. JPEG fills transparent regions with your chosen background; WebP can preserve transparency.

Input supports static PNG, JPEG, and WebP, up to 20 MiB, 8192 pixels per side, and 16 million pixels. Output never upscales and is limited to a longest side of 4096 pixels. Animation, SVG, GIF, and batch processing are not supported.

The browser re-encodes the decoded, oriented image without preserving the original EXIF and other attached metadata. Encoding may differ between browsers. An already optimized small image can become larger, so compare the displayed file sizes before downloading.

### How to use

1. Select an image and inspect its dimensions and preview.
2. Enter the target width; height follows the original ratio. Choose format and quality.
3. For JPEG, confirm the background color, then process the image.
4. Compare and download the result. Changing settings requires processing again so the download matches your choices.
