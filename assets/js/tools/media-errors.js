function message(error, en) {
    const values = {
        empty: ['请输入二维码内容。', 'Enter QR content.'],
        text: ['内容包含无效的 Unicode 字符，请重新输入。', 'The content contains invalid Unicode. Re-enter the text.'],
        length: ['内容最多为 2000 个 UTF-8 字节，请缩短后重试。', 'Content is limited to 2000 UTF-8 bytes.'],
        capacity: ['该纠错等级无法容纳这些内容，请缩短内容或降低纠错等级。', 'Content exceeds this correction level. Shorten it or use a lower level.'],
        size: ['图片尺寸太小，请选择更大的二维码尺寸。', 'Choose a larger QR image size for this content.'],
        bytes: ['图片不能超过 20 MiB。', 'Images must be no larger than 20 MiB.'],
        pixels: ['图片最长边不能超过 8192 像素，总像素不能超过 1600 万。', 'Images are limited to 8192 pixels per side and 16 million pixels.'],
        format: ['请选择 PNG、JPEG 或 WebP 图片。', 'Choose a PNG, JPEG, or WebP image.'],
        animated: ['暂不支持动画图片，请先导出一张静态图片。', 'Animated images are not supported. Export a still image first.'],
        width: ['请输入范围内的整数宽度；输出不放大图片，最长边不超过 4096 像素。', 'Enter a whole-number width within the shown range. No upscaling; the longest output side is limited to 4096 pixels.'],
        options: ['请检查质量或背景颜色设置。', 'Check the quality and background color.'],
        unsupported: ['当前浏览器不支持这项处理或输出格式。', 'This browser does not support this operation or output format.'],
        timeout: ['处理超时，请缩短内容或裁剪图片后再试。', 'Processing timed out. Shorten the content or crop the image and try again.'],
        unavailable: ['暂时无法加载处理组件，请联网后重试。', 'Processing could not load. Reconnect and try again.'],
        invalid: ['无法处理该图片，请检查文件是否完整。', 'The image could not be processed. Check that the file is valid.'],
    };
    return (values[error?.message] || values.invalid)[en ? 1 : 0];
}
module.exports = { message };
