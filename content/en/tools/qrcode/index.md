---
title: "QR Code Generator and Reader"
description: "Generate QR codes and download PNG files, or decode a QR image locally in your browser."
date: 2026-09-09T00:00:00+08:00
layout: page
category: encoding
keywords: [qrcode, qr, encode, decode]
tool_related: [image, url]
---

Turn text or a URL into a QR code, or choose a local image to read its content.

{{< tool id="qrcode" >}}

### Examples and limits

Generate a PNG containing `你好，Fernweh 👋`, then select it in the reader to recover the original text. Processing stays in your browser: images are not uploaded, no camera is used, and decoded URLs are never opened automatically.

Content is limited to 2000 UTF-8 bytes; some characters and Emoji require multiple bytes. Correction levels L, M, Q, and H provide increasing redundancy with decreasing content capacity. Longer content may require a larger image. Crop closer to a small, blurred, or tilted code before retrying. One QR code is read per image.

Input supports static PNG, JPEG, and WebP, up to 20 MiB, 8192 pixels per side, and 16 million pixels. Large images are resized to a longest side of 1536 pixels for detection. Animated images are not supported.

### How to use

1. Enter content, select correction and size, then generate.
2. Download the PNG for printing or sharing. Any sensitive text remains encoded in that image.
3. To decode, select a local image and copy the resulting text.

The first use loads scripts from this site; a successfully cached tool can then work offline. See the [component licenses](/licenses.txt).
