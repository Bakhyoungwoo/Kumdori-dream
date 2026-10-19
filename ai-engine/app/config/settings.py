from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic: str = "compose.request"
    kafka_group_id: str = "ourcut-ai-engine"
    core_api_url: str = "http://localhost:8080"
    ai_engine_secret: str = "change-me"
    storage_root: str = ".data/objects"
    kafka_enabled: bool = False
    callback_timeout_seconds: float = 10.0
    callback_max_retries: int = 3
    segmentation_backend: str = "fallback"
    segmentation_model: str = "u2net_human_seg"
    segmentation_alpha_matting: bool = False
    segmentation_foreground_threshold: int = 240
    segmentation_background_threshold: int = 10
    segmentation_erode_size: int = 10
    pose_landmarks_enabled: bool = True
    pose_min_detection_confidence: float = 0.5
    pose_min_landmark_visibility: float = 0.5
    pose_bbox_padding: float = 0.08
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    prompt_model: str = "gpt-4.1-mini"
    image_model: str = "gpt-image-2.5-sunburst"
    video_model: str = "veo-3.1-generate-preview"
    image_provider: str = "openai"
    video_provider: str = "google"
    image_quality: str = "high"
    image_size: str = "1024x1024"
    video_duration_seconds: int = 8
    video_aspect_ratio: str = "9:16"
    video_generate_audio: bool = True
    generation_timeout_seconds: float = 300.0


settings = Settings()
