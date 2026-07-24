#!/usr/bin/env python3
"""
Python + Pillow Certificate Generator Script
Usage:
  python generate_certificate.py --template path/to/template.png \
                                 --config '{"name": {"x": 500, "y": 410, "size": 52, "color": "#000000", "align": "center"}, "rollNo": {"x": 500, "y": 470, "size": 28, "color": "#444444", "align": "center"}}' \
                                 --name "Arun Kumar S" \
                                 --roll "21CS101" \
                                 --output output.png
"""

import sys
import json
import argparse
from PIL import Image, ImageDraw, ImageFont

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return (0, 0, 0)

def generate_certificate(template_path, config_json, name, roll_no, output_path):
    config = json.loads(config_json) if isinstance(config_json, str) else config_json
    
    # Load template image
    img = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    fields = [("name", name), ("rollNo", roll_no)]
    
    for field_key, text_val in fields:
        if field_key not in config or not text_val:
            continue
            
        field_cfg = config[field_key]
        x = field_cfg.get("x", 500)
        y = field_cfg.get("y", 400)
        font_size = field_cfg.get("size", 40)
        color = hex_to_rgb(field_cfg.get("color", "#000000"))
        align = field_cfg.get("align", "center")
        
        try:
            # Use default font if custom font file is not found
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()
            
        # Draw text with alignment
        if hasattr(draw, 'textbbox'):
            bbox = draw.textbbox((0, 0), text_val, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        else:
            text_width, text_height = draw.textsize(text_val, font=font)
            
        draw_x = x
        if align == "center":
            draw_x = x - (text_width / 2)
        elif align == "right":
            draw_x = x - text_width
            
        draw.text((draw_x, y - (text_height / 2)), text_val, fill=color, font=font)
        
    img.save(output_path)
    print(f"Successfully generated certificate: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Certificate using Python Pillow")
    parser.add_argument("--template", required=True, help="Path to template image")
    parser.add_argument("--config", required=True, help="JSON configuration string")
    parser.add_argument("--name", required=True, help="Student Name")
    parser.add_argument("--roll", required=True, help="Student Roll Number")
    parser.add_argument("--output", required=True, help="Output image file path")
    
    args = parser.parse_args()
    generate_certificate(args.template, args.config, args.name, args.roll, args.output)
