export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function persistBlobFile(
  blob: Blob,
  fileName: string,
  mimeType?: string
): Promise<{ filePath: string; persistentPath: string; size: number }> {
  try {
    if (window.electronAPI?.saveMediaFile) {
      const base64 = await blobToBase64(blob)
      const result = await window.electronAPI.saveMediaFile({
        name: fileName,
        type: mimeType || blob.type,
        base64
      })
      if (result) {
        return {
          filePath: result.url,
          persistentPath: result.path,
          size: result.size
        }
      }
    }
  } catch (e) {
    console.warn('[persistBlobFile] Electron API 不可用，降级为 blob URL:', e)
  }
  const url = URL.createObjectURL(blob)
  return {
    filePath: url,
    persistentPath: '',
    size: blob.size
  }
}

export async function persistExternalFile(
  srcPath: string
): Promise<{ filePath: string; persistentPath: string; size: number } | null> {
  try {
    if (window.electronAPI?.copyFileToMedia) {
      const result = await window.electronAPI.copyFileToMedia(srcPath)
      if (result) {
        return {
          filePath: result.url,
          persistentPath: result.path,
          size: result.size
        }
      }
    }
  } catch (e) {
    console.warn('[persistExternalFile] 复制失败:', e)
  }
  return null
}

export async function persistUploadedFile(
  file: File
): Promise<{ filePath: string; persistentPath: string; size: number }> {
  const blob = file.slice(0, file.size, file.type)
  return persistBlobFile(blob, file.name, file.type)
}

export function isElectron(): boolean {
  return !!(window.electronAPI && window.electronAPI.getUserDataPath)
}
