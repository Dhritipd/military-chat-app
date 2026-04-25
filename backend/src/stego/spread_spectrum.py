import os
from PIL import Image

class PRNG:
    def __init__(self, seed_str: str):
        seed = 0
        for char in seed_str:
            seed = ((seed << 5) - seed + ord(char)) & 0xFFFFFFFF
        self.state = seed

    def next_int(self, max_val: int) -> int:
        self.state = (1664525 * self.state + 1013904223) & 0xFFFFFFFF
        return int((self.state / 4294967296.0) * max_val)

def hide_ack_spread_spectrum(message_id: int, cover_image_path: str, key: str) -> str:
    img = Image.open(cover_image_path)
    # Ensure image is RGB
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    pixels = img.load()
    width, height = img.size
    total_elements = width * height * 3
    
    prng = PRNG(key)
    
    # Convert message_id to 32-bit binary string
    bin_msg = format(message_id, '032b')
    spread_factor = 51
    
    for bit_char in bin_msg:
        bit = int(bit_char)
        for _ in range(spread_factor):
            idx = prng.next_int(total_elements)
            chip = prng.next_int(2)
            
            # Map linear index to x, y, channel
            pixel_idx = idx // 3
            channel = idx % 3
            y = pixel_idx // width
            x = pixel_idx % width
            
            target_lsb = bit ^ chip
            
            rgb = list(pixels[x, y])
            current_lsb = rgb[channel] & 1
            
            if current_lsb != target_lsb:
                if rgb[channel] < 255:
                    rgb[channel] += 1
                else:
                    rgb[channel] -= 1
            
            pixels[x, y] = tuple(rgb)
            
    output_path = f"temp_spread_{message_id}.png"
    img.save(output_path, "PNG")
    return output_path

def extract_ack_spread_spectrum(stego_image_path: str, key: str) -> int:
    img = Image.open(stego_image_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    pixels = img.load()
    width, height = img.size
    total_elements = width * height * 3
    
    prng = PRNG(key)
    spread_factor = 51
    
    extracted_bits = []
    
    for _ in range(32):
        votes_1 = 0
        votes_0 = 0
        for _ in range(spread_factor):
            idx = prng.next_int(total_elements)
            chip = prng.next_int(2)
            
            pixel_idx = idx // 3
            channel = idx % 3
            y = pixel_idx // width
            x = pixel_idx % width
            
            rgb = pixels[x, y]
            current_lsb = rgb[channel] & 1
            
            extracted_bit = current_lsb ^ chip
            if extracted_bit == 1:
                votes_1 += 1
            else:
                votes_0 += 1
                
        if votes_1 > votes_0:
            extracted_bits.append('1')
        else:
            extracted_bits.append('0')
            
    bin_str = "".join(extracted_bits)
    return int(bin_str, 2)
