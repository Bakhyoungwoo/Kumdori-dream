import pytest
from PIL import Image

from app.graph import compose_graph
from app.integration.storage import object_storage


@pytest.mark.asyncio
async def test_cv_graph_reaches_completed_state():
    result = await compose_graph.ainvoke(
        {
            "job_id": "job-1",
            "media_type": "IMAGE",
            "pipeline_type": "CV",
            "input_keys": ["uploads/job-1/input.png"],
        }
    )

    assert result["current_step"] == "COMPLETED"
    assert result["progress"] == 100


@pytest.mark.asyncio
async def test_core_api_payload_is_normalized():
    result = await compose_graph.ainvoke(
        {
            "job_id": "job-2",
            "user_id": "user-1",
            "pipeline_type": "CV",
            "inputs": [{"slotIndex": 0, "userImageKey": "uploads/job-2/input.png"}],
        }
    )

    assert result["input_keys"] == ["uploads/job-2/input.png"]
    assert result["media_type"] == "IMAGE"
    assert result["current_step"] == "COMPLETED"


@pytest.mark.asyncio
async def test_generative_pipeline_requires_requirement_text():
    with pytest.raises(ValueError, match="requirement_text is required"):
        await compose_graph.ainvoke(
            {
                "job_id": "job-3",
                "pipeline_type": "GENERATIVE",
                "inputs": [{"slotIndex": 0, "userImageKey": "uploads/job-3/input.png"}],
            }
        )


@pytest.mark.asyncio
async def test_cv_graph_processes_and_persists_real_image(tmp_path):
    object_storage.root = tmp_path
    source = tmp_path / "uploads" / "job-real" / "input.png"
    source.parent.mkdir(parents=True)
    Image.new("RGBA", (12, 8), (220, 30, 30, 255)).save(source)

    result = await compose_graph.ainvoke(
        {
            "job_id": "job-real",
            "media_type": "IMAGE",
            "pipeline_type": "CV",
            "input_keys": ["uploads/job-real/input.png"],
        }
    )

    assert result["result_keys"] == ["results/job-real/result.png"]
    assert result["thumbnail_key"] == "results/job-real/thumbnail.jpg"
    assert (tmp_path / "results" / "job-real" / "result.png").exists()
    assert (tmp_path / "results" / "job-real" / "thumbnail.jpg").exists()


@pytest.mark.asyncio
async def test_video_graph_creates_mp4_and_thumbnail(tmp_path):
    object_storage.root = tmp_path
    source = tmp_path / "uploads" / "job-video" / "input.png"
    source.parent.mkdir(parents=True)
    Image.new("RGBA", (24, 16), (30, 80, 220, 255)).save(source)

    result = await compose_graph.ainvoke(
        {
            "job_id": "job-video",
            "media_type": "VIDEO",
            "pipeline_type": "CV",
            "input_keys": ["uploads/job-video/input.png"],
        }
    )

    assert result["result_keys"] == ["results/job-video/result.mp4"]
    assert result["thumbnail_key"] == "results/job-video/thumbnail.jpg"
    assert (tmp_path / "results" / "job-video" / "result.mp4").stat().st_size > 0
    assert (tmp_path / "results" / "job-video" / "thumbnail.jpg").exists()


@pytest.mark.asyncio
async def test_generative_mvp_creates_image_result(tmp_path):
    object_storage.root = tmp_path
    source = tmp_path / "uploads" / "job-generative" / "input.png"
    source.parent.mkdir(parents=True)
    Image.new("RGBA", (12, 8), (220, 30, 30, 255)).save(source)

    result = await compose_graph.ainvoke(
        {
            "job_id": "job-generative",
            "pipeline_type": "GENERATIVE",
            "requirement_text": "warm studio portrait",
            "inputs": [{"slotIndex": 0, "userImageKey": "uploads/job-generative/input.png"}],
        }
    )

    assert result["generation_mode"] == "PROMPTED_LOCAL_MVP"
    assert result["result_prompt"] == "warm studio portrait"
    assert result["result_keys"] == ["results/job-generative/result-1.png"]


@pytest.mark.asyncio
async def test_generative_mvp_honors_prompt_and_output_count(tmp_path):
    object_storage.root = tmp_path
    source = tmp_path / "uploads" / "job-generative-many" / "input.png"
    source.parent.mkdir(parents=True)
    Image.new("RGBA", (12, 8), (220, 30, 30, 255)).save(source)

    result = await compose_graph.ainvoke(
        {
            "job_id": "job-generative-many",
            "pipeline_type": "GENERATIVE",
            "requirement_text": "bright vivid cinematic portrait",
            "image_count": 3,
            "input_keys": ["uploads/job-generative-many/input.png"],
        }
    )

    assert len(result["result_keys"]) == 3
    assert all((tmp_path / key).exists() for key in result["result_keys"])
