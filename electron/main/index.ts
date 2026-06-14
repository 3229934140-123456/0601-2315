import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let mediaDir: string

function ensureMediaDir() {
  mediaDir = path.join(app.getPath('userData'), 'media')
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true })
  }
  return mediaDir
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'oralhistory', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

function createWindow() {
  protocol.handle('oralhistory', (request) => {
    const url = request.url.replace('oralhistory://media/', '')
    const filePath = path.join(mediaDir, decodeURIComponent(url))
    if (fs.existsSync(filePath)) {
      return net.fetch('file://' + filePath)
    }
    return new Response('Not Found', { status: 404 })
  })

  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 768,
    title: '口述史采录工作站',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  ensureMediaDir()
  createWindow()
})

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths
})

ipcMain.handle('select-files', async (_event, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.filePaths
})

ipcMain.handle('save-file', async (_event, options) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath || 'untitled.txt',
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  if (result.filePath) {
    fs.writeFileSync(result.filePath, options.content || '', 'utf-8')
    return true
  }
  return false
})

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    return null
  }
})

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('get-media-dir', () => {
  return mediaDir
})

ipcMain.handle('save-media-file', async (_event, data: { name: string; type: string; base64: string }) => {
  try {
    ensureMediaDir()
    const timestamp = Date.now()
    const safeName = data.name.replace(/[\\/:*?"<>|]/g, '_')
    const ext = path.extname(safeName) || (data.type.includes('video') ? '.webm' : data.type.includes('audio') ? '.webm' : '.bin')
    const finalName = `${timestamp}_${safeName}`
    const fullPath = path.join(mediaDir, finalName)
    const buffer = Buffer.from(data.base64, 'base64')
    fs.writeFileSync(fullPath, buffer)
    return {
      path: fullPath,
      url: `oralhistory://media/${encodeURIComponent(finalName)}`,
      size: buffer.length
    }
  } catch (e) {
    console.error('save-media-file error:', e)
    return null
  }
})

ipcMain.handle('copy-file-to-media', async (_event, srcPath: string) => {
  try {
    ensureMediaDir()
    if (!fs.existsSync(srcPath)) return null
    const timestamp = Date.now()
    const baseName = path.basename(srcPath)
    const safeName = baseName.replace(/[\\/:*?"<>|]/g, '_')
    const finalName = `${timestamp}_${safeName}`
    const destPath = path.join(mediaDir, finalName)
    fs.copyFileSync(srcPath, destPath)
    const stat = fs.statSync(destPath)
    return {
      path: destPath,
      url: `oralhistory://media/${encodeURIComponent(finalName)}`,
      size: stat.size
    }
  } catch (e) {
    console.error('copy-file-to-media error:', e)
    return null
  }
})

ipcMain.handle('file-exists', async (_event, filePath: string) => {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
})

ipcMain.handle('get-file-url', async (_event, filePath: string) => {
  if (filePath.startsWith('oralhistory://')) return filePath
  if (filePath.startsWith('file://') || filePath.startsWith('blob:')) return filePath
  const baseName = path.basename(filePath)
  const inMedia = path.join(mediaDir, baseName)
  if (fs.existsSync(inMedia)) {
    return `oralhistory://media/${encodeURIComponent(baseName)}`
  }
  return filePath
})
