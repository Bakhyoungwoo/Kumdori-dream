from __future__ import annotations

from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

import cv2
import numpy as np
from PIL import Image

from app.pipeline.cv import compose_subject
from app.pipeline.generative import render_prompt_variant


def _write_bytes(path: Path, content: bytes) -> None:
    path.write_bytes(content)


def compose_video(
    subject: Image.Image,
    background: bytes,
    output: Path,
    alignment: dict | None = None,
    fps: float = 24.0,
    duration_seconds: float = 3.0,
    prompt: str = "",
) -> dict[str, int | float]:
    """Compose a subject over either an input video or a still image.

    A still background creates a short MP4, which makes the pipeline usable
    before frame templates are available as videos. Video backgrounds keep
    their original frame size and frame rate where possible.
    """
    with NamedTemporaryFile(suffix=".mp4", delete=False) as source_file:
        source_path = Path(source_file.name)
        _write_bytes(source_path, background)

    capture = cv2.VideoCapture(str(source_path))
    capture_opened = capture.isOpened()
    if capture_opened:
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        source_fps = capture.get(cv2.CAP_PROP_FPS)
        fps = source_fps if source_fps and source_fps > 1 else fps
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        is_video = frame_count > 0 and width > 0 and height > 0
    else:
        image = Image.open(BytesIO(background)).convert("RGBA")
        width, height = image.size
        frame_count = max(1, round(fps * duration_seconds))
        is_video = False

    if not is_video:
        capture.release()
        image = Image.open(BytesIO(background)).convert("RGBA")
        width, height = image.size
        frame_count = max(1, round(fps * duration_seconds))

    if width <= 0 or height <= 0:
        capture.release()
        source_path.unlink(missing_ok=True)
        raise ValueError("video background has invalid dimensions")

    output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )
    if not writer.isOpened():
        capture.release()
        source_path.unlink(missing_ok=True)
        raise RuntimeError("unable to create MP4 writer")

    written = 0
    try:
        for index in range(frame_count):
            if is_video:
                ok, frame = capture.read()
                if not ok:
                    break
                background_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA))
            else:
                background_image = image

            result = compose_subject(subject, background_image, alignment)
            if prompt:
                result = render_prompt_variant(result, prompt, index % 4)
            bgr = cv2.cvtColor(np.asarray(result.convert("RGB")), cv2.COLOR_RGB2BGR)
            writer.write(bgr)
            written += 1
    finally:
        writer.release()
        capture.release()
        source_path.unlink(missing_ok=True)

    if written == 0:
        output.unlink(missing_ok=True)
        raise ValueError("video background contains no frames")
    return {"width": width, "height": height, "fps": fps, "frame_count": written}
