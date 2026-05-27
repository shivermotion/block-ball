#!/usr/bin/env python3
"""Remove black/near-black background from sprites; write RGBA PNG (ball, blocks/spike, etc.)."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

# Pixels this dark that touch the image edge (via 4-connectivity) become transparent.
BG_THRESH = 42
# Dark fringe around the ball (opaque near-black touching transparency).
FRINGE_THRESH = 55


def flood_edge_background(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    is_bg = [[False] * w for _ in range(h)]

    def is_bg_color(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 8:
            return True
        return r <= BG_THRESH and g <= BG_THRESH and b <= BG_THRESH

    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg_color(x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg_color(x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not is_bg[ny][nx] and is_bg_color(nx, ny):
                is_bg[ny][nx] = True
                q.append((nx, ny))

    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_bg[y][x]:
                opx[x, y] = (0, 0, 0, 0)
            else:
                opx[x, y] = (r, g, b, a)

    return out


def remove_dark_fringe(im: Image.Image, passes: int = 3) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    for _ in range(passes):
        changed = False
        snapshot = im.copy()
        spx = snapshot.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = spx[x, y]
                if a < 128 or max(r, g, b) > FRINGE_THRESH:
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and spx[nx, ny][3] < 128:
                        px[x, y] = (0, 0, 0, 0)
                        changed = True
                        break
        if not changed:
            break
    return im


def crop_to_content(im: Image.Image, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    w, h = im.size
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def process(path: Path) -> None:
    im = Image.open(path)
    im = flood_edge_background(im)
    im = remove_dark_fringe(im)
    im = crop_to_content(im)
    im.save(path, "PNG")
    print(f"OK {path} -> {im.size[0]}x{im.size[1]} RGBA")


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "assets" / "ball"
    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else list(root.glob("*.png"))
    for p in paths:
        process(p)


if __name__ == "__main__":
    main()
