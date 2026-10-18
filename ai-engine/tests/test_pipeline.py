from PIL import Image

from app.pipeline.cv import compose_subject
from app.pipeline.align import align_subject
from app.pipeline.assemble import assemble_frame
from app.pipeline.blend import blend_subject
from app.pipeline.color import correct_color
from app.pipeline.segment import segment_person


def test_basic_cv_pipeline_composes_rgba_subject():
    target = Image.new("RGB", (8, 8), "white")
    subject = Image.new("RGBA", (4, 4), (255, 0, 0, 128))

    mask = segment_person(subject)
    aligned = align_subject(subject, target)
    corrected = correct_color(aligned, target)
    blended = blend_subject(corrected, mask, target)
    result = assemble_frame([blended], target)

    assert result.mode == "RGBA"
    assert result.size == (8, 8)
    assert result.getpixel((4, 4))[0] > result.getpixel((4, 4))[1]


def test_opaque_input_gets_full_foreground_mask():
    mask = segment_person(Image.new("RGB", (3, 2), "black"))

    assert mask.mode == "L"
    assert mask.getextrema() == (255, 255)


def test_white_border_background_is_removed():
    image = Image.new("RGB", (5, 5), "white")
    image.putpixel((2, 2), (20, 40, 200))

    mask = segment_person(image)

    assert mask.getpixel((0, 0)) == 0
    assert mask.getpixel((2, 2)) == 255


def test_cv_orchestrator_returns_frame_sized_image():
    result = compose_subject(
        Image.new("RGBA", (2, 2), (0, 0, 255, 255)),
        Image.new("RGB", (10, 6), "white"),
    )

    assert result.size == (10, 6)
    assert result.mode == "RGBA"


def test_alignment_preserves_subject_scale_inside_frame():
    result = compose_subject(
        Image.new("RGBA", (2, 2), (0, 0, 255, 255)),
        Image.new("RGB", (10, 6), "white"),
    )

    assert result.getpixel((0, 0))[:3] == (255, 255, 255)
