import type { LostPhoto } from './lostFound'

export async function prepareLostPhoto(file: File): Promise<LostPhoto> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPG, PNG, WebP 사진을 선택해 주세요.')
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('사진 한 장의 크기는 10MB 이하로 선택해 주세요.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('사진을 처리할 수 없어요.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return { id: crypto.randomUUID(), src: canvas.toDataURL('image/webp', 0.82) }
  } catch {
    throw new Error('사진을 읽지 못했어요. 다른 JPG, PNG, WebP 사진을 선택해 주세요.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
