import os
from PIL import Image, ImageDraw
import random

def generate_cover(name, color_theme, size=(512, 512)):
    # Create an image with a solid background
    img = Image.new('RGB', size, color_theme[0])
    draw = ImageDraw.Draw(img)
    
    # Draw some random shapes to make it look slightly less plain and ensure variance in pixels
    for _ in range(50):
        x1 = random.randint(0, size[0])
        y1 = random.randint(0, size[1])
        x2 = x1 + random.randint(20, 100)
        y2 = y1 + random.randint(20, 100)
        color = random.choice(color_theme)
        draw.rectangle([x1, y1, x2, y2], fill=color)
        
    covers_dir = os.path.join(os.path.dirname(__file__), 'covers')
    os.makedirs(covers_dir, exist_ok=True)
    
    img.save(os.path.join(covers_dir, f"{name}.png"))

if __name__ == "__main__":
    # Terrain (Greens/Browns)
    generate_cover('terrain', [(34, 139, 34), (85, 107, 47), (139, 69, 19)])
    # Map (Blues/Beige)
    generate_cover('map', [(245, 245, 220), (173, 216, 230), (70, 130, 180)])
    # Equipment (Greys)
    generate_cover('equipment', [(105, 105, 105), (128, 128, 128), (169, 169, 169)])
    print("Cover images generated.")
