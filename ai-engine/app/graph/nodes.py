from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

import cv2
from PIL import Image

from app.config import settings
from app.graph.state import ComposeState
from app.graph.spec import GenerationSpec
from app.integration.storage import object_storage
from app.pipeline.cv import compose_subject
from app.pipeline.generative import render_prompt_variant
from app.pipeline.providers import build_final_prompt, generate_image, generate_video, plan_prompt
from app.pipeline.video import compose_video


async def validate_input(state: ComposeState) -> ComposeState:
    if not state.get("job_id"):
        raise ValueError("job_id is required")

    # Accept the camelCase transport shape emitted by core-api as well as
    # the snake_case shape used internally by the engine.
    aliases = {
        "user_id": "userId",
        "media_type": "mediaType",
        "pipeline_type": "pipelineType",
        "requirement_text": "requirementText",
        "image_count": "imageCount",
        "frame_id": "frameId",
        "frame_key": "frameKey",
        "character_image_key": "characterImageKey",
    }
    for internal_key, transport_key in aliases.items():
        if not state.get(internal_key) and state.get(transport_key) is not None:
            state[internal_key] = state[transport_key]

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
    if not state.get("frame_key") and state.get("character_image_key"):
        state["frame_key"] = state["character_image_key"]
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
    requested_count = state.get("image_count") or state.get("imageCount") or 1
    output_count = max(1, min(int(requested_count), 4))
    state["generation_spec"] = {
        "schema_version": "1.0",
        "media_type": state.get("media_type"),
        "composition_mode": "FRAME_COMPOSITE",
        "subjects": [],
        "constraints": {"max_outputs": output_count},
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
        except FileNotFoundError as exc:
            raise ValueError(f"input object not found: {key}") from exc

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
    keys = state.get("normalized_keys", [])
    if not keys:
        raise ValueError("at least one normalized image is required")
    prompt = (state.get("requirement_text") or "").strip()
    prompt_plan_result = await plan_prompt(
        prompt,
        media_type="IMAGE",
        frame_manifest=state.get("frame_manifest"),
        vision_features=state.get("vision_features"),
    )
    state["prompt_plan"] = prompt_plan_result.model_dump()
    subject = Image.open(BytesIO(await object_storage.download(keys[0]))).convert("RGBA")
    frame_key = state.get("frame_key")
    if frame_key:
        frame = Image.open(BytesIO(await object_storage.download(frame_key))).convert("RGBA")
    else:
        frame = Image.new("RGBA", subject.size, (255, 255, 255, 255))
    composed = compose_subject(subject, frame, state.get("alignment"))
    output_count = state["generation_spec"]["constraints"]["max_outputs"]
    result_keys: list[str] = []
    if settings.image_provider == "openai" and settings.openai_api_key:
        image_inputs = [
            ("identity-reference.png", await object_storage.download(keys[0]))
        ]
        if frame_key:
            image_inputs.append(
                ("character-or-scene-reference.png", await object_storage.download(frame_key))
            )
        image_prompt = (
            build_final_prompt(prompt_plan_result, "IMAGE", prompt)
            + "\n\nReference roles: identity-reference.png is the person whose identity must be preserved. "
            + "character-or-scene-reference.png is an additional character or scene reference. "
            + "Integrate both into one coherent photograph with matched lighting, perspective, scale, and contact shadows."
        )
        generated = await generate_image(
            image_prompt,
            image_inputs,
            output_count,
        )
        for index, content in enumerate(generated[:output_count]):
            result_key = f"results/{state['job_id']}/result-{index + 1}.png"
            await object_storage.upload(result_key, content, "image/png")
            result_keys.append(result_key)
        if not result_keys:
            raise ValueError("image provider returned no images")
        state["generation_mode"] = "OPENAI_IMAGE"
    else:
        for index in range(output_count):
            result = render_prompt_variant(composed, prompt, index)
            output = BytesIO()
            result.save(output, format="PNG")
            result_key = f"results/{state['job_id']}/result-{index + 1}.png"
            await object_storage.upload(result_key, output.getvalue(), "image/png")
            result_keys.append(result_key)
        state["generation_mode"] = "PROMPTED_LOCAL_MVP"

    thumbnail = Image.open(BytesIO(await object_storage.download(result_keys[0]))).convert("RGBA")
    thumbnail.thumbnail((320, 320), Image.Resampling.LANCZOS)
    thumb_output = BytesIO()
    thumbnail.convert("RGB").save(thumb_output, format="JPEG", quality=85)
    thumbnail_key = f"results/{state['job_id']}/thumbnail.jpg"
    await object_storage.upload(thumbnail_key, thumb_output.getvalue(), "image/jpeg")
    state["result_prompt"] = prompt
    state["result_keys"] = result_keys
    state["thumbnail_key"] = thumbnail_key
    state["current_step"] = "POSTPROCESSING"
    state["progress"] = 95
    return state


async def video_pipeline(state: ComposeState) -> ComposeState:
    keys = state.get("normalized_keys", [])
    if not keys:
        raise ValueError("at least one normalized image is required")

    subject = Image.open(BytesIO(await object_storage.download(keys[0]))).convert("RGBA")
    prompt_plan_result = await plan_prompt(
        (state.get("requirement_text") or "").strip(),
        media_type="VIDEO",
        frame_manifest=state.get("frame_manifest"),
        vision_features=state.get("vision_features"),
    )
    state["prompt_plan"] = prompt_plan_result.model_dump()
    frame_key = state.get("frame_key")
    if frame_key:
        background = await object_storage.download(frame_key)
    else:
        still = Image.new("RGBA", subject.size, (255, 255, 255, 255))
        output = BytesIO()
        still.save(output, format="PNG")
        background = output.getvalue()

    result_key = f"results/{state['job_id']}/result.mp4"
    result_path = object_storage._path(result_key)
    if settings.video_provider == "google" and settings.gemini_api_key:
        try:
            background_image = Image.open(BytesIO(background)).convert("RGBA")
        except (OSError, ValueError):
            background_image = Image.new("RGBA", subject.size, (255, 255, 255, 255))
        composed = compose_subject(subject, background_image, state.get("alignment"))
        composed_output = BytesIO()
        composed.save(composed_output, format="PNG")
        video_content = await generate_video(
            build_final_prompt(prompt_plan_result, "VIDEO"),
            composed_output.getvalue(),
        )
        await object_storage.upload(result_key, video_content, "video/mp4")
        result_path.write_bytes(video_content)
        state["generation_mode"] = "GOOGLE_VEO"
    else:
        compose_video(
            subject,
            background,
            result_path,
            state.get("alignment"),
            prompt=build_final_prompt(prompt_plan_result, "VIDEO"),
        )
        await object_storage.upload(result_key, result_path.read_bytes(), "video/mp4")
        state["generation_mode"] = "PROMPTED_LOCAL_VIDEO_MVP"

    thumbnail_key = f"results/{state['job_id']}/thumbnail.jpg"
    capture = cv2.VideoCapture(str(result_path))
    ok, frame = capture.read()
    capture.release()
    if not ok:
        raise ValueError("generated video contains no readable frames")
    thumbnail = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    thumb_output = BytesIO()
    Image.fromarray(thumbnail).save(thumb_output, format="JPEG", quality=85)
    await object_storage.upload(thumbnail_key, thumb_output.getvalue(), "image/jpeg")

    state["result_keys"] = [result_key]
    state["thumbnail_key"] = thumbnail_key
    state["current_step"] = "POSTPROCESSING"
    state["progress"] = 95
    return state


async def validate_result(state: ComposeState) -> ComposeState:
    if len(state.get("result_keys", [])) > 4:
        raise ValueError("pipeline returned too many results")
    if state.get("result_keys"):
        for key in state["result_keys"]:
            try:
                content = await object_storage.download(key)
                if key.lower().endswith((".mp4", ".mov", ".avi")):
                    with NamedTemporaryFile(suffix=Path(key).suffix, delete=False) as temp:
                        temp.write(content)
                        temp_path = temp.name
                    capture = cv2.VideoCapture(temp_path)
                    valid = capture.isOpened() and int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) > 0
                    capture.release()
                    Path(temp_path).unlink(missing_ok=True)
                    if not valid:
                        raise ValueError("invalid video")
                else:
                    Image.open(BytesIO(content)).verify()
            except (FileNotFoundError, OSError) as exc:
                raise ValueError(f"invalid result image: {key}") from exc
    return state


async def persist_result(state: ComposeState) -> ComposeState:
    state["current_step"] = "COMPLETED"
    state["progress"] = 100
    return state
