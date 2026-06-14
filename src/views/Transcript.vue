<template>
  <div class="page-container transcript-page">
    <div class="page-header">
      <div class="flex-between" style="gap: 16px; flex: 1;">
        <div>
          <div class="flex-between" style="gap: 12px;">
            <el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button>
            <div>
              <div class="page-title">
                <span v-if="currentAsset">{{ currentAsset.title }}</span>
                <span v-else>文字转写校对</span>
              </div>
              <div class="page-subtitle">
                <span v-if="currentAsset">{{ { audio: '音频', video: '视频' }[currentAsset.type] }}素材转写与校对</span>
                <span v-else>请先选择素材</span>
              </div>
            </div>
          </div>
        </div>
        <div class="header-actions flex-between gap-12">
          <el-select v-model="currentAssetId" placeholder="选择素材" filterable style="width: 260px;" @change="onAssetChange">
            <el-option v-for="a in mediaAssets" :key="a.id" :label="a.title" :value="a.id">
              <el-tag size="small" style="margin-right: 8px;">{{ { audio: '音频', video: '视频' }[a.type] }}</el-tag>
              <span>{{ a.title }}</span>
            </el-option>
          </el-select>
          <el-button :icon="MagicStick" @click="autoGenerateSegments">智能分段</el-button>
          <el-button type="primary" :icon="Download" @click="showExportDialog = true">导出</el-button>
        </div>
      </div>
    </div>

    <div v-if="!currentAsset" class="empty-state" style="margin-top: 80px;">
      <el-icon :size="64" color="#c4b8a8"><EditPen /></el-icon>
      <p style="margin-top: 16px; font-size: 16px;">请选择要转写的音视频素材</p>
      <p class="text-muted" style="margin-top: 4px;">可从顶部下拉选择，或从「素材导入」页面进入</p>
    </div>

    <div v-else class="transcript-layout">
      <div class="player-section">
        <div class="card player-card" style="padding: 0;">
          <div class="video-wrapper" v-if="currentAsset.type === 'video'">
            <video ref="videoRef" :src="currentAsset.filePath" controls class="video-player" @timeupdate="onTimeUpdate"></video>
          </div>
          <div class="audio-wrapper" v-else>
            <audio ref="audioRef" :src="currentAsset.filePath" controls class="audio-player" @timeupdate="onTimeUpdate"></audio>
          </div>
        </div>

        <div class="card timeline-card">
          <div class="flex-between mb-12">
            <div class="card-title" style="border: none; margin: 0; padding: 0; font-size: 14px;">时间轴打点</div>
            <div class="flex-between gap-8">
              <el-button size="small" type="primary" :icon="Plus" @click="addMarkerAtCurrent">当前位置打点</el-button>
              <el-select v-model="newMarkerType" size="small" style="width: 110px;">
                <el-option label="章节" value="chapter" />
                <el-option label="主题" value="topic" />
                <el-option label="方言" value="dialect" />
                <el-option label="技艺" value="skill" />
                <el-option label="重点" value="important" />
              </el-select>
            </div>
          </div>
          <div class="timeline-container">
            <div class="timeline-track">
              <div
                v-for="marker in markers"
                :key="marker.id"
                class="timeline-marker"
                :class="'marker-' + marker.type"
                :style="{ left: getMarkerPosition(marker.time) + '%' }"
                :title="`${formatTime(marker.time)} - ${marker.label}`"
                @click="jumpToMarker(marker)"
              >
                <div class="marker-dot"></div>
                <div class="marker-tooltip">{{ marker.label }}</div>
              </div>
              <div class="timeline-playhead" :style="{ left: playheadPosition + '%' }"></div>
            </div>
            <div class="timeline-ruler">
              <span v-for="t in timelineTicks" :key="t" class="ruler-tick" :style="{ left: (t / duration) * 100 + '%' }">
                {{ formatTime(t) }}
              </span>
            </div>
          </div>
          <div class="marker-list mt-16" v-if="markers.length">
            <div class="marker-item" v-for="m in markers" :key="m.id">
              <span class="marker-time" @click="jumpToTime(m.time)">{{ formatTime(m.time) }}</span>
              <el-tag size="small" :type="markerTagType(m.type)">{{ markerTypeText(m.type) }}</el-tag>
              <el-input v-model="m.label" size="small" style="flex: 1;" @change="saveMarker(m)" />
              <el-button size="small" text type="danger" :icon="Delete" @click="removeMarker(m.id)"></el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="transcript-section">
        <div class="card transcript-card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">
              转写文本
              <span class="text-small text-muted" style="margin-left: 8px;">
                共 {{ transcripts.length }} 段
              </span>
            </div>
            <div class="flex-between gap-8">
              <el-button size="small" :icon="Plus" @click="addSegment">添加段落</el-button>
              <el-button size="small" :icon="Sort" @click="sortSegments">按时间排序</el-button>
            </div>
          </div>

          <div class="segment-list" v-if="transcripts.length">
            <div
              v-for="seg in transcripts"
              :key="seg.id"
              class="segment-item"
              :class="{ 'segment-active': activeSegmentId === seg.id, 'segment-review': seg.needsReview }"
              @click="selectSegment(seg)"
            >
              <div class="segment-header">
                <div class="segment-time">
                  <span class="time-btn" @click.stop="jumpToTime(seg.startTime)">{{ formatTime(seg.startTime) }}</span>
                  <span class="time-sep">→</span>
                  <span class="time-btn" @click.stop="jumpToTime(seg.endTime)">{{ formatTime(seg.endTime) }}</span>
                </div>
                <div class="segment-tools">
                  <el-switch
                    v-model="seg.needsReview"
                    size="small"
                    active-text="待校对"
                    @change="saveSegment(seg)"
                  />
                  <el-button size="small" text :icon="Top" @click.stop="moveSegment(seg.id, -1)">上移</el-button>
                  <el-button size="small" text :icon="Bottom" @click.stop="moveSegment(seg.id, 1)">下移</el-button>
                  <el-button size="small" text type="danger" :icon="Delete" @click.stop="removeSegment(seg.id)"></el-button>
                </div>
              </div>
              <div class="segment-body">
                <div class="segment-time-edit">
                  <el-input-number v-model="seg.startTime" size="small" :precision="1" :step="0.5" :min="0" style="width: 100px;" @change="saveSegment(seg)" />
                  <span style="padding: 0 6px; color: var(--text-light);">至</span>
                  <el-input-number v-model="seg.endTime" size="small" :precision="1" :step="0.5" :min="0" style="width: 100px;" @change="saveSegment(seg)" />
                </div>
                <el-input
                  v-model="seg.text"
                  type="textarea"
                  :rows="3"
                  placeholder="输入转写文本..."
                  class="segment-textarea"
                  @blur="saveSegment(seg)"
                />
                <div class="segment-annotations" v-if="seg.annotations.length">
                  <div class="ann-item" v-for="a in seg.annotations" :key="a.id">
                    <el-tag size="small" :type="annTagType(a.type)">
                      {{ annTypeText(a.type) }}：{{ a.term }}
                    </el-tag>
                    <span class="ann-desc text-small text-muted" v-if="a.explanation">{{ a.explanation }}</span>
                    <el-button size="small" text type="danger" @click="removeAnnotation(seg.id, a.id)">×</el-button>
                  </div>
                </div>
                <div class="annotation-tools">
                  <el-select v-model="newAnnType" size="small" placeholder="标注类型" style="width: 110px;">
                    <el-option label="方言词" value="dialect" />
                    <el-option label="技艺词" value="skill" />
                    <el-option label="人物" value="person" />
                    <el-option label="地点" value="place" />
                    <el-option label="事件" value="event" />
                  </el-select>
                  <el-input v-model="newAnnTerm" size="small" placeholder="标注的词语" style="width: 140px;" />
                  <el-input v-model="newAnnExplain" size="small" placeholder="解释说明（可选）" style="flex: 1;" />
                  <el-button size="small" type="primary" @click="addAnnotation(seg)">添加标注</el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state" style="padding: 40px;">
            <el-icon :size="40" color="#c4b8a8"><Document /></el-icon>
            <p style="margin-top: 12px;">暂无转写内容</p>
            <div class="flex-between gap-8" style="margin-top: 16px;">
              <el-button type="primary" :icon="Plus" @click="addSegment">手动添加段落</el-button>
              <el-button :icon="MagicStick" @click="autoGenerateSegments">智能分段</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showExportDialog" title="导出转写" width="480px">
      <el-form label-width="100px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportConfig.format">
            <el-radio value="srt">SRT 字幕</el-radio>
            <el-radio value="vtt">VTT 字幕</el-radio>
            <el-radio value="txt">纯文本</el-radio>
            <el-radio value="markdown">Markdown</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含内容">
          <el-checkbox v-model="exportConfig.includeTimestamps">时间戳</el-checkbox>
          <el-checkbox v-model="exportConfig.includeAnnotations">标注说明</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="doExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Plus, Delete, EditPen, MagicStick, Download, Sort, Top, Bottom, Document
} from '@element-plus/icons-vue'
import { useMediaStore } from '@/stores/media'
import type { TimestampMarker, TranscriptSegment, Annotation } from '@/types'

const route = useRoute()
const router = useRouter()
const mediaStore = useMediaStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const currentTime = ref(0)
const duration = ref(0)
const activeSegmentId = ref('')

const currentAssetId = ref(route.params.id as string || '')
const mediaAssets = computed(() => mediaStore.assets.filter(a => a.type === 'audio' || a.type === 'video'))
const currentAsset = computed(() => mediaStore.currentAsset)
const transcripts = computed(() => mediaStore.transcripts)
const markers = computed(() => mediaStore.markers)

const playheadPosition = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)
const timelineTicks = computed(() => {
  const ticks: number[] = []
  const step = Math.max(30, Math.floor(duration.value / 6 / 30) * 30)
  for (let t = 0; t <= duration.value; t += step) ticks.push(t)
  return ticks
})

const showExportDialog = ref(false)
const newMarkerType = ref<'chapter' | 'topic' | 'dialect' | 'skill' | 'important'>('topic')
const newAnnType = ref<'dialect' | 'skill' | 'person' | 'place' | 'event'>('dialect')
const newAnnTerm = ref('')
const newAnnExplain = ref('')
const exportConfig = reactive({
  format: 'srt' as 'srt' | 'vtt' | 'txt' | 'markdown',
  includeTimestamps: true,
  includeAnnotations: true
})

onMounted(() => {
  if (currentAssetId.value && currentAssetId.value !== '0') {
    onAssetChange(currentAssetId.value)
  }
})

watch(currentAsset, (asset) => {
  if (asset && asset.duration) {
    duration.value = asset.duration
  }
})

function onAssetChange(id: string) {
  if (!id || id === '0') return
  mediaStore.loadAsset(id)
  currentTime.value = 0
  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.addEventListener('loadedmetadata', () => {
        duration.value = videoRef.value?.duration || 0
      })
    }
    if (audioRef.value) {
      audioRef.value.addEventListener('loadedmetadata', () => {
        duration.value = audioRef.value?.duration || 0
      })
    }
  }, 100)
}

function onTimeUpdate(e: Event) {
  const target = e.target as HTMLMediaElement
  currentTime.value = target.currentTime
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

function jumpToTime(time: number) {
  if (videoRef.value) { videoRef.value.currentTime = time; videoRef.value.play() }
  if (audioRef.value) { audioRef.value.currentTime = time; audioRef.value.play() }
  currentTime.value = time
}

function getMarkerPosition(time: number) {
  return duration.value ? (time / duration.value) * 100 : 0
}

function jumpToMarker(marker: TimestampMarker) {
  jumpToTime(marker.time)
}

function addMarkerAtCurrent() {
  if (!currentAssetId.value) return
  const marker = mediaStore.addMarker({
    mediaAssetId: currentAssetId.value,
    time: currentTime.value,
    label: markerTypeText(newMarkerType.value) + Math.floor(markers.value.length + 1),
    type: newMarkerType.value
  })
  ElMessage.success(`已在 ${formatTime(currentTime.value)} 打点`)
  return marker
}

function saveMarker(m: TimestampMarker) {
  mediaStore.updateMarker(m.id, { label: m.label })
}

function removeMarker(id: string) {
  mediaStore.removeMarker(id)
}

function markerTypeText(type: string) {
  const map: Record<string, string> = { chapter: '章节', topic: '主题', dialect: '方言', skill: '技艺', important: '重点' }
  return map[type] || type
}

function markerTagType(type: string) {
  const map: Record<string, string> = { chapter: '', topic: 'primary', dialect: 'warning', skill: 'success', important: 'danger' }
  return map[type] || ''
}

function addSegment() {
  if (!currentAssetId.value) return
  const startTime = currentTime.value
  mediaStore.addTranscriptSegment({
    mediaAssetId: currentAssetId.value,
    startTime,
    endTime: Math.min(startTime + 10, duration.value || startTime + 10),
    text: '',
    annotations: [],
    isEdited: false,
    needsReview: false
  })
}

function selectSegment(seg: TranscriptSegment) {
  activeSegmentId.value = seg.id
  jumpToTime(seg.startTime)
}

function saveSegment(seg: TranscriptSegment) {
  mediaStore.updateTranscriptSegment(seg.id, {
    startTime: seg.startTime,
    endTime: seg.endTime,
    text: seg.text,
    needsReview: seg.needsReview,
    isEdited: true
  })
}

function removeSegment(id: string) {
  mediaStore.removeTranscriptSegment(id)
}

function moveSegment(id: string, dir: number) {
  const list = [...transcripts.value]
  const idx = list.findIndex(s => s.id === id)
  const target = idx + dir
  if (target < 0 || target >= list.length) return
  ;[list[idx], list[target]] = [list[target], list[idx]]
  list.forEach((s, i) => {
    mediaStore.updateTranscriptSegment(s.id, { startTime: s.startTime, endTime: s.endTime })
  })
  mediaStore.transcripts.splice(0, mediaStore.transcripts.length, ...list)
}

function sortSegments() {
  const sorted = [...transcripts.value].sort((a, b) => a.startTime - b.startTime)
  mediaStore.transcripts.splice(0, mediaStore.transcripts.length, ...sorted)
  ElMessage.success('已按时间排序')
}

function autoGenerateSegments() {
  if (!currentAssetId.value || !duration.value) {
    ElMessage.warning('请先选择素材并等待加载')
    return
  }
  if (transcripts.value.length > 0) {
    ElMessage.info('已有转写内容，请先清空后再智能分段')
    return
  }
  const segDuration = 15
  const segs: Array<Omit<TranscriptSegment, 'id'>> = []
  for (let t = 0; t < duration.value; t += segDuration) {
    segs.push({
      mediaAssetId: currentAssetId.value,
      startTime: t,
      endTime: Math.min(t + segDuration, duration.value),
      text: '',
      annotations: [],
      isEdited: false,
      needsReview: true
    })
  }
  mediaStore.bulkAddTranscripts(segs)
  ElMessage.success(`已自动生成 ${segs.length} 个段落`)
}

function addAnnotation(seg: TranscriptSegment) {
  if (!newAnnTerm.value.trim()) {
    ElMessage.warning('请输入要标注的词语')
    return
  }
  mediaStore.addAnnotation(seg.id, {
    type: newAnnType.value,
    startIndex: 0,
    endIndex: newAnnTerm.value.length,
    term: newAnnTerm.value.trim(),
    explanation: newAnnExplain.value || undefined
  })
  newAnnTerm.value = ''
  newAnnExplain.value = ''
  ElMessage.success('标注已添加')
}

function removeAnnotation(segId: string, annId: string) {
  mediaStore.removeAnnotation(segId, annId)
}

function annTypeText(type: string) {
  const map: Record<string, string> = { dialect: '方言词', skill: '技艺名词', person: '人物', place: '地点', event: '事件' }
  return map[type] || type
}

function annTagType(type: string) {
  const map: Record<string, string> = { dialect: 'warning', skill: 'success', person: 'primary', place: 'info', event: '' }
  return map[type] || ''
}

function doExport() {
  const content = generateExportContent()
  const fileName = `${currentAsset.value?.title || '转写'}_${Date.now()}.${exportConfig.format}`
  const mimeTypes: Record<string, string> = {
    srt: 'text/plain', vtt: 'text/vtt', txt: 'text/plain', markdown: 'text/markdown'
  }
  const blob = new Blob([content], { type: mimeTypes[exportConfig.format] })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
  showExportDialog.value = false
}

function generateExportContent(): string {
  const lines: string[] = []
  const segs = [...transcripts.value].sort((a, b) => a.startTime - b.startTime)

  if (exportConfig.format === 'srt') {
    segs.forEach((seg, i) => {
      lines.push(String(i + 1))
      lines.push(`${formatSrtTime(seg.startTime)} --> ${formatSrtTime(seg.endTime)}`)
      lines.push(seg.text || '')
      if (exportConfig.includeAnnotations && seg.annotations.length) {
        seg.annotations.forEach(a => {
          lines.push(`【${annTypeText(a.type)}】${a.term}${a.explanation ? ' - ' + a.explanation : ''}`)
        })
      }
      lines.push('')
    })
  } else if (exportConfig.format === 'vtt') {
    lines.push('WEBVTT')
    lines.push('')
    segs.forEach((seg, i) => {
      lines.push(String(i + 1))
      lines.push(`${formatVttTime(seg.startTime)} --> ${formatVttTime(seg.endTime)}`)
      lines.push(seg.text || '')
      lines.push('')
    })
  } else if (exportConfig.format === 'markdown') {
    lines.push(`# ${currentAsset.value?.title || '转写文稿'}`)
    lines.push('')
    if (exportConfig.includeAnnotations) {
      lines.push('## 文稿内容')
      lines.push('')
    }
    segs.forEach(seg => {
      if (exportConfig.includeTimestamps) {
        lines.push(`**[${formatTime(seg.startTime)}]** ${seg.text}`)
      } else {
        lines.push(seg.text)
      }
      lines.push('')
      if (exportConfig.includeAnnotations && seg.annotations.length) {
        seg.annotations.forEach(a => {
          lines.push(`> *${annTypeText(a.type)}：${a.term}*${a.explanation ? ' — ' + a.explanation : ''}`)
        })
        lines.push('')
      }
    })
  } else {
    segs.forEach(seg => {
      if (exportConfig.includeTimestamps) {
        lines.push(`[${formatTime(seg.startTime)}] ${seg.text}`)
      } else {
        lines.push(seg.text)
      }
      if (exportConfig.includeAnnotations && seg.annotations.length) {
        seg.annotations.forEach(a => {
          lines.push(`（${annTypeText(a.type)}：${a.term}${a.explanation ? ' - ' + a.explanation : ''}）`)
        })
      }
      lines.push('')
    })
  }
  return lines.join('\n')
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
</script>

<style scoped>
.transcript-page {
  min-height: 100%;
}

.transcript-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 160px);
}

.player-section,
.transcript-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.player-card {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.video-wrapper,
.audio-wrapper {
  width: 100%;
  background: #000;
}

.video-player {
  width: 100%;
  max-height: 320px;
  display: block;
  background: #000;
}

.audio-player {
  width: 100%;
  padding: 40px 20px;
}

.timeline-card {
  flex-shrink: 0;
}

.timeline-container {
  background: #faf8f5;
  border-radius: 8px;
  padding: 12px;
}

.timeline-track {
  position: relative;
  height: 40px;
  background: linear-gradient(90deg, #e8e0d5 0%, #f0e8dc 100%);
  border-radius: 6px;
  margin-bottom: 8px;
}

.timeline-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 2;
}

.marker-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-top: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.marker-chapter .marker-dot { background: #2980b9; }
.marker-topic .marker-dot { background: #8e44ad; }
.marker-dialect .marker-dot { background: #e67e22; }
.marker-skill .marker-dot { background: #27ae60; }
.marker-important .marker-dot { background: #c0392b; }

.marker-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 24, 16, 0.9);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.timeline-marker:hover .marker-tooltip {
  opacity: 1;
}

.timeline-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #f56c6c;
  z-index: 1;
  transform: translateX(-50%);
}

.timeline-ruler {
  position: relative;
  height: 18px;
  font-size: 10px;
  color: var(--text-light);
  font-family: monospace;
}

.ruler-tick {
  position: absolute;
  transform: translateX(-50%);
}

.marker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.marker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #faf8f5;
  border-radius: 6px;
}

.marker-time {
  font-family: monospace;
  font-size: 12px;
  color: var(--primary-color);
  cursor: pointer;
  padding: 2px 6px;
  background: #fff;
  border-radius: 4px;
}

.transcript-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.segment-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.segment-item {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px;
  background: #fff;
  transition: all 0.2s;
}

.segment-item:hover {
  border-color: var(--primary-light);
}

.segment-active {
  border-color: var(--primary-color);
  background: #fffaf3;
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.1);
}

.segment-review {
  border-left: 3px solid #e6a23c;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.segment-time {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-btn {
  font-family: monospace;
  font-size: 12px;
  background: #f5f0e8;
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.time-btn:hover {
  background: var(--primary-light);
  color: #fff;
}

.time-sep {
  color: var(--text-light);
  font-size: 12px;
}

.segment-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.segment-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.segment-time-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.segment-textarea :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.7;
}

.segment-annotations {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ann-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #faf8f5;
  border-radius: 6px;
}

.ann-desc {
  flex: 1;
}

.annotation-tools {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}
</style>
