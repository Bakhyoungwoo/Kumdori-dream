import pytest

from app.config import settings
from app.integration.storage import object_storage


@pytest.fixture(autouse=True)
def disable_external_providers_for_tests(monkeypatch):
    """Keep the default test suite deterministic and offline."""
    monkeypatch.setattr(settings, "openai_api_key", None)
    monkeypatch.setattr(settings, "gemini_api_key", None)
    monkeypatch.setattr(object_storage, "backend", "local")
    monkeypatch.setattr(object_storage, "client", None)
