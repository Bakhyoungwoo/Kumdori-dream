from PIL import Image


def correct_color(image: Image.Image, target: Image.Image) -> Image.Image:
    """Return an RGB-compatible image.

    Histogram matching is intentionally deferred; keeping this operation
    deterministic makes the composition contract usable before CV models land.
    """
    del target
    return image.convert("RGBA")
