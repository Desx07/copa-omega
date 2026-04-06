import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

OUTPUT_DIR = "C:/Users/ariel/Desktop/go/copa-omega/public/vouchers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Work at 4x resolution for anti-aliasing, then downscale
SCALE = 4
W, H = 360 * SCALE, 100 * SCALE
FINAL_W, FINAL_H = 360, 100

BG_COLOR = (10, 10, 14)
DARK_BG = (10, 10, 14, 255)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def create_gradient_bar(w, h, color1, color2, horizontal=True):
    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)
    r1, g1, b1 = color1
    r2, g2, b2 = color2
    steps = w if horizontal else h
    for i in range(steps):
        ratio = i / max(steps - 1, 1)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        if horizontal:
            draw.line([(i, 0), (i, h)], fill=(r, g, b, 255))
        else:
            draw.line([(0, i), (w, i)], fill=(r, g, b, 255))
    return img


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    r = radius
    if fill:
        draw.rectangle([x1 + r, y1, x2 - r, y2], fill=fill)
        draw.rectangle([x1, y1 + r, x2, y2 - r], fill=fill)
        draw.pieslice([x1, y1, x1 + 2 * r, y1 + 2 * r], 180, 270, fill=fill)
        draw.pieslice([x2 - 2 * r, y1, x2, y1 + 2 * r], 270, 360, fill=fill)
        draw.pieslice([x1, y2 - 2 * r, x1 + 2 * r, y2], 90, 180, fill=fill)
        draw.pieslice([x2 - 2 * r, y2 - 2 * r, x2, y2], 0, 90, fill=fill)
    if outline:
        draw.arc(
            [x1, y1, x1 + 2 * r, y1 + 2 * r], 180, 270, fill=outline, width=width
        )
        draw.arc(
            [x2 - 2 * r, y1, x2, y1 + 2 * r], 270, 360, fill=outline, width=width
        )
        draw.arc(
            [x1, y2 - 2 * r, x1 + 2 * r, y2], 90, 180, fill=outline, width=width
        )
        draw.arc(
            [x2 - 2 * r, y2 - 2 * r, x2, y2], 0, 90, fill=outline, width=width
        )
        draw.line([x1 + r, y1, x2 - r, y1], fill=outline, width=width)
        draw.line([x1 + r, y2, x2 - r, y2], fill=outline, width=width)
        draw.line([x1, y1 + r, x1, y2 - r], fill=outline, width=width)
        draw.line([x2, y1 + r, x2, y2 - r], fill=outline, width=width)


def create_voucher(filename, accent_color_hex, discount_text, subtitle="DESCUENTO"):
    accent = hex_to_rgb(accent_color_hex)
    accent_dark = tuple(max(0, c - 80) for c in accent)
    accent_bright = tuple(min(255, c + 60) for c in accent)

    # Base image
    img = Image.new("RGBA", (W, H), DARK_BG)

    # Background subtle gradient
    bg_grad = create_gradient_bar(W, H, (15, 15, 22), (8, 8, 12), horizontal=True)
    img = Image.alpha_composite(img, bg_grad)
    draw = ImageDraw.Draw(img)

    border_width = 6 * SCALE
    corner_radius = 16 * SCALE
    margin = 4 * SCALE

    # Outer glow layer
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    draw_rounded_rect(
        glow_draw,
        (margin, margin, W - margin, H - margin),
        corner_radius,
        outline=(*accent, 180),
        width=border_width * 2,
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(12 * SCALE))
    img = Image.alpha_composite(img, glow_layer)
    draw = ImageDraw.Draw(img)

    # Inner darker fill
    inner_margin = margin + border_width
    draw_rounded_rect(
        draw,
        (inner_margin, inner_margin, W - inner_margin, H - inner_margin),
        corner_radius - 4 * SCALE,
        fill=(12, 12, 18, 230),
    )

    # Accent border
    draw_rounded_rect(
        draw,
        (margin, margin, W - margin, H - margin),
        corner_radius,
        outline=(*accent, 255),
        width=border_width,
    )

    # Left accent bar
    bar_x = margin + border_width + 8 * SCALE
    bar_w = 8 * SCALE
    bar_y1 = margin + corner_radius
    bar_y2 = H - margin - corner_radius
    accent_bar = create_gradient_bar(
        bar_w, bar_y2 - bar_y1, accent_dark, accent_bright, horizontal=False
    )
    img.paste(accent_bar, (bar_x, bar_y1), accent_bar)
    draw = ImageDraw.Draw(img)

    # Dashed separator line (ticket perforation)
    sep_x = 100 * SCALE
    dash_len = 8 * SCALE
    gap_len = 6 * SCALE
    y = margin + corner_radius
    while y < H - margin - corner_radius:
        draw.line(
            [
                (sep_x, y),
                (sep_x, min(y + dash_len, H - margin - corner_radius)),
            ],
            fill=(*accent, 100),
            width=2 * SCALE,
        )
        y += dash_len + gap_len

    # Small circles at perforation
    circle_r = 8 * SCALE
    draw.ellipse(
        [
            sep_x - circle_r,
            margin - circle_r // 2,
            sep_x + circle_r,
            margin + circle_r + circle_r // 2,
        ],
        fill=DARK_BG,
    )
    draw.ellipse(
        [
            sep_x - circle_r,
            H - margin - circle_r - circle_r // 2,
            sep_x + circle_r,
            H - margin + circle_r // 2,
        ],
        fill=DARK_BG,
    )

    # Left section: star badge icon
    icon_cx = 56 * SCALE
    icon_cy = H // 2
    icon_r = 22 * SCALE
    points = []
    for i in range(10):
        angle = math.radians(i * 36 - 90)
        r = icon_r if i % 2 == 0 else icon_r * 0.55
        px = icon_cx + r * math.cos(angle)
        py = icon_cy + r * math.sin(angle)
        points.append((px, py))
    draw.polygon(points, fill=(*accent, 200))

    # Percentage symbol inside star
    small_font = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 18 * SCALE)
    draw.text(
        (icon_cx, icon_cy),
        "%",
        fill=(255, 255, 255, 240),
        font=small_font,
        anchor="mm",
    )

    # Right section: main text
    big_font = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 38 * SCALE)
    sub_font = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 11 * SCALE)
    brand_font = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 8 * SCALE)

    text_x = (sep_x + W) // 2 + 10 * SCALE

    # Main text with shadow
    shadow_offset = 3 * SCALE
    draw.text(
        (text_x + shadow_offset, H // 2 - 8 * SCALE + shadow_offset),
        discount_text,
        fill=(0, 0, 0, 180),
        font=big_font,
        anchor="mm",
    )
    draw.text(
        (text_x, H // 2 - 8 * SCALE),
        discount_text,
        fill=(255, 255, 255, 255),
        font=big_font,
        anchor="mm",
    )

    # Subtitle
    draw.text(
        (text_x, H // 2 + 22 * SCALE),
        subtitle,
        fill=(*accent_bright, 200),
        font=sub_font,
        anchor="mm",
    )

    # Brand text
    draw.text(
        (W - 20 * SCALE, H - 16 * SCALE),
        "COPA OMEGA \u2605",
        fill=(80, 80, 100, 150),
        font=brand_font,
        anchor="rm",
    )

    # Subtle scan lines
    for y_line in range(0, H, 4 * SCALE):
        draw.line([(0, y_line), (W, y_line)], fill=(0, 0, 0, 15), width=1)

    # Downscale with LANCZOS
    final = img.resize((FINAL_W, FINAL_H), Image.LANCZOS)

    output_path = os.path.join(OUTPUT_DIR, filename)
    final.save(output_path, "PNG", optimize=True)
    print(f"Created: {output_path} ({os.path.getsize(output_path)} bytes)")


def create_golden_ticket(filename):
    gold = (255, 200, 50)
    gold_dark = (180, 130, 20)
    gold_bright = (255, 230, 100)
    gold_shine = (255, 245, 180)

    img = Image.new("RGBA", (W, H), DARK_BG)

    # Background with warm dark tint
    bg_grad = create_gradient_bar(W, H, (20, 16, 8), (10, 8, 5), horizontal=True)
    img = Image.alpha_composite(img, bg_grad)
    draw = ImageDraw.Draw(img)

    margin = 4 * SCALE
    border_width = 6 * SCALE
    corner_radius = 16 * SCALE

    # Gold glow
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    draw_rounded_rect(
        glow_draw,
        (margin, margin, W - margin, H - margin),
        corner_radius,
        outline=(*gold, 200),
        width=border_width * 3,
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(15 * SCALE))
    img = Image.alpha_composite(img, glow_layer)
    draw = ImageDraw.Draw(img)

    # Inner fill
    inner_margin = margin + border_width
    draw_rounded_rect(
        draw,
        (inner_margin, inner_margin, W - inner_margin, H - inner_margin),
        corner_radius - 4 * SCALE,
        fill=(18, 15, 8, 240),
    )

    # Gold border
    draw_rounded_rect(
        draw,
        (margin, margin, W - margin, H - margin),
        corner_radius,
        outline=(*gold, 255),
        width=border_width,
    )
    # Inner thinner bright border
    draw_rounded_rect(
        draw,
        (
            margin + border_width // 2 + 2 * SCALE,
            margin + border_width // 2 + 2 * SCALE,
            W - margin - border_width // 2 - 2 * SCALE,
            H - margin - border_width // 2 - 2 * SCALE,
        ),
        corner_radius - 4 * SCALE,
        outline=(*gold_bright, 120),
        width=2 * SCALE,
    )

    # Left accent bar
    bar_x = margin + border_width + 8 * SCALE
    bar_w = 8 * SCALE
    bar_y1 = margin + corner_radius
    bar_y2 = H - margin - corner_radius
    accent_bar = create_gradient_bar(
        bar_w, bar_y2 - bar_y1, gold_dark, gold_bright, horizontal=False
    )
    img.paste(accent_bar, (bar_x, bar_y1), accent_bar)
    draw = ImageDraw.Draw(img)

    # Perforation separator
    sep_x = 100 * SCALE
    dash_len = 8 * SCALE
    gap_len = 6 * SCALE
    y = margin + corner_radius
    while y < H - margin - corner_radius:
        draw.line(
            [
                (sep_x, y),
                (sep_x, min(y + dash_len, H - margin - corner_radius)),
            ],
            fill=(*gold, 100),
            width=2 * SCALE,
        )
        y += dash_len + gap_len

    circle_r = 8 * SCALE
    draw.ellipse(
        [
            sep_x - circle_r,
            margin - circle_r // 2,
            sep_x + circle_r,
            margin + circle_r + circle_r // 2,
        ],
        fill=DARK_BG,
    )
    draw.ellipse(
        [
            sep_x - circle_r,
            H - margin - circle_r - circle_r // 2,
            sep_x + circle_r,
            H - margin + circle_r // 2,
        ],
        fill=DARK_BG,
    )

    # Trophy icon (left section)
    trophy_cx = 56 * SCALE
    trophy_cy = H // 2 - 4 * SCALE

    # Trophy cup body
    cup_w = 28 * SCALE
    cup_h = 24 * SCALE
    draw.polygon(
        [
            (trophy_cx - cup_w // 2, trophy_cy - cup_h // 2),
            (trophy_cx + cup_w // 2, trophy_cy - cup_h // 2),
            (trophy_cx + cup_w // 3, trophy_cy + cup_h // 3),
            (trophy_cx - cup_w // 3, trophy_cy + cup_h // 3),
        ],
        fill=(*gold, 220),
    )

    # Trophy rim
    draw.rectangle(
        [
            trophy_cx - cup_w // 2 - 3 * SCALE,
            trophy_cy - cup_h // 2 - 4 * SCALE,
            trophy_cx + cup_w // 2 + 3 * SCALE,
            trophy_cy - cup_h // 2 + 2 * SCALE,
        ],
        fill=(*gold_bright, 240),
    )

    # Trophy stem
    draw.rectangle(
        [
            trophy_cx - 3 * SCALE,
            trophy_cy + cup_h // 3,
            trophy_cx + 3 * SCALE,
            trophy_cy + cup_h // 3 + 6 * SCALE,
        ],
        fill=(*gold, 200),
    )

    # Trophy base
    base_w = 18 * SCALE
    draw.rectangle(
        [
            trophy_cx - base_w // 2,
            trophy_cy + cup_h // 3 + 6 * SCALE,
            trophy_cx + base_w // 2,
            trophy_cy + cup_h // 3 + 10 * SCALE,
        ],
        fill=(*gold_bright, 220),
    )

    # Handles
    handle_w = 6 * SCALE
    draw.arc(
        [
            trophy_cx - cup_w // 2 - handle_w - 2 * SCALE,
            trophy_cy - cup_h // 4,
            trophy_cx - cup_w // 2 + 2 * SCALE,
            trophy_cy + cup_h // 4,
        ],
        90,
        270,
        fill=(*gold, 200),
        width=3 * SCALE,
    )
    draw.arc(
        [
            trophy_cx + cup_w // 2 - 2 * SCALE,
            trophy_cy - cup_h // 4,
            trophy_cx + cup_w // 2 + handle_w + 2 * SCALE,
            trophy_cy + cup_h // 4,
        ],
        270,
        90,
        fill=(*gold, 200),
        width=3 * SCALE,
    )

    # Star on trophy
    star_r = 6 * SCALE
    star_points = []
    for i in range(10):
        angle = math.radians(i * 36 - 90)
        r = star_r if i % 2 == 0 else star_r * 0.45
        px = trophy_cx + r * math.cos(angle)
        py = trophy_cy - 2 * SCALE + r * math.sin(angle)
        star_points.append((px, py))
    draw.polygon(star_points, fill=(40, 30, 10, 255))

    # Right section text
    big_font = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 30 * SCALE)
    sub_font = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 12 * SCALE)
    brand_font = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 8 * SCALE)
    vip_font = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 14 * SCALE)

    text_x = (sep_x + W) // 2 + 10 * SCALE

    # VIP label
    draw.text(
        (text_x, H // 2 - 30 * SCALE),
        "\u2605 VIP \u2605",
        fill=(*gold_bright, 200),
        font=vip_font,
        anchor="mm",
    )

    # Main text with shadow
    shadow_offset = 3 * SCALE
    draw.text(
        (text_x + shadow_offset, H // 2 + 2 * SCALE + shadow_offset),
        "GOLDEN TICKET",
        fill=(0, 0, 0, 180),
        font=big_font,
        anchor="mm",
    )
    draw.text(
        (text_x, H // 2 + 2 * SCALE),
        "GOLDEN TICKET",
        fill=(*gold_shine, 255),
        font=big_font,
        anchor="mm",
    )

    # Subtitle
    draw.text(
        (text_x, H // 2 + 28 * SCALE),
        "ACCESO EXCLUSIVO",
        fill=(*gold, 180),
        font=sub_font,
        anchor="mm",
    )

    # Brand
    draw.text(
        (W - 20 * SCALE, H - 16 * SCALE),
        "COPA OMEGA \u2605",
        fill=(120, 100, 50, 150),
        font=brand_font,
        anchor="rm",
    )

    # Diagonal shine lines
    shine_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shine_draw = ImageDraw.Draw(shine_layer)
    for i in range(-H, W, 40 * SCALE):
        shine_draw.line(
            [(i, 0), (i + H, H)], fill=(*gold_shine, 8), width=15 * SCALE
        )
    img = Image.alpha_composite(img, shine_layer)

    # Scan lines
    draw = ImageDraw.Draw(img)
    for y_line in range(0, H, 4 * SCALE):
        draw.line([(0, y_line), (W, y_line)], fill=(0, 0, 0, 12), width=1)

    # Downscale
    final = img.resize((FINAL_W, FINAL_H), Image.LANCZOS)

    output_path = os.path.join(OUTPUT_DIR, filename)
    final.save(output_path, "PNG", optimize=True)
    print(f"Created: {output_path} ({os.path.getsize(output_path)} bytes)")


# Generate all
print("Generating vouchers at 4x resolution with LANCZOS downscaling...")
print()

create_voucher("voucher_5.png", "#3B82F6", "5% OFF", "DESCUENTO")
create_voucher("voucher_10.png", "#22C55E", "10% OFF", "DESCUENTO")
create_voucher("voucher_15.png", "#A855F7", "15% OFF", "DESCUENTO")
create_voucher("voucher_20.png", "#EF4444", "20% OFF", "DESCUENTO PREMIUM")
create_golden_ticket("golden_ticket.png")

print()
print("All vouchers generated successfully!")
