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


def _is_near_black(px, x: int, y: int) -> bool:
    r, g, b, a = px[x, y]
    if a < 8:
        return True
    return r <= BG_THRESH and g <= BG_THRESH and b <= BG_THRESH


def _flood_component(
    px, w: int, h: int, start_x: int, start_y: int, mask: list[list[bool]], value: bool
) -> bool:
    """4-connected flood; returns True if any pixel in the component touches the image border."""
    touches_border = False
    q: deque[tuple[int, int]] = deque([(start_x, start_y)])
    mask[start_y][start_x] = value
    while q:
        x, y = q.popleft()
        if x == 0 or y == 0 or x == w - 1 or y == h - 1:
            touches_border = True
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and _is_near_black(px, nx, ny):
                mask[ny][nx] = value
                q.append((nx, ny))
    return touches_border


def flood_edge_background(im: Image.Image) -> Image.Image:
    """Mark exterior near-black (edge flood) and interior holes (enclosed near-black) transparent."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    is_bg = [[False] * w for _ in range(h)]

    # Exterior: near-black connected to image edge (original background).
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if _is_near_black(px, x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if _is_near_black(px, x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not is_bg[ny][nx] and _is_near_black(px, nx, ny):
                is_bg[ny][nx] = True
                q.append((nx, ny))

    # Interior holes: enclosed near-black (e.g. hex cutout) not touching the border.
    visited = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if visited[y][x] or is_bg[y][x] or not _is_near_black(px, x, y):
                continue
            touches_border = _flood_component(px, w, h, x, y, visited, True)
            if not touches_border:
                _flood_component(px, w, h, x, y, is_bg, True)

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


def lift_shadows(im: Image.Image, scale: float = 1.45, bias: int = 42) -> Image.Image:
    """Brighten dark subject art so it reads on the demo's dark purple playfield."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            px[x, y] = (
                min(255, int(r * scale + bias)),
                min(255, int(g * scale + bias)),
                min(255, int(b * scale + bias)),
                a,
            )
    return im


def strip_border_black(im: Image.Image, border: int = 4, thresh: int = 28) -> Image.Image:
    """Remove near-black only in an outer ring (subjects that are mostly black throughout)."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            if x >= border and y >= border and x < w - border and y < h - border:
                continue
            r, g, b, a = px[x, y]
            if a < 8 or max(r, g, b) > thresh:
                continue
            px[x, y] = (0, 0, 0, 0)
    return im


def process_power_block(path: Path) -> Image.Image:
    """Dark crystalline art: lift interior, strip only the outer background ring."""
    im = Image.open(path).convert("RGBA")
    im = lift_shadows(im, scale=1.65, bias=58)
    im = strip_border_black(im, border=5, thresh=32)
    return crop_to_content(im)


def process(
    path: Path,
    *,
    edge_only: bool = False,
    skip_fringe: bool = False,
    lift: int = 0,
) -> None:
    if "power" in path.stem.lower():
        im = process_power_block(path)
        im.save(path, "PNG")
        print(f"OK {path} -> {im.size[0]}x{im.size[1]} RGBA (power)")
        return

    im = Image.open(path)
    if edge_only:
        im = flood_edge_background_edge_only(im)
    else:
        im = flood_edge_background(im)
    if not skip_fringe:
        im = remove_dark_fringe(im)
    if lift > 0:
        im = lift_shadows(im, scale=1.35 + lift / 200, bias=lift)
    im = crop_to_content(im)
    im.save(path, "PNG")
    print(f"OK {path} -> {im.size[0]}x{im.size[1]} RGBA")


def flood_edge_background_edge_only(im: Image.Image) -> Image.Image:
    """Remove only exterior near-black; keep dark interior (power blocks, etc.)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    is_bg = [[False] * w for _ in range(h)]

    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if _is_near_black(px, x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if _is_near_black(px, x, y) and not is_bg[y][x]:
                is_bg[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not is_bg[ny][nx] and _is_near_black(px, nx, ny):
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


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "assets" / "ball"
    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else list(root.glob("*.png"))
    for p in paths:
        process(p)


if __name__ == "__main__":
    main()
