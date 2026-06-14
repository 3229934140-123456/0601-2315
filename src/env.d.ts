/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const zhCn: any
  export default zhCn
}

declare interface Window {
  electronAPI: {
    selectDirectory: () => Promise<string[]>
    selectFiles: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<string[]>
    saveFile: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }>; content?: string }) => Promise<boolean>
    readFile: (filePath: string) => Promise<string | null>
    getUserDataPath: () => Promise<string>
    openExternal: (url: string) => Promise<void>
    getMediaDir: () => Promise<string>
    saveMediaFile: (data: { name: string; type: string; base64: string }) => Promise<{ path: string; url: string; size: number } | null>
    copyFileToMedia: (srcPath: string) => Promise<{ path: string; url: string; size: number } | null>
    fileExists: (filePath: string) => Promise<boolean>
    getFileUrl: (filePath: string) => Promise<string>
  }
}
