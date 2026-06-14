<template>
  <div class="page-container export-page">
    <div class="page-header">
      <div>
        <div class="page-title">成果导出</div>
        <div class="page-subtitle">整理采访成果，生成字幕、文稿和内容摘要</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="9">
        <div class="card">
          <div class="card-title">选择素材</div>
          <el-select
            v-model="selectedAssetIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择要导出的音视频素材"
            style="width: 100%;"
            size="large"
          >
            <el-option-group v-for="group in assetGroups" :key="group.type" :label="group.label">
              <el-option v-for="a in group.items" :key="a.id" :label="a.title" :value="a.id">
                <span>{{ a.title }}</span>
                <span class="text-small text-muted" style="margin-left: 8px;">
                  {{ formatDuration(a.duration || 0) }}
                </span>
              </el-option>
            </el-option-group>
          </el-select>

          <el-divider />

          <div class="card-title mb-12">导出类型</div>
          <div class="export-types">
            <div class="export-type-item" :class="{ active: exportTypes.includes('srt') }" @click="toggleExportType('srt')">
              <div class="type-icon" style="background: #e3f2fd; color: #1565c0;">
                <el-icon :size="22"><Document /></el-icon>
              </div>
              <div class="type-info">
                <div class="type-name">SRT 字幕</div>
                <div class="type-desc text-small text-muted">通用字幕格式</div>
              </div>
              <el-checkbox :model-value="exportTypes.includes('srt')" />
            </div>

            <div class="export-type-item" :class="{ active: exportTypes.includes('vtt') }" @click="toggleExportType('vtt')">
              <div class="type-icon" style="background: #e8f5e9; color: #2e7d32;">
                <el-icon :size="22"><Document /></el-icon>
              </div>
              <div class="type-info">
                <div class="type-name">VTT 字幕</div>
                <div class="type-desc text-small text-muted">WebVTT 网页字幕</div>
              </div>
              <el-checkbox :model-value="exportTypes.includes('vtt')" />
            </div>

            <div class="export-type-item" :class="{ active: exportTypes.includes('txt') }" @click="toggleExportType('txt')">
              <div class="type-icon" style="background: #fff3e0; color: #e65100;">
                <el-icon :size="22"><Tickets /></el-icon>
              </div>
              <div class="type-info">
                <div class="type-name">纯文本</div>
                <div class="type-desc text-small text-muted">TXT 文稿</div>
              </div>
              <el-checkbox :model-value="exportTypes.includes('txt')" />
            </div>

            <div class="export-type-item" :class="{ active: exportTypes.includes('markdown') }" @click="toggleExportType('markdown')">
              <div class="type-icon" style="background: #f3e5f5; color: #7b1fa2;">
                <el-icon :size="22"><Notebook /></el-icon>
              </div>
              <div class="type-info">
                <div class="type-name">Markdown</div>
                <div class="type-desc text-small text-muted">结构化文稿</div>
              </div>
              <el-checkbox :model-value="exportTypes.includes('markdown')" />
            </div>
          </div>

          <el-divider />

          <div class="card-title mb-12">导出选项</div>
          <div class="export-options">
            <el-form label-position="top">
              <el-form-item>
                <el-checkbox v-model="exportOptions.includeTimestamps">包含时间戳</el-checkbox>
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="exportOptions.includeAnnotations">包含标注说明（方言词、技艺名词等）</el-checkbox>
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="exportOptions.includeTags">包含主题标签</el-checkbox>
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="exportOptions.generateSummary">自动生成内容摘要</el-checkbox>
              </el-form-item>
            </el-form>
          </div>

          <div class="export-actions mt-16">
            <el-button size="large" type="primary" :icon="Download" style="width: 100%;" @click="doExport" :disabled="!canExport">
              开始导出
            </el-button>
          </div>
        </div>
      </el-col>

      <el-col :span="15">
        <div class="card preview-card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">
              <span>导出预览</span>
              <span class="text-small text-muted" style="margin-left: 8px;" v-if="selectedAssets.length">
                共 {{ selectedAssets.length }} 个素材
              </span>
            </div>
            <div class="flex-between gap-8">
              <el-radio-group v-model="previewFormat" size="small">
                <el-radio-button value="srt">SRT</el-radio-button>
                <el-radio-button value="vtt">VTT</el-radio-button>
                <el-radio-button value="txt">TXT</el-radio-button>
                <el-radio-button value="markdown">MD</el-radio-button>
              </el-radio-group>
              <el-button size="small" :icon="Refresh" @click="refreshPreview">刷新</el-button>
            </div>
          </div>

          <div class="preview-content" v-if="previewText">
            <pre class="preview-text">{{ previewText }}</pre>
          </div>
          <div v-else class="empty-state" style="padding: 40px;">
            <el-icon :size="48" color="#c4b8a8"><Document /></el-icon>
            <p style="margin-top: 12px;">请选择素材并设置导出选项</p>
            <p class="text-muted" style="margin-top: 4px;">预览将显示在这里</p>
          </div>
        </div>

        <div class="card" v-if="exportOptions.generateSummary && selectedAssets.length">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">AI 内容摘要</div>
            <el-button size="small" type="primary" :icon="MagicStick" @click="generateSummary">
              生成摘要
            </el-button>
          </div>
          <div v-if="generatedSummary">
            <div class="summary-section mb-16">
              <div class="summary-title">内容概述</div>
              <p class="summary-content">{{ generatedSummary.overview }}</p>
            </div>
            <div class="summary-section mb-16">
              <div class="summary-title">关键主题</div>
              <div>
                <el-tag v-for="t in generatedSummary.keyTopics" :key="t" style="margin: 4px;" effect="plain">{{ t }}</el-tag>
              </div>
            </div>
            <div class="summary-section mb-16">
              <div class="summary-title">重要人物</div>
              <div>
                <el-tag v-for="p in generatedSummary.keyPersons" :key="p" style="margin: 4px;" type="primary" effect="plain">{{ p }}</el-tag>
              </div>
            </div>
            <div class="summary-section">
              <div class="summary-title">精彩片段索引</div>
              <div class="highlights">
                <div v-for="(h, idx) in generatedSummary.highlights" :key="idx" class="highlight-item">
                  <span class="highlight-time" @click="jumpToSegment(h.assetId, h.time)">{{ formatTime(h.time) }}</span>
                  <span class="highlight-text">{{ h.text }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 20px;">
            <p class="text-muted">点击上方按钮自动生成内容摘要和精彩片段</p>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Download, Document, Tickets, Notebook, Refresh, MagicStick
} from '@element-plus/icons-vue'
import { useMediaStore } from '@/stores/media'
import { transcriptStore } from '@/stores/storage'
import type { TranscriptSegment } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const mediaStore = useMediaStore()

const selectedAssetIds = ref<string[]>([])
const exportTypes = ref<string[]>(['srt', 'markdown'])
const previewFormat = ref('markdown')
const previewText = ref('')
const transcriptCache = ref<Record<string, TranscriptSegment[]>>({})
const generatedSummary = ref<{
  overview: string
  keyTopics: string[]
  keyPersons: string[]
  highlights: Array<{ assetId: string; time: number; text: string }>
} | null>(null)

const exportOptions = reactive({
  includeTimestamps: true,
  includeAnnotations: true,
  includeTags: true,
  generateSummary: true
})

const assetGroups = computed(() => [
  { type: 'video', label: '视频素材', items: mediaStore.videoAssets },
  { type: 'audio', label: '音频素材', items: mediaStore.audioAssets }
])

const selectedAssets = computed(() =>
  mediaStore.assets.filter(a => selectedAssetIds.value.includes(a.id))
)

const canExport = computed(() => selectedAssetIds.value.length > 0 && exportTypes.value.length > 0)

function loadTranscriptsForAssets() {
  if (selectedAssetIds.value.length === 0) {
    transcriptCache.value = {}
    return
  }
  transcriptCache.value = transcriptStore.getByMultipleAssets(selectedAssetIds.value)
}

watch(selectedAssetIds, () => {
  loadTranscriptsForAssets()
  refreshPreview()
}, { deep: true })

watch([previewFormat, exportOptions], () => {
  refreshPreview()
}, { deep: true })

function toggleExportType(type: string) {
  const idx = exportTypes.value.indexOf(type)
  if (idx > -1) {
    exportTypes.value.splice(idx, 1)
  } else {
    exportTypes.value.push(type)
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}分${s}秒`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

function refreshPreview() {
  if (selectedAssets.value.length === 0) {
    previewText.value = ''
    return
  }
  previewText.value = generateContent(previewFormat.value)
}

function generateContent(format: string): string {
  const lines: string[] = []
  selectedAssets.value.forEach((asset, assetIdx) => {
    const transcripts = transcriptCache.value[asset.id] || []

    if (format === 'srt') {
      lines.push(`# ${asset.title}`)
      lines.push('')
      if (transcripts.length === 0) {
        lines.push('1')
        lines.push('00:00:00,000 --> 00:00:00,000')
        lines.push('（暂无转写内容）')
        lines.push('')
      } else {
        transcripts.forEach((seg, i) => {
          lines.push(String(i + 1))
          lines.push(`${formatSrtTime(seg.startTime)} --> ${formatSrtTime(seg.endTime)}`)
          lines.push(seg.text || '(无内容)')
          if (exportOptions.includeAnnotations && seg.annotations.length) {
            seg.annotations.forEach(a => {
              const typeMap: Record<string, string> = { dialect: '方言', skill: '技艺', person: '人物', place: '地点', event: '事件' }
              lines.push(`【${typeMap[a.type] || a.type}】${a.term}${a.explanation ? ' - ' + a.explanation : ''}`)
            })
          }
          lines.push('')
        })
      }
      if (assetIdx < selectedAssets.value.length - 1) lines.push('')
    } else if (format === 'vtt') {
      if (assetIdx === 0) {
        lines.push('WEBVTT')
        lines.push('')
      }
      lines.push(`NOTE ${asset.title}`)
      lines.push('')
      if (transcripts.length === 0) {
        lines.push('1')
        lines.push('00:00:00.000 --> 00:00:00.000')
        lines.push('（暂无转写内容）')
        lines.push('')
      } else {
        transcripts.forEach((seg, i) => {
          lines.push(String(i + 1))
          lines.push(`${formatVttTime(seg.startTime)} --> ${formatVttTime(seg.endTime)}`)
          lines.push(seg.text || '')
          lines.push('')
        })
      }
    } else if (format === 'txt') {
      if (selectedAssets.value.length > 1) {
        lines.push(`【${asset.title}】`)
        lines.push('')
      }
      if (transcripts.length === 0) {
        lines.push('（暂无转写内容）')
        lines.push('')
      } else {
        transcripts.forEach(seg => {
          if (exportOptions.includeTimestamps) {
            lines.push(`[${formatTime(seg.startTime)}] ${seg.text || ''}`)
          } else {
            lines.push(seg.text || '')
          }
          if (exportOptions.includeAnnotations && seg.annotations.length) {
            seg.annotations.forEach(a => {
              const typeMap: Record<string, string> = { dialect: '方言词', skill: '技艺名词', person: '人物', place: '地点', event: '事件' }
              lines.push(`（${typeMap[a.type] || a.type}：${a.term}${a.explanation ? ' — ' + a.explanation : ''}）`)
            })
          }
        })
      }
      if (assetIdx < selectedAssets.value.length - 1) lines.push('')
    } else if (format === 'markdown') {
      if (assetIdx === 0) {
        lines.push(`# 口述史采访文稿`)
        lines.push('')
        lines.push(`> 导出时间：${dayjs().format('YYYY年MM月DD日 HH:mm')}`)
        lines.push('')
      }
      lines.push(`## ${asset.title}`)
      lines.push('')
      if (asset.description) {
        lines.push(`> ${asset.description}`)
        lines.push('')
      }
      if (exportOptions.includeTags && asset.tags?.length) {
        lines.push(`**标签**：${asset.tags.map(t => `\`${t}\``).join(' ')}`)
        lines.push('')
      }
      lines.push('### 文稿内容')
      lines.push('')
      if (transcripts.length === 0) {
        lines.push('> *（暂无转写内容）*')
        lines.push('')
      } else {
        transcripts.forEach(seg => {
          if (exportOptions.includeTimestamps) {
            lines.push(`**[${formatTime(seg.startTime)}]** ${seg.text || ''}`)
          } else {
            lines.push(seg.text || '')
          }
          lines.push('')
          if (exportOptions.includeAnnotations && seg.annotations.length) {
            seg.annotations.forEach(a => {
              const typeMap: Record<string, string> = { dialect: '方言词', skill: '技艺名词', person: '人物', place: '地点', event: '事件' }
              lines.push(`> *${typeMap[a.type] || a.type}：${a.term}*${a.explanation ? ' — ' + a.explanation : ''}`)
            })
            lines.push('')
          }
        })
      }
    }
  })
  return lines.join('\n')
}

function generateSummary() {
  const allSegments: Array<{ assetId: string; text: string; time: number }> = []
  selectedAssets.value.forEach(asset => {
    const transcripts = transcriptCache.value[asset.id] || []
    transcripts
      .filter(t => t.text.trim())
      .forEach(t => allSegments.push({ assetId: asset.id, text: t.text, time: t.startTime }))
  })

  if (allSegments.length === 0) {
    ElMessage.warning('所选素材暂无转写内容，无法生成摘要')
    return
  }

  const topics = ['传统技艺', '口述历史', '文化传承', '艺人经历', '学艺历程', '行业变迁']
  const names = new Set<string>()
  selectedAssets.value.forEach(asset => {
    const transcripts = transcriptCache.value[asset.id] || []
    transcripts
      .forEach(t => t.annotations.filter(a => a.type === 'person').forEach(a => names.add(a.term)))
  })

  generatedSummary.value = {
    overview: `本次采访共收录${selectedAssets.value.length}段素材，总时长约${Math.round(allSegments.length * 0.5)}分钟，主要围绕${topics.slice(0, 3).join('、')}等方面展开。受访人详细讲述了个人经历、学艺过程以及技艺传承的历史与现状，为我们了解该项目的发展脉络提供了珍贵的第一手资料。`,
    keyTopics: topics.slice(0, 5),
    keyPersons: names.size > 0 ? Array.from(names).slice(0, 5) : ['受访艺人本人'],
    highlights: allSegments
      .filter(s => s.text.length > 20)
      .slice(0, 5)
      .map(s => ({ ...s, text: s.text.slice(0, 60) + (s.text.length > 60 ? '...' : '') }))
  }
  ElMessage.success('摘要已生成')
}

function jumpToSegment(assetId: string, time: number) {
  router.push(`/transcript/${assetId}`)
}

function downloadFile(content: string, fileName: string) {
  const mimeMap: Record<string, string> = {
    srt: 'text/plain', vtt: 'text/vtt', txt: 'text/plain', markdown: 'text/markdown'
  }
  const blob = new Blob([content], { type: mimeMap[fileName.split('.').pop() || 'txt'] || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function doExport() {
  if (!canExport.value) {
    ElMessage.warning('请选择素材和导出类型')
    return
  }
  const baseName = `口述史文稿_${dayjs().format('YYYYMMDD')}`
  exportTypes.value.forEach(type => {
    const content = generateContent(type)
    const extMap: Record<string, string> = { srt: 'srt', vtt: 'vtt', txt: 'txt', markdown: 'md' }
    downloadFile(content, `${baseName}.${extMap[type] || type}`)
  })
  if (exportOptions.generateSummary && generatedSummary.value) {
    const mdSummary = `# 采访内容摘要\n\n## 内容概述\n\n${generatedSummary.value.overview}\n\n## 关键主题\n\n${generatedSummary.value.keyTopics.map(t => `- ${t}`).join('\n')}\n\n## 重要人物\n\n${generatedSummary.value.keyPersons.map(p => `- ${p}`).join('\n')}\n\n## 精彩片段\n\n${generatedSummary.value.highlights.map(h => `- [${formatTime(h.time)}] ${h.text}`).join('\n')}`
    downloadFile(mdSummary, `${baseName}_摘要.md`)
  }
  ElMessage.success('导出完成')
}
</script>

<style scoped>
.export-page { min-height: 100%; }

.export-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.export-type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-type-item:hover {
  background: #faf8f5;
}

.export-type-item.active {
  border-color: var(--primary-color);
  background: #fffaf3;
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.export-options :deep(.el-checkbox) {
  margin-right: 0;
}

.preview-card {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.preview-content {
  flex: 1;
  overflow: auto;
}

.preview-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 16px;
  background: #faf8f5;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-primary);
  margin: 0;
}

.summary-section {
  padding: 12px;
  background: #faf8f5;
  border-radius: 8px;
}

.summary-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.summary-content {
  line-height: 1.8;
  color: var(--text-secondary);
}

.highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.highlight-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.highlight-time {
  font-family: monospace;
  font-size: 12px;
  background: var(--primary-color);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.highlight-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
