export const ALLOWED_CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_UPLOAD_SIZE_MB = 10

export function isFileValid(file: File) {
  const isTypeAllowed = ALLOWED_CERT_TYPES.includes(file.type)
  const isSizeAllowed = file.size / 1024 / 1024 <= MAX_UPLOAD_SIZE_MB
  return { isTypeAllowed, isSizeAllowed }
}
