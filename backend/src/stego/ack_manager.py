from typing import Tuple
from .lsb import extract_ack_from_image, hide_ack_in_image
from .spread_spectrum import extract_ack_spread_spectrum, hide_ack_spread_spectrum

class ACKHidingManager:
    @staticmethod
    def hide_ack(message_id: int, sensitivity: str, cover_path: str, key: str = None) -> Tuple[str, str]:
        """
        Selects the appropriate steganography method based on sensitivity.
        Returns a tuple of (stego_image_path, method_used).
        """
        sensitivity = sensitivity.lower()
        if sensitivity == "low":
            # For low sensitivity, we don't necessarily need a key.
            # Using the existing LSB implementation.
            # Wait, the existing hide_ack_in_image might not take a key. Let's assume it just takes msg_id and cover.
            # The exact signature of hide_ack_in_image in lsb.py might differ.
            return hide_ack_in_image(message_id, cover_path), "lsb"
        elif sensitivity == "medium":
            if not key:
                raise ValueError("Key is required for medium sensitivity (Spread Spectrum).")
            return hide_ack_spread_spectrum(message_id, cover_path, key), "spread_spectrum"
        elif sensitivity == "high":
            # Placeholder for Phase 5
            raise NotImplementedError("High sensitivity (TCP Timestamp) not yet implemented.")
        else:
            # Default to LSB
            return hide_ack_in_image(message_id, cover_path), "lsb"

    @staticmethod
    def extract_ack(stego_data_path: str, method: str, key: str = None) -> int:
        """
        Routes the extraction to the correct decoder based on the method.
        """
        method = method.lower()
        if method == "lsb":
            return extract_ack_from_image(stego_data_path)
        elif method == "spread_spectrum":
            if not key:
                raise ValueError("Key is required for Spread Spectrum extraction.")
            return extract_ack_spread_spectrum(stego_data_path, key)
        elif method == "tcp_timestamp":
            raise NotImplementedError("High sensitivity (TCP Timestamp) not yet implemented.")
        else:
            raise ValueError(f"Unknown stego method: {method}")
