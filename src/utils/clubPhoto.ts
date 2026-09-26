export const MAX_CLUB_PHOTO_BYTES = 10 * 1024 * 1024

export function validateClubPhoto(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('JPG 또는 PNG 사진을 선택해 주세요.')
  if (file.size === 0) throw new Error('비어 있는 파일입니다. 다른 사진을 선택해 주세요.')
  if (file.size > MAX_CLUB_PHOTO_BYTES) throw new Error('사진은 10MB 이하로 선택해 주세요.')
}
