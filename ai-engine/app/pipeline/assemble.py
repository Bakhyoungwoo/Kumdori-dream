from PIL import Image


def assemble_frame(images: list[Image.Image], frame: Image.Image) -> Image.Image:
    """Composite processed layers in list order over the frame."""
    result = frame.convert("RGBA")
    for image in images:
        layer = image.convert("RGBA")
        if layer.size != result.size:
            layer = layer.resize(result.size, Image.Resampling.LANCZOS)
        result = Image.alpha_composite(result, layer)
    return result
