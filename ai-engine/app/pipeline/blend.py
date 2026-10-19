from PIL import Image


def blend_subject(image: Image.Image, mask: Image.Image, target: Image.Image) -> Image.Image:
    """Alpha-composite a subject over a target frame."""
    base = target.convert("RGBA")
    subject = image.convert("RGBA")
    if subject.size != base.size:
        subject = subject.resize(base.size, Image.Resampling.LANCZOS)
    alpha = mask.convert("L").resize(base.size, Image.Resampling.LANCZOS)
    subject.putalpha(alpha)
    return Image.alpha_composite(base, subject)
