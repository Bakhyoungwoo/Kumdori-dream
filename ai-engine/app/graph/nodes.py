from io import BytesIO

from PIL import Image

from app.graph.state import ComposeState
from app.graph.spec import GenerationSpec
from app.integration.storage import object_storage
from app.pipeline.cv import compose_subject


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
    if not state.get("frame_key") and state.get("frame_manifest", {}).get("key"):
        state["frame_key"] = state["frame_manifest"]["key"]
    if not state.get("alignment") and state.get("frame_manifest", {}).get("alignment"):
        state["alignment"] = state["frame_manifest"]["alignment"]
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
    state["normalized_keys"] = state.get("input_keys", [])
    if state.get("reference_image_keys"):
        state["frame_key"] = state["reference_image_keys"][0]
    state["current_step"] = "PREPROCESSING"
    state["progress"] = 20
    return state


async def analyze_vision(state: ComposeState) -> ComposeState:
    features: dict = {}
    for key in state.get("normalized_keys", [])[:1]:
        try:
            image = Image.open(BytesIO(await object_storage.download(key)))
            features = {
                "input_count": len(state.get("normalized_keys", [])),
                "width": image.width,
                "height": image.height,
                "mode": image.mode,
                "has_alpha": "A" in image.getbands(),
            }
        except (FileNotFoundError, OSError):
            pass
    state["vision_features"] = features
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
    spec = state.get("generation_spec")
    if not spec:
        raise ValueError("generation_spec is required")
    state["generation_spec"] = GenerationSpec.model_validate(spec).model_dump()
    return state


def route_pipeline(state: ComposeState) -> str:
    if state.get("media_type") == "VIDEO":
        return "video_pipeline"
    if state.get("pipeline_type") == "GENERATIVE":
        return "generative_pipeline"
    return "cv_pipeline"


async def cv_pipeline(state: ComposeState) -> ComposeState:
    keys = state.get("normalized_keys", [])
    if not keys:
        raise ValueError("at least one normalized image is required")

    subjects: list[Image.Image] = []
    for key in keys:
        try:
            content = await object_storage.download(key)
            subjects.append(Image.open(BytesIO(content)).convert("RGBA"))
        except FileNotFoundError:
            # Graph-only callers can still exercise routing before storage is
            # configured. Real compose events must provide existing keys.
            subjects = []
            break

    if subjects:
        frame_key = state.get("frame_key")
        if frame_key:
            frame = Image.open(BytesIO(await object_storage.download(frame_key))).convert("RGBA")
        else:
            frame = Image.new("RGBA", subjects[0].size, (255, 255, 255, 255))

        result = frame
        for subject in subjects:
            result = compose_subject(subject, result, state.get("alignment"))

        output = BytesIO()
        result.save(output, format="PNG")
        result_key = f"results/{state['job_id']}/result.png"
        await object_storage.upload(result_key, output.getvalue(), "image/png")

        thumbnail = result.copy()
        thumbnail.thumbnail((320, 320), Image.Resampling.LANCZOS)
        thumb_output = BytesIO()
        thumbnail.convert("RGB").save(thumb_output, format="JPEG", quality=85)
        thumbnail_key = f"results/{state['job_id']}/thumbnail.jpg"
        await object_storage.upload(thumbnail_key, thumb_output.getvalue(), "image/jpeg")
        state["result_keys"] = [result_key]
        state["thumbnail_key"] = thumbnail_key

    state["current_step"] = "POSTPROCESSING"
    state["progress"] = 95
    return state


async def generative_pipeline(state: ComposeState) -> ComposeState:
    raise NotImplementedError("Generative pipeline is not enabled in the initial skeleton")


async def video_pipeline(state: ComposeState) -> ComposeState:
    raise NotImplementedError("Video pipeline is planned for Phase 2")


async def validate_result(state: ComposeState) -> ComposeState:
    if len(state.get("result_keys", [])) > 1:
        raise ValueError("CV pipeline returned too many results")
    if state.get("result_keys"):
        for key in state["result_keys"]:
            try:
                Image.open(BytesIO(await object_storage.download(key))).verify()
            except (FileNotFoundError, OSError) as exc:
                raise ValueError(f"invalid result image: {key}") from exc
    return state


async def persist_result(state: ComposeState) -> ComposeState:
    state["current_step"] = "COMPLETED"
    state["progress"] = 100
    return state
