from PIL import Image
from collections import deque


def segment_person(image: Image.Image) -> Image.Image:
    """Return a foreground mask.

    The first adapter preserves an existing alpha channel. For opaque inputs,
    it uses a full foreground mask until a rembg/SAM2 adapter is configured.
    """
    if image.mode == "RGBA":
        return image.getchannel("A")

    # Basic fallback for ID/photos shot on a white studio background. Only
    # white pixels connected to the image border are removed, so white clothes
    # inside the subject are not discarded as background.
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()

    def is_background(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return min(red, green, blue) >= 245 and max(red, green, blue) - min(red, green, blue) <= 12

    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        index = y * width + x
        if visited[index] or not is_background(x, y):
            continue
        visited[index] = 1
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    mask = Image.new("L", image.size, 255)
    mask_pixels = mask.load()
    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                mask_pixels[x, y] = 0
    return mask
