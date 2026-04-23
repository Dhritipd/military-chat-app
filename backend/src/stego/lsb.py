import os
from PIL import Image
import numpy as np

DELIMITER = '1111111111111111'  # 16 bits of 1s as delimiter

def hide_ack_in_image(message_id: int, cover_image_path: str) -> str:
    """
    Embeds the message_id into the cover image using LSB steganography.
    Returns the path to the resulting stego image.
    """
    # Convert message_id to binary without '0b' prefix
    bin_msg_id = bin(message_id)[2:]
    # Append delimiter
    data_to_hide = bin_msg_id + DELIMITER
    
    # Load image and force RGB to avoid alpha channel premultiplication issues
    img = Image.open(cover_image_path).convert('RGB')
    img_data = np.array(img)
    
    # Flatten the image data to make it easier to iterate over pixels
    flat_data = img_data.flatten()
    
    if len(data_to_hide) > len(flat_data):
        raise ValueError("Image is too small to hold the message ID")
    
    # Modify the LSB of each color channel
    for i in range(len(data_to_hide)):
        # Clear the least significant bit and set it to the data bit
        flat_data[i] = (flat_data[i] & ~1) | int(data_to_hide[i])
        
    # Reshape back to original image shape
    stego_data = flat_data.reshape(img_data.shape)
    stego_img = Image.fromarray(stego_data)
    
    # Save stego image
    directory = os.path.dirname(cover_image_path)
    filename = os.path.basename(cover_image_path)
    stego_image_path = os.path.join(directory, f"stego_{filename}")
    
    stego_img.save(stego_image_path)
    return stego_image_path

def extract_ack_from_image(stego_image_path: str) -> int:
    """
    Extracts the message_id from the stego image.
    """
    img = Image.open(stego_image_path).convert('RGB')
    img_data = np.array(img)
    flat_data = img_data.flatten()
    
    extracted_bits = []
    
    for pixel_val in flat_data:
        # Extract LSB
        extracted_bits.append(str(pixel_val & 1))
        
        # Check if we have extracted enough bits for the delimiter
        if len(extracted_bits) >= len(DELIMITER):
            # Check the last bits against the delimiter
            if ''.join(extracted_bits[-len(DELIMITER):]) == DELIMITER:
                # Remove delimiter and convert the rest back to integer
                bin_msg_id = ''.join(extracted_bits[:-len(DELIMITER)])
                if bin_msg_id == '':
                    raise ValueError("No message ID found before delimiter")
                return int(bin_msg_id, 2)
                
    raise ValueError("Delimiter not found in image")
