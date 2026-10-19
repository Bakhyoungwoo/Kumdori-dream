from PIL import Image
from PIL import ImageOps

from app.pipeline.landmarks import detect_subject_bbox


def _rect(value: object, size: tuple[int, int]) -> tuple[int, int, int, int] | None:
    """Normalize a bbox from either pixels or 0..1 coordinates."""
    if not isinstance(value, (list, tuple)) or len(value) != 4:
        return None
    try:
        x, y, width, height = (float(item) for item in value)
    except (TypeError, ValueError):
        return None
    if max(abs(x), abs(y), abs(width), abs(height)) <= 1:
        x, width = x * size[0], width * size[0]
        y, height = y * size[1], height * size[1]
    return (max(0, round(x)), max(0, round(y)), max(1, round(width)), max(1, round(height)))


def _fit_into(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    """Contain an image inside a destination box without stretching it."""
    _, _, width, height = box
    return ImageOps.contain(image, (width, height), Image.Resampling.LANCZOS)


def align_subject(image: Image.Image, target: Image.Image, landmarks: dict | None = None) -> Image.Image:
    """Fit a subject to the target canvas using optional frame landmarks.

    ``landmarks`` may contain ``subject_bbox`` and ``target_bbox`` as
    ``[x, y, width, height]`` in pixels or normalized 0..1 coordinates.
    With no landmarks the subject is contained and centered as before.
    """
    source = image.convert("RGBA")
    # Transparent uploads often contain a large canvas around the person.
    # Remove that padding before fitting so the visible subject gets the
    # available frame area instead of being scaled down by empty pixels.
    if landmarks is None:
        alpha_bbox = source.getchannel("A").getbbox() if "A" in image.getbands() else None
        if alpha_bbox and alpha_bbox != (0, 0, source.width, source.height):
            source = source.crop(alpha_bbox)
        elif "A" not in image.getbands():
            pose_bbox = detect_subject_bbox(source)
            if pose_bbox:
                left, top, width, height = pose_bbox
                source = source.crop(
                    (left, top, min(source.width, left + width), min(source.height, top + height))
                )
    canvas = Image.new("RGBA", target.size, (0, 0, 0, 0))
    if not landmarks:
        fitted = ImageOps.contain(source, target.size, Image.Resampling.LANCZOS)
        offset = ((target.width - fitted.width) // 2, (target.height - fitted.height) // 2)
        canvas.alpha_composite(fitted, offset)
        return canvas

    source_box = _rect(landmarks.get("subject_bbox"), source.size)
    target_box = _rect(landmarks.get("target_bbox"), target.size)
    if target_box is None:
        target_box = (0, 0, target.width, target.height)
    if source_box:
        left, top, width, height = source_box
        source = source.crop((left, top, min(source.width, left + width), min(source.height, top + height)))

    fitted = _fit_into(source, target_box)
    target_x, target_y, target_width, target_height = target_box
    offset = (
        target_x + (target_width - fitted.width) // 2,
        target_y + (target_height - fitted.height) // 2,
    )
    canvas.alpha_composite(fitted, offset)
    return canvas
