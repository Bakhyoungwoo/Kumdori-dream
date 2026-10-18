import pytest

from app.graph import compose_graph


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
