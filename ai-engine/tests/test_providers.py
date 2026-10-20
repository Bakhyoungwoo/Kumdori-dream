import sys

import pytest

from app.config import settings
from app.pipeline.providers import (
    ProviderConfigurationError,
    build_final_prompt,
    generate_image,
    _schema,
    plan_prompt,
)


@pytest.mark.asyncio
async def test_prompt_plan_fallback_is_available_without_openai_key():
    result = await plan_prompt("warm portrait")

    assert result.scene == "warm portrait"
    assert "warm portrait" in result.image_prompt


@pytest.mark.asyncio
async def test_image_provider_reports_missing_sdk(monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setitem(sys.modules, "openai", None)

    with pytest.raises((ProviderConfigurationError, RuntimeError)):
        await generate_image("test", [("input.png", b"not-an-image")], 1)


def test_final_prompt_contains_identity_constraints():
    from app.pipeline.providers import PromptPlan

    prompt = build_final_prompt(PromptPlan(image_prompt="warm portrait"), "IMAGE")

    assert "preserve the person's identity" in prompt
    assert "first supplied subject image is the identity reference" in prompt
    assert "never invent or substitute another person" in prompt
    assert "same camera viewpoint" in prompt
    assert "physically" in prompt
    assert "contact shadows" in prompt


def test_final_prompt_keeps_original_user_request():
    from app.pipeline.providers import PromptPlan

    prompt = build_final_prompt(
        PromptPlan(image_prompt="neutral portrait"),
        "IMAGE",
        "꿈돌이와 산책하는 사진을 만들어줘",
    )

    assert "User's original request (must be followed exactly)" in prompt
    assert "꿈돌이와 산책하는 사진을 만들어줘" in prompt
    assert prompt.index("꿈돌이와 산책하는 사진을 만들어줘") < prompt.index("neutral portrait")


def test_openai_schema_is_strict_and_closed():
    schema = _schema()

    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == set(schema["properties"])
