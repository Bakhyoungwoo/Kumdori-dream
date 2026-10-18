from PIL import Image
from PIL import ImageOps


def align_subject(image: Image.Image, target: Image.Image, landmarks: dict | None = None) -> Image.Image:
    """Fit a subject to the target canvas.

    Landmark transforms will replace this bounded resize in the vision phase.
    """
    del landmarks
    fitted = ImageOps.contain(image.convert("RGBA"), target.size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", target.size, (0, 0, 0, 0))
    offset = ((target.width - fitted.width) // 2, (target.height - fitted.height) // 2)
    canvas.alpha_composite(fitted, offset)
    return canvas
