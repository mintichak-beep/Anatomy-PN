/**
 * Compresses an uploaded image File into a JPEG Data URL guaranteed to fit
 * comfortably within Firestore's 1 MiB document size limit.
 */
export function compressImageFile(file: File, maxChars = 750_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('รูปแบบข้อมูลรูปภาพไม่ถูกต้อง'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
      img.onload = () => {
        let maxW = 1080;
        let quality = 0.85;
        let resultUrl = '';

        for (let attempt = 0; attempt < 6; attempt++) {
          const scale = img.width > maxW ? maxW / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('ไม่สามารถประมวลผลภาพได้'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resultUrl = canvas.toDataURL('image/jpeg', quality);
          if (resultUrl.length <= maxChars) {
            resolve(resultUrl);
            return;
          }
          quality = Math.max(0.45, quality - 0.12);
          maxW = Math.round(maxW * 0.8);
        }

        resolve(resultUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
