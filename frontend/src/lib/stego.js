const API_URL = 'http://localhost:8000';
const DELIMITER = '1111111111111111';

export async function getRandomCoverImage(projectId = 0) {
  const response = await fetch(`${API_URL}/stego/cover-image?project_id=${projectId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cover image');
  }
  return await response.blob();
}

class PRNG {
  constructor(seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) >>> 0;
    }
    this.state = seed;
  }
  
  nextInt(maxVal) {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return Math.floor((this.state / 4294967296.0) * maxVal);
  }
}

export function getHidingMethod(sensitivity) {
  const sens = sensitivity.toLowerCase();
  if (sens === 'medium') return 'spread_spectrum';
  if (sens === 'high') return 'tcp_timestamp'; // placeholder
  return 'lsb';
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

export async function hideACKSpreadSpectrum(messageId, coverImageBlob, key) {
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
      
      const totalElements = canvas.width * canvas.height * 3;
      const prng = new PRNG(key);
      const binMsgStr = messageId.toString(2).padStart(32, '0');
      const spreadFactor = 51;
      
      for (let i = 0; i < binMsgStr.length; i++) {
        const bit = parseInt(binMsgStr[i], 10);
        for (let j = 0; j < spreadFactor; j++) {
          const idx = prng.nextInt(totalElements);
          const chip = prng.nextInt(2);
          
          const pixelIdx = Math.floor(idx / 3);
          const channel = idx % 3;
          
          const dataIndex = pixelIdx * 4 + channel;
          
          const targetLsb = bit ^ chip;
          const currentLsb = data[dataIndex] & 1;
          
          if (currentLsb !== targetLsb) {
            if (data[dataIndex] < 255) {
              data[dataIndex] += 1;
            } else {
              data[dataIndex] -= 1;
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'stego_spread.png', { type: 'image/png' }));
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load cover image into canvas"));
    };
    
    img.src = url;
  });
}
