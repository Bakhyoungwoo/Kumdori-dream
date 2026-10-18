from PIL import Image

from app.pipeline.align import align_subject
from app.pipeline.assemble import assemble_frame
from app.pipeline.blend import blend_subject
from app.pipeline.color import correct_color
from app.pipeline.segment import segment_person


def compose_subject(subject: Image.Image, frame: Image.Image) -> Image.Image:
    """Run the deterministic CV composition chain for one subject."""
    aligned = align_subject(subject, frame)
    # Recompute the mask after alignment so transparent padding remains
    # transparent instead of becoming an opaque black rectangle.
    mask = segment_person(aligned)
    corrected = correct_color(aligned, frame)
    blended = blend_subject(corrected, mask, frame)
    return assemble_frame([blended], frame)
