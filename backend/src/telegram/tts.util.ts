const MAX_TTS_CHARS = 200;
const TTS_TIMEOUT_MS = 8000;

/**
 * Google Tarjimon'ning hujjatlashtirilmagan matn-nutq endpointidan foydalanadi
 * (rasmiy TTS API emas — kalitsiz, bepul, lekin ogohlantirmasdan o'zgarishi
 * yoki bloklanishi mumkin). Shu sabab chaqiruvchi tomon xatoni tutib, ovozsiz
 * fallback qilishi kerak.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const truncated = text.slice(0, MAX_TTS_CHARS);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=uz&q=${encodeURIComponent(truncated)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`TTS so'rovi muvaffaqiyatsiz: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}
