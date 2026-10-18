from typing import Literal

from pydantic import BaseModel, Field


class GenerationConstraints(BaseModel):
    max_outputs: int = Field(default=1, ge=1, le=4)


class GenerationSpec(BaseModel):
    schema_version: Literal["1.0"]
    media_type: Literal["IMAGE", "VIDEO"]
    composition_mode: Literal["FRAME_COMPOSITE"]
    subjects: list[dict] = Field(default_factory=list)
    constraints: GenerationConstraints
