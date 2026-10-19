from functools import lru_cache

from PIL import Image

from app.config import settings


@lru_cache(maxsize=1)
def _pose_detector():
    import mediapipe as mp

    return mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=0,
        enable_segmentation=False,
        min_detection_confidence=settings.pose_min_detection_confidence,
    )


def detect_subject_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    """Detect a visible person bbox in pixels using MediaPipe Pose."""
    if not settings.pose_landmarks_enabled:
        return None
    try:
        import numpy as np

        rgb = np.asarray(image.convert("RGB"))
        result = _pose_detector().process(rgb)
        if not result.pose_landmarks:
            return None
        points = [
            landmark
            for landmark in result.pose_landmarks.landmark
            if landmark.visibility >= settings.pose_min_landmark_visibility
        ]
        if len(points) < 2:
            return None
        width, height = image.size
        xs = [point.x for point in points]
        ys = [point.y for point in points]
        left = max(0.0, min(xs) - settings.pose_bbox_padding)
        top = max(0.0, min(ys) - settings.pose_bbox_padding)
        right = min(1.0, max(xs) + settings.pose_bbox_padding)
        bottom = min(1.0, max(ys) + settings.pose_bbox_padding)
        return (
            round(left * width),
            round(top * height),
            max(1, round((right - left) * width)),
            max(1, round((bottom - top) * height)),
        )
    except Exception:
        return None
