<template>
  <div class="page-container import-page">
    <div class="page-header">
      <div>
        <div class="page-title">素材导入</div>
        <div class="page-subtitle">导入外部音视频、图片、文档等素材，统一管理口述史资源</div>
      </div>
      <div class="header-actions flex-between gap-12">
        <el-select v-model="filterType" placeholder="素材类型" clearable style="width: 130px;">
          <el-option label="音频" value="audio" />
          <el-option label="视频" value="video" />
          <el-option label="图片" value="image" />
          <el-option label="文档" value="document" />
        </el-select>
        <el-input v-model="searchText" placeholder="搜索素材" clearable style="width: 200px;" />
        <el-button type="primary" :icon="Upload" @click="triggerFileSelect">导入文件</el-button>
        <input ref="fileInputRef" type="file" multiple style="display: none;" @change="onFileSelect"
          :accept="acceptTypes" />
      </div>
    </div>

    <div class="upload-zone" v-if="showDropZone" @click="triggerFileSelect"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onFileDrop"
      :class="{ 'drag-over': dragOver }"
    >
      <el-icon :size="56" color="#a67c52"><UploadFilled /></el-icon>
      <p style="margin-top: 16px; font-size: 16px; color: var(--text-primary);">将文件拖拽到此处，或点击选择文件</p>
      <p style="margin-top: 6px; color: var(--text-light); font-size: 13px;">
        支持 MP3、WAV、MP4、MOV、AVI、JPG、PNG、PDF、DOC 等格式
      </p>
    </div>

    <el-tabs v-model="viewMode" class="view-tabs">
      <el-tab-pane label="列表视图" name="list">
        <el-table :data="filteredAssets" style="width: 100%" v-if="filteredAssets.length > 0" stripe>
          <el-table-column width="60" align="center">
            <template #default="{ row }">
              <div class="type-icon" :class="'type-icon-' + row.type">
                <el-icon :size="18">
                  <VideoCamera v-if="row.type === 'video'" />
                  <Microphone v-else-if="row.type === 'audio'" />
                  <Picture v-else-if="row.type === 'image'" />
                  <Document v-else />
                </el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180">
            <template #default="{ row }">
              <span class="asset-title" @click="viewAsset(row)">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名" min-width="160" show-overflow-tooltip />
          <el-table-column label="时长/大小" width="110">
            <template #default="{ row }">
              <span v-if="row.duration">{{ formatDuration(row.duration) }}</span>
              <span v-else>{{ formatFileSize(row.fileSize) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="受访人" width="110">
            <template #default="{ row }">{{ row.intervieweeId ? getIntervieweeName(row.intervieweeId) : '-' }}</template>
          </el-table-column>
          <el-table-column label="标签" width="180">
            <template #default="{ row }">
              <el-tag v-for="t in row.tags.slice(0, 3)" :key="t" size="small" effect="plain" style="margin-right: 4px;">{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="导入时间" width="170">
            <template #default="{ row }">{{ formatDate(row.importedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="editAsset(row)" v-if="canEdit(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="openTranscript(row)" v-if="row.type === 'audio' || row.type === 'video'">转写</el-button>
              <el-button link type="primary" size="small" @click="previewAsset(row)">预览</el-button>
              <el-button link type="danger" size="small" @click="deleteAsset(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="empty-state" v-else>
          <el-icon :size="56" color="#c4b8a8"><FolderOpened /></el-icon>
          <p style="margin-top: 16px;">暂无素材</p>
          <p class="text-muted" style="margin-top: 4px;">点击上方按钮导入口述史相关素材</p>
          <el-button type="primary" style="margin-top: 20px;" :icon="Upload" @click="triggerFileSelect">导入文件</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="卡片视图" name="card">
        <el-row :gutter="16" v-if="filteredAssets.length > 0">
          <el-col :span="6" v-for="asset in filteredAssets" :key="asset.id">
            <div class="asset-card" @click="viewAsset(asset)">
              <div class="asset-thumb" :class="'thumb-' + asset.type">
                <el-icon :size="40" color="#fff">
                  <VideoCamera v-if="asset.type === 'video'" />
                  <Microphone v-else-if="asset.type === 'audio'" />
                  <Picture v-else-if="asset.type === 'image'" />
                  <Document v-else />
                </el-icon>
                <div class="asset-badge" v-if="asset.duration">{{ formatDuration(asset.duration) }}</div>
                <div class="asset-badge" v-else>{{ formatFileSize(asset.fileSize) }}</div>
              </div>
              <div class="asset-info">
                <div class="asset-card-title">{{ asset.title }}</div>
                <div class="asset-card-meta text-small text-muted">{{ asset.fileName }}</div>
                <div class="asset-card-tags" v-if="asset.tags?.length">
                  <el-tag v-for="t in asset.tags.slice(0, 2)" :key="t" size="small" effect="plain">{{ t }}</el-tag>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="empty-state" v-else>
          <el-icon :size="56" color="#c4b8a8"><FolderOpened /></el-icon>
          <p style="margin-top: 16px;">暂无素材</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showEditDialog" title="编辑素材信息" width="560px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="素材标题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="素材类型">
          <el-select v-model="editForm.type" style="width: 100%;">
            <el-option label="音频" value="audio" />
            <el-option label="视频" value="video" />
            <el-option label="图片" value="image" />
            <el-option label="文档" value="document" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联计划">
          <el-select v-model="editForm.interviewPlanId" clearable filterable placeholder="选择采访计划" style="width: 100%;">
            <el-option v-for="p in planStore.plans" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="受访人">
          <el-select v-model="editForm.intervieweeId" clearable filterable placeholder="选择受访人" style="width: 100%;">
            <el-option v-for="p in intervieweeStore.interviewees" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="录制时间">
          <el-date-picker v-model="editForm.recordedAt" type="datetime" placeholder="选择录制时间" style="width: 100%;" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="主题标签">
          <el-select v-model="editForm.tags" multiple filterable placeholder="选择标签" style="width: 100%;">
            <el-option v-for="t in tagStore.tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="素材描述、内容说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPreviewDialog" title="素材预览" width="800px">
      <div class="preview-content" v-if="previewAssetData">
        <video v-if="previewAssetData.type === 'video'" controls style="width: 100%; max-height: 500px;">
          <source :src="previewAssetData.filePath" />
        </video>
        <audio v-else-if="previewAssetData.type === 'audio'" controls style="width: 100%;">
          <source :src="previewAssetData.filePath" />
        </audio>
        <img v-else-if="previewAssetData.type === 'image'" :src="previewAssetData.filePath" style="max-width: 100%; max-height: 500px;" />
        <div v-else class="doc-preview">
          <el-icon :size="64" color="#a67c52"><Document /></el-icon>
          <p style="margin-top: 16px;">文档类型预览暂不支持</p>
          <p class="text-muted" style="margin-top: 4px;">文件名：{{ previewAssetData.fileName }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload, UploadFilled, VideoCamera, Microphone, Picture, Document, FolderOpened
} from '@element-plus/icons-vue'
import { useMediaStore } from '@/stores/media'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useIntervieweeStore } from '@/stores/interviewee'
import { useProfileStore, useTagStore } from '@/stores/profile'
import { persistUploadedFile, persistExternalFile, isElectron } from '@/utils/persist'
import type { MediaAsset } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const mediaStore = useMediaStore()
const planStore = useInterviewPlanStore()
const intervieweeStore = useIntervieweeStore()
const tagStore = useTagStore()

const showDropZone = ref(true)
const dragOver = ref(false)
const filterType = ref('')
const searchText = ref('')
const viewMode = ref('list')
const fileInputRef = ref<HTMLInputElement | null>(null)
const showEditDialog = ref(false)
const showPreviewDialog = ref(false)
const previewAssetData = ref<MediaAsset | null>(null)

const editForm = reactive({
  id: '',
  title: '',
  type: 'audio' as MediaAsset['type'],
  interviewPlanId: '',
  intervieweeId: '',
  recordedAt: '',
  tags: [] as string[],
  description: ''
})

const acceptTypes = '.mp3,.wav,.m4a,.aac,.flac,.mp4,.mov,.avi,.mkv,.webm,.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt'

const filteredAssets = computed(() => {
  let result = mediaStore.assets
  if (filterType.value) result = result.filter(a => a.type === filterType.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    result = result.filter(a =>
      a.title.toLowerCase().includes(kw) ||
      a.fileName.toLowerCase().includes(kw) ||
      a.description?.toLowerCase().includes(kw)
    )
  }
  return [...result].sort((a, b) => b.importedAt.localeCompare(a.importedAt))
})

function getIntervieweeName(id: string) {
  return intervieweeStore.interviewees.find(p => p.id === id)?.name || '-'
}

function canEdit(row: MediaAsset) { return true }

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function detectFileType(fileName: string): MediaAsset['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext)) return 'audio'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
  return 'document'
}

async function triggerFileSelect() {
  if (window.electronAPI?.selectFiles) {
    const paths = await window.electronAPI.selectFiles([
      { name: '音视频', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'] },
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
      { name: '文档', extensions: ['pdf', 'doc', 'docx', 'txt'] },
      { name: '所有文件', extensions: ['*'] }
    ])
    if (paths?.length) {
      processPathsAsPromised(paths)
    }
  } else {
    fileInputRef.value?.click()
  }
}

function onFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) processFiles(Array.from(files))
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onFileDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files) processFiles(Array.from(files))
}

async function processPathsAsPromised(paths: string[]) {
  let count = 0
  for (const p of paths) {
    const result = await persistExternalFile(p)
    if (result) {
      const fileName = p.split(/[\\/]/).pop() || '未命名'
      const type = detectFileType(fileName)
      mediaStore.addAsset({
        type,
        title: fileName.replace(/\.[^.]+$/, ''),
        filePath: result.filePath,
        persistentPath: result.persistentPath,
        fileName,
        fileSize: result.size,
        format: fileName.split('.').pop(),
        tags: [],
        description: ''
      })
      count++
    }
  }
  if (count > 0) ElMessage.success(`已导入 ${count} 个文件（已持久化）`)
  else if (paths.length > 0) ElMessage.warning('文件导入失败，请检查路径是否有效')
}

async function processFiles(files: File[]) {
  let count = 0
  for (const file of files) {
    const type = detectFileType(file.name)
    const persisted = await persistUploadedFile(file)
    mediaStore.addAsset({
      type,
      title: file.name.replace(/\.[^.]+$/, ''),
      filePath: persisted.filePath,
      persistentPath: persisted.persistentPath,
      fileName: file.name,
      fileSize: persisted.size || file.size,
      format: file.name.split('.').pop(),
      tags: [],
      description: ''
    })
    count++
  }
  ElMessage.success(`已导入 ${count} 个文件${isElectron() ? '（已持久化）' : ''}`)
}

function viewAsset(asset: MediaAsset) { previewAsset(asset) }

function previewAsset(asset: MediaAsset) {
  previewAssetData.value = asset
  showPreviewDialog.value = true
}

function editAsset(asset: MediaAsset) {
  Object.assign(editForm, {
    id: asset.id,
    title: asset.title,
    type: asset.type,
    interviewPlanId: asset.interviewPlanId || '',
    intervieweeId: asset.intervieweeId || '',
    recordedAt: asset.recordedAt || '',
    tags: [...(asset.tags || [])],
    description: asset.description || ''
  })
  showEditDialog.value = true
}

function saveEdit() {
  if (!editForm.title.trim()) {
    ElMessage.warning('请输入素材标题')
    return
  }
  mediaStore.updateAsset(editForm.id, {
    title: editForm.title,
    type: editForm.type,
    interviewPlanId: editForm.interviewPlanId || undefined,
    intervieweeId: editForm.intervieweeId || undefined,
    recordedAt: editForm.recordedAt || undefined,
    tags: [...editForm.tags],
    description: editForm.description || undefined
  })
  ElMessage.success('保存成功')
  showEditDialog.value = false
}

function deleteAsset(asset: MediaAsset) {
  ElMessageBox.confirm(`确定删除素材「${asset.title}」吗？此操作不可恢复。`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    mediaStore.removeAsset(asset.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function openTranscript(asset: MediaAsset) {
  router.push(`/transcript/${asset.id}`)
}
</script>

<style scoped>
.import-page {
  min-height: 100%;
}

.upload-zone {
  border: 2px dashed var(--primary-light);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  background: #fffaf3;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--primary-color);
  background: #fff5e6;
}

.type-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.type-icon-video { background: #e3f2fd; color: #1976d2; }
.type-icon-audio { background: #fff3e0; color: #f57c00; }
.type-icon-image { background: #e8f5e9; color: #388e3c; }
.type-icon-document { background: #f3e5f5; color: #7b1fa2; }

.asset-title {
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
}

.asset-title:hover {
  color: var(--primary-color);
}

.view-tabs {
  margin-top: 8px;
}

.asset-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.asset-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.asset-thumb {
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.thumb-video { background: linear-gradient(135deg, #1565c0, #1976d2); }
.thumb-audio { background: linear-gradient(135deg, #e65100, #f57c00); }
.thumb-image { background: linear-gradient(135deg, #2e7d32, #388e3c); }
.thumb-document { background: linear-gradient(135deg, #6a1b9a, #7b1fa2); }

.asset-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.asset-info {
  padding: 12px;
}

.asset-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-card-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.asset-card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.doc-preview {
  padding: 40px;
  text-align: center;
  background: #faf8f5;
  border-radius: 8px;
}

.preview-content {
  display: flex;
  justify-content: center;
  background: #000;
  border-radius: 8px;
  padding: 12px;
}
</style>
