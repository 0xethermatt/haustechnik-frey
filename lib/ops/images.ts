/** Bildaufbereitung im Browser: Fotos werden vor dem Hochladen verkleinert (spart Speicher und Datenvolumen). */

export const FULL_MAX_EDGE = 1600
export const THUMB_MAX_EDGE = 400

export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Das Bild konnte nicht gelesen werden.'))
    }
    img.src = url
  })
}

function toJpeg(img: HTMLImageElement, maxEdge: number, quality: number, name: string): Promise<File> {
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Bildverarbeitung nicht verfügbar.'))
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], name, { type: 'image/jpeg' })) : reject(new Error('Bild konnte nicht umgewandelt werden.'))), 'image/jpeg', quality),
  )
}

/** Foto (auch HEIC vom iPhone, sofern der Browser es lesen kann) → verkleinertes JPEG + Vorschaubild. */
export async function prepareImage(file: File): Promise<{ full: File; thumb: File }> {
  const img = await loadImage(file)
  const [full, thumb] = await Promise.all([toJpeg(img, FULL_MAX_EDGE, 0.8, 'foto.jpg'), toJpeg(img, THUMB_MAX_EDGE, 0.7, 'vorschau.jpg')])
  return { full, thumb }
}
