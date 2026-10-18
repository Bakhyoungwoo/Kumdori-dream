from app.graph.state import ComposeState


async def validate_input(state: ComposeState) -> ComposeState:
    if not state.get("job_id"):
        raise ValueError("job_id is required")

    # The core-api payload currently carries UUIDs and inputs[].userImageKey.
    # Normalize that transport shape once at the graph boundary so downstream
    # nodes only deal with the engine's internal state shape.
    state["job_id"] = str(state["job_id"])
    if state.get("user_id") is not None:
        state["user_id"] = str(state["user_id"])

    if not state.get("input_keys"):
        state["input_keys"] = [
            item["userImageKey"]
            for item in state.get("inputs", [])
            if isinstance(item, dict) and item.get("userImageKey")
        ]
    if not state.get("input_keys"):
        raise ValueError("at least one input image is required")

    # Frame metadata is not part of the current event yet, so image is the
    # safe default. A future frame manifest can explicitly set VIDEO.
    state.setdefault("media_type", "IMAGE")
    if state.get("media_type") not in {"IMAGE", "VIDEO"}:
        raise ValueError("unsupported media_type")
    if state.get("pipeline_type") not in {"CV", "GENERATIVE"}:
        raise ValueError("unsupported pipeline_type")
    if state.get("pipeline_type") == "GENERATIVE" and not state.get("requirement_text"):
        raise ValueError("requirement_text is required for generative pipeline")
    state["current_step"] = "VALIDATING"
    state["progress"] = 10
    return state


async def preprocess_images(state: ComposeState) -> ComposeState:
    # TODO: preserve before/after artifacts and write comparison metadata.
    state["normalized_keys"] = state.get("input_keys", [])
    state["current_step"] = "PREPROCESSING"
    state["progress"] = 20
    return state


async def analyze_vision(state: ComposeState) -> ComposeState:
    # TODO: MediaPipe/OpenCV analysis.
    state["vision_features"] = {}
    state["current_step"] = "ANALYZING"
    state["progress"] = 40
    return state


async def build_spec(state: ComposeState) -> ComposeState:
    state["generation_spec"] = {
        "schema_version": "1.0",
        "media_type": state.get("media_type"),
        "composition_mode": "FRAME_COMPOSITE",
        "subjects": [],
        "constraints": {"max_outputs": 1},
    }
    state["current_step"] = "PLANNING"
    state["progress"] = 55
    return state


async def validate_spec(state: ComposeState) -> ComposeState:
    # TODO: replace with Pydantic GenerationSpec validation.
    if not state.get("generation_spec"):
        raise ValueError("generation_spec is required")
    return state


def route_pipeline(state: ComposeState) -> str:
    if state.get("media_type") == "VIDEO":
        return "video_pipeline"
    if state.get("pipeline_type") == "GENERATIVE":
        return "generative_pipeline"
    return "cv_pipeline"


async def cv_pipeline(state: ComposeState) -> ComposeState:
    # TODO: segment -> align -> color -> blend -> assemble.
    state["current_step"] = "POSTPROCESSING"
    state["progress"] = 95
    return state


async def generative_pipeline(state: ComposeState) -> ComposeState:
    raise NotImplementedError("Generative pipeline is not enabled in the initial skeleton")


async def video_pipeline(state: ComposeState) -> ComposeState:
    raise NotImplementedError("Video pipeline is planned for Phase 2")


async def validate_result(state: ComposeState) -> ComposeState:
    # TODO: validate output MIME type, dimensions, and result count.
    return state


async def persist_result(state: ComposeState) -> ComposeState:
    # TODO: upload result and thumbnail, then report keys to core-api.
    state["current_step"] = "COMPLETED"
    state["progress"] = 100
    return state
