from typing import Literal, TypedDict


class ComposeState(TypedDict, total=False):
    job_id: str
    user_id: str
    media_type: Literal["IMAGE", "VIDEO"]
    pipeline_type: Literal["CV", "GENERATIVE"]
    # Kafka payload uses inputs[].userImageKey. input_keys is the normalized form.
    inputs: list[dict]
    input_keys: list[str]
    reference_image_keys: list[str]
    frame_key: str
    frame_id: str
    frame_manifest: dict
    alignment: dict
    requirement_text: str | None
    image_count: int
    result_prompt: str
    prompt_plan: dict
    normalized_keys: list[str]
    quality_report: dict
    vision_features: dict
    generation_spec: dict
    generation_mode: str
    current_step: str
    progress: int
    result_keys: list[str]
    thumbnail_key: str | None
    error_code: str | None
    error_message: str | None
