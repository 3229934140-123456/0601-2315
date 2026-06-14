import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: (filters?: Array<{ name: string; extensions: string[] }>) =>
    ipcRenderer.invoke('select-files', filters),
  saveFile: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }>; content?: string }) =>
    ipcRenderer.invoke('save-file', options),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})
