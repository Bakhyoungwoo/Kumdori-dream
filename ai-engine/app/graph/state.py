from typing import Literal, TypedDict


class ComposeState(TypedDict, total=False):
    job_id: str
    user_id: str
    media_type: Literal["IMAGE", "VIDEO"]
    pipeline_type: Literal["CV", "GENERATIVE"]
    input_keys: list[str]
    reference_image_keys: list[str]
    frame_id: str
    frame_manifest: dict
    requirement_text: str | None
    normalized_keys: list[str]
    quality_report: dict
    vision_features: dict
    generation_spec: dict
    current_step: str
    progress: int
    result_keys: list[str]
    thumbnail_key: str | None
    error_code: str | None
    error_message: str | None
