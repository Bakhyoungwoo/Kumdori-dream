from __future__ import annotations

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def render_prompt_variant(image: Image.Image, prompt: str, index: int = 0) -> Image.Image:
    """Apply deterministic prompt-controlled styling for the local MVP."""
    text = prompt.lower()
    result = image.convert("RGB")
    if any(word in text for word in ("흑백", "monochrome", "black and white", "black-white")):
        result = ImageOps.grayscale(result).convert("RGB")
    if any(word in text for word in ("따뜻", "warm", "sunset", "노을")):
        red, green, blue = result.split()
        result = Image.merge("RGB", (red, green.point(lambda value: min(255, value + 5)), blue.point(lambda value: max(0, value - 12))))
    if any(word in text for word in ("차가운", "cool", "blue", "파란")):
        red, green, blue = result.split()
        result = Image.merge("RGB", (red.point(lambda value: max(0, value - 10)), green, blue.point(lambda value: min(255, value + 12))))
    if any(word in text for word in ("밝", "bright", "light")):
        result = ImageEnhance.Brightness(result).enhance(1.18)
    if any(word in text for word in ("선명", "vivid", "cinematic", "시네마")):
        result = ImageEnhance.Contrast(result).enhance(1.2)
        result = ImageEnhance.Color(result).enhance(1.15)
    if any(word in text for word in ("부드럽", "soft", "dreamy", "몽환")):
        result = result.filter(ImageFilter.GaussianBlur(0.45))
    if index:
        result = ImageEnhance.Color(result).enhance(1 + min(index, 3) * 0.04)
    return result.convert("RGBA")
