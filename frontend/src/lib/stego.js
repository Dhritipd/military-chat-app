const API_URL = 'http://localhost:8000';
const DELIMITER = '1111111111111111';

export async function getRandomCoverImage() {
  const response = await fetch(`${API_URL}/stego/cover-image`);
  if (!response.ok) {
    throw new Error('Failed to fetch cover image');
  }
  return await response.blob();
}

export async function hideACKInImage(messageId, coverImageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(coverImageBlob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let binMsgId = messageId.toString(2);
      const dataToHide = binMsgId + DELIMITER;
      
      // Calculate capacity (skipping alpha channel, so 3 bits per pixel)
      if (dataToHide.length > (data.length / 4) * 3) {
        reject(new Error("Image too small to hold message ID"));
        return;
      }
      
      let dataIndex = 0;
      for (let i = 0; i < data.length; i++) {
        // Skip alpha channel (every 4th byte: 3, 7, 11...)
        if ((i + 1) % 4 === 0) continue;
        
        if (dataIndex < dataToHide.length) {
          data[i] = (data[i] & ~1) | parseInt(dataToHide[dataIndex], 10);
          dataIndex++;
        } else {
          break; // Done embedding
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'stego_ack.png', { type: 'image/png' }));
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load cover image into canvas"));
    };
    
    img.src = url;
  });
}
