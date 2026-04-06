"""
Generate premium voucher and golden ticket images for Copa Omega Star.
400x250px each, professional coupon/gift card style.

v3 - Clean design: no watermark overlap, no diagonal lines, proper spacing.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "vouchers")
os.makedirs(OUTPUT_DIR, exist_ok=True)

W, H = 400, 250
CORNER_RADIUS = 16
SCALLOP_RADIUS = 6
SCALLOP_SPACING = 18


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def tw(draw, text, font):
    """Text width."""
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def th(draw, text, font):
    """Text height."""
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def tcx(draw, text, font, x0, x1):
    """X to center text in [x0, x1]."""
    return x0 + (x1 - x0 - tw(draw, text, font)) // 2


def draw_scalloped_border(img):
    """Semicircle cutouts for ticket perforation effect."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    r = SCALLOP_RADIUS
    gap = SCALLOP_SPACING

    x = gap + r
    while x < w - gap:
        draw.ellipse([x - r, -r, x + r, r], fill=(0, 0, 0, 0))
        draw.ellipse([x - r, h - r, x + r, h + r], fill=(0, 0, 0, 0))
        x += gap + r * 2

    y = gap + r
    while y < h - gap:
        draw.ellipse([-r, y - r, r, y + r], fill=(0, 0, 0, 0))
        draw.ellipse([w - r, y - r, w + r, y + r], fill=(0, 0, 0, 0))
        y += gap + r * 2


def draw_dotted_vline(draw, x, y0, y1, color, spacing=7, radius=1):
    """Vertical dotted line for ticket tear separator."""
    y = y0
    while y < y1:
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color)
        y += spacing


def draw_radial_glow(draw, cx, cy, radius, color, steps=10):
    """Soft radial glow behind an element."""
    for i in range(steps, 0, -1):
        alpha = int(15 * (i / steps))
        r = radius + (steps - i) * 3
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*color[:3], max(alpha, 0))
        )


def draw_coin(draw, cx, cy, r, bg_color, accent, is_golden=False):
    """Omega coin with glow."""
    font_omega = ImageFont.truetype("ariblk.ttf", int(r * 1.2))

    if is_golden:
        draw.ellipse(
            [cx - r - 5, cy - r - 5, cx + r + 5, cy + r + 5],
            fill=hex_to_rgb("#8B6914"), outline=hex_to_rgb("#6B5310"), width=2
        )
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=hex_to_rgb("#FFD700"), outline=hex_to_rgb("#DAA520"), width=2
        )
        # Shine on top half
        for i in range(r // 3):
            a = int(40 - i * 3)
            if a <= 0:
                break
            yy = cy - r + 4 + i
            dx = math.sqrt(max(0, r * r - (yy - cy) ** 2))
            draw.line([(cx - dx + 4, yy), (cx + dx - 4, yy)],
                      fill=(*hex_to_rgb("#FFF8DC"), max(a, 0)), width=1)
        ow = tw(draw, "\u03A9", font_omega)
        oh = th(draw, "\u03A9", font_omega)
        draw.text((cx - ow // 2, cy - oh // 2 - 2), "\u03A9",
                  font=font_omega, fill=hex_to_rgb("#3B2600"))
    else:
        draw_radial_glow(draw, cx, cy, r + 4, accent, steps=8)
        draw.ellipse(
            [cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3],
            fill=(*accent[:3], 40), outline=(*accent[:3], 90), width=2
        )
        inner = lerp_color(bg_color, (0, 0, 0), 0.4)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*inner, 255), outline=(*accent[:3], 130), width=2
        )
        ow = tw(draw, "\u03A9", font_omega)
        oh = th(draw, "\u03A9", font_omega)
        draw.text((cx - ow // 2, cy - oh // 2 - 2), "\u03A9",
                  font=font_omega, fill=(*accent[:3], 210))


def create_voucher(filename, bg_hex, accent_hex, pct_text, label_text,
                   coins_text, badge_text=None, extra_desc=None, is_golden=False):
    bg = hex_to_rgb(bg_hex)
    accent = hex_to_rgb(accent_hex)

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Fonts ---
    font_pct = ImageFont.truetype("ariblk.ttf", 48)
    font_label = ImageFont.truetype("arialbd.ttf", 17)
    font_coins = ImageFont.truetype("arialbd.ttf", 13)
    font_brand = ImageFont.truetype("arialbd.ttf", 9)
    font_badge = ImageFont.truetype("ariblk.ttf", 10)
    font_desc = ImageFont.truetype("arialbd.ttf", 11)

    if is_golden:
        font_pct = ImageFont.truetype("ariblk.ttf", 42)
        font_label = ImageFont.truetype("ariblk.ttf", 26)

    # --- Background gradient ---
    if is_golden:
        c_top = hex_to_rgb("#FFD700")
        c_bot = hex_to_rgb("#C49000")
        for y in range(H):
            t = y / H
            c = lerp_color(c_top, c_bot, t)
            draw.line([(0, y), (W, y)], fill=(*c, 255))
    else:
        c_top = lerp_color(bg, (255, 255, 255), 0.10)
        c_bot = lerp_color(bg, (0, 0, 0), 0.30)
        for y in range(H):
            t = y / H
            c = lerp_color(c_top, c_bot, t)
            draw.line([(0, y), (W, y)], fill=(*c, 255))

    # Round corners
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, H - 1],
                                            radius=CORNER_RADIUS, fill=255)
    img.putalpha(mask)
    draw = ImageDraw.Draw(img)

    # --- Subtle noise texture (dots) instead of diagonal lines ---
    import random
    random.seed(42)  # deterministic
    for _ in range(120):
        rx = random.randint(0, W)
        ry = random.randint(0, H)
        if is_golden:
            draw.point((rx, ry), fill=(*hex_to_rgb("#FFE44D"), 15))
        else:
            draw.point((rx, ry), fill=(255, 255, 255, 8))

    # --- Layout ---
    sep_x = int(W * 0.74)

    # Separator
    if is_golden:
        draw_dotted_vline(draw, sep_x, 16, H - 16,
                          (*hex_to_rgb("#8B6914"), 80))
    else:
        draw_dotted_vline(draw, sep_x, 16, H - 16,
                          (*accent[:3], 50))

    # --- Left content ---
    lx0, lx1 = 22, sep_x - 14

    if is_golden:
        dark = hex_to_rgb("#3B2600")
        mid = hex_to_rgb("#5C3D00")

        # "GOLDEN"
        y = 32
        x = tcx(draw, pct_text, font_pct, lx0, lx1)
        draw.text((x + 1, y + 1), pct_text, font=font_pct,
                  fill=(*hex_to_rgb("#8B6914"), 80))
        draw.text((x, y), pct_text, font=font_pct, fill=dark)

        # "TICKET"
        y2 = y + th(draw, pct_text, font_pct) + 2
        x2 = tcx(draw, label_text, font_label, lx0, lx1)
        draw.text((x2, y2), label_text, font=font_label, fill=dark)

        # Double line
        y3 = y2 + th(draw, label_text, font_label) + 10
        mid_x = lx0 + (lx1 - lx0) // 2
        draw.line([(mid_x - 70, y3), (mid_x + 70, y3)],
                  fill=(*hex_to_rgb("#8B6914"), 120), width=1)
        draw.line([(mid_x - 70, y3 + 3), (mid_x + 70, y3 + 3)],
                  fill=(*hex_to_rgb("#8B6914"), 60), width=1)

        # Coins
        y4 = y3 + 12
        x4 = tcx(draw, coins_text, font_coins, lx0, lx1)
        draw.text((x4, y4), coins_text, font=font_coins, fill=mid)

        # Extra description
        if extra_desc:
            y5 = y4 + 18
            x5 = tcx(draw, extra_desc, font_desc, lx0, lx1)
            draw.text((x5, y5), extra_desc, font=font_desc, fill=mid)

        # Brand
        brand = "COPA OMEGA STAR"
        bx = tcx(draw, brand, font_brand, lx0, lx1)
        draw.text((bx, H - 32), brand, font=font_brand,
                  fill=(*dark, 100))

        # Corner stars
        sf = ImageFont.truetype("segoeuib.ttf", 12)
        for sx, sy in [(lx0, 14), (lx1 - 12, 14),
                        (lx0, H - 24), (lx1 - 12, H - 24)]:
            draw.text((sx, sy), "\u2605", font=sf,
                      fill=(*hex_to_rgb("#FFE44D"), 80))

    else:
        # --- Standard voucher ---
        # Percentage
        y = 40
        x = tcx(draw, pct_text, font_pct, lx0, lx1)
        draw.text((x + 2, y + 2), pct_text, font=font_pct,
                  fill=(0, 0, 0, 60))
        draw.text((x, y), pct_text, font=font_pct,
                  fill=(255, 255, 255, 255))

        # "DESCUENTO"
        y2 = y + th(draw, pct_text, font_pct) + 6
        x2 = tcx(draw, label_text, font_label, lx0, lx1)
        draw.text((x2, y2), label_text, font=font_label,
                  fill=(255, 255, 255, 190))

        # Accent bar
        y3 = y2 + th(draw, label_text, font_label) + 10
        mid_x = lx0 + (lx1 - lx0) // 2
        draw.rounded_rectangle(
            [mid_x - 45, y3, mid_x + 45, y3 + 3],
            radius=1, fill=(*accent[:3], 140)
        )

        # Coins
        y4 = y3 + 12
        x4 = tcx(draw, coins_text, font_coins, lx0, lx1)
        draw.text((x4, y4), coins_text, font=font_coins,
                  fill=(255, 255, 255, 160))

        # Brand
        brand = "COPA OMEGA STAR"
        bx = tcx(draw, brand, font_brand, lx0, lx1)
        draw.text((bx, H - 32), brand, font=font_brand,
                  fill=(255, 255, 255, 70))

    # --- Right: omega coin ---
    right_cx = sep_x + (W - sep_x) // 2
    right_cy = H // 2
    coin_r = min((W - sep_x) // 2 - 16, 34)
    draw_coin(draw, right_cx, right_cy, coin_r, bg, accent, is_golden)

    # Golden sparkles
    if is_golden:
        sf = ImageFont.truetype("arialbd.ttf", 8)
        for sx, sy in [(right_cx - coin_r - 10, right_cy - coin_r - 6),
                        (right_cx + coin_r + 2, right_cy - coin_r - 6),
                        (right_cx - coin_r - 10, right_cy + coin_r - 2),
                        (right_cx + coin_r + 2, right_cy + coin_r - 2)]:
            draw.text((sx, sy), "\u2726", font=sf,
                      fill=(*hex_to_rgb("#FFE44D"), 160))

    # --- Badge ---
    if badge_text:
        bpad = 8
        bw = tw(draw, badge_text, font_badge) + bpad * 2
        bh = 18
        bx = W - bw - 12
        by = 12
        if is_golden:
            draw.rounded_rectangle([bx, by, bx + bw, by + bh],
                                   radius=3, fill=hex_to_rgb("#3B2600"))
            draw.text((bx + bpad, by + 3), badge_text,
                      font=font_badge, fill=hex_to_rgb("#FFD700"))
        else:
            draw.rounded_rectangle([bx, by, bx + bw, by + bh],
                                   radius=3, fill=(*accent[:3], 210))
            draw.text((bx + bpad, by + 3), badge_text,
                      font=font_badge, fill=(255, 255, 255, 255))

    # --- Scalloped edges ---
    draw_scalloped_border(img)

    # --- Accent border ---
    draw = ImageDraw.Draw(img)
    if is_golden:
        draw.rounded_rectangle([4, 4, W - 5, H - 5],
                               radius=CORNER_RADIUS - 3,
                               outline=(*hex_to_rgb("#8B6914"), 120), width=2)
    else:
        draw.rounded_rectangle([4, 4, W - 5, H - 5],
                               radius=CORNER_RADIUS - 3,
                               outline=(*accent[:3], 40), width=1)

    # --- Save ---
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, "PNG")
    print(f"  OK: {filename}")
    return path


def main():
    print("Copa Omega Star vouchers v3\n")
    teal = "#14B8A6"

    create_voucher("voucher_5.png",
                   "#1e3a5f", teal, "5%", "DESCUENTO", "50 \u03A9 Coins")

    create_voucher("voucher_10.png",
                   "#1a4731", "#10B981", "10%", "DESCUENTO", "100 \u03A9 Coins")

    create_voucher("voucher_15.png",
                   "#3b1f5e", "#A78BFA", "15%", "DESCUENTO", "200 \u03A9 Coins")

    create_voucher("voucher_20.png",
                   "#5e1f1f", "#F87171", "20%", "DESCUENTO", "350 \u03A9 Coins",
                   badge_text="PREMIUM")

    create_voucher("golden_ticket.png",
                   "#FFD700", "#FFD700", "GOLDEN", "TICKET", "500 \u03A9 Coins",
                   badge_text="EXCLUSIVO",
                   extra_desc="Inscripcion gratuita al torneo",
                   is_golden=True)

    print("\nListo!")


if __name__ == "__main__":
    main()
