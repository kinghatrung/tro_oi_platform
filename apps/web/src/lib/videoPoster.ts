const POSTER_MAX_WIDTH = 1280;
const TIMEOUT_MS = 10_000;

/** Chờ 1 sự kiện của thẻ video; lỗi giải mã / quá lâu → reject. */
const once = (video: HTMLVideoElement, event: 'loadeddata' | 'seeked') =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
    video.addEventListener(
      event,
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
    video.addEventListener('error', () => reject(new Error('decode')), { once: true });
  });

/**
 * Chụp 1 khung hình (giây thứ 1, video ngắn hơn 2s thì giữa video) làm ảnh bìa JPEG ngay trên trình
 * duyệt — server không cần ffmpeg. Trình duyệt không giải mã được (vd MOV HEVC trên Chrome) → null.
 */
export async function captureVideoPoster(file: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  try {
    await once(video, 'loadeddata');
    if (!video.videoWidth) return null;
    const seeked = once(video, 'seeked');
    video.currentTime = Math.min(1, (video.duration || 0) / 2);
    await seeked;
    const scale = Math.min(1, POSTER_MAX_WIDTH / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
