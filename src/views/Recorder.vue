<template>
  <div class="page-container recorder-page">
    <div class="page-header">
      <div>
        <div class="page-title">录音录像</div>
        <div class="page-subtitle">现场录制受访人口述内容，支持音视频录制</div>
      </div>
      <div class="header-actions flex-between gap-12">
        <el-select v-model="selectedPlanId" placeholder="关联采访计划" filterable clearable style="width: 220px;">
          <el-option v-for="p in planStore.plans" :key="p.id" :label="p.title" :value="p.id">
            <span>{{ p.title }}</span>
            <span class="text-muted text-small" style="margin-left: 8px;" v-if="p.intervieweeName">{{ p.intervieweeName }}</span>
          </el-option>
        </el-select>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="17">
        <div class="card preview-card">
          <div class="preview-area">
            <video ref="videoRef" autoplay muted playsinline class="preview-video" v-if="recordMode === 'video'"></video>
            <div class="audio-preview" v-else>
              <div class="audio-wave">
                <div class="wave-bar" v-for="i in 40" :key="i" :style="{ animationDelay: (i * 0.05) + 's' }"></div>
              </div>
              <div class="audio-status">
                <el-icon :size="48" :class="isRecording ? 'recording-icon' : ''"><Microphone /></el-icon>
                <p class="text-muted" style="margin-top: 12px;">{{ isRecording ? '正在录音...' : (isPreviewing ? '麦克风就绪' : '点击「开始预览」检测设备') }}</p>
              </div>
            </div>
            <div class="recording-indicator" v-if="isRecording">
              <span class="rec-dot"></span>
              <span>REC</span>
              <span class="rec-time">{{ formattedTime }}</span>
            </div>
          </div>

          <div class="record-controls">
            <div class="mode-switch">
              <el-radio-group v-model="recordMode" size="large" @change="onModeChange">
                <el-radio-button value="video">
                  <el-icon style="margin-right: 4px;"><VideoCamera /></el-icon>视频录制
                </el-radio-button>
                <el-radio-button value="audio">
                  <el-icon style="margin-right: 4px;"><Microphone /></el-icon>音频录制
                </el-radio-button>
              </el-radio-group>
            </div>
            <div class="control-buttons">
              <el-button v-if="!isPreviewing && !isRecording && !isPaused" size="large" :icon="View" @click="startPreview">
                开始预览
              </el-button>
              <el-button v-if="isPreviewing && !isRecording && !isPaused" size="large" @click="stopPreview">
                停止预览
              </el-button>
              <el-tooltip
                v-if="(isPreviewing && !isRecording && !isPaused) || isRecording || isPaused"
                :content="supportsPauseResume ? '' : '当前环境不支持暂停/继续，仅能开始或停止录制'"
                :disabled="supportsPauseResume"
                placement="top"
              >
                <el-button
                  size="large"
                  :type="isPaused ? 'primary' : (isRecording ? (supportsPauseResume ? 'warning' : 'primary') : 'danger')"
                  :icon="isPaused ? VideoPlay : (isRecording && supportsPauseResume ? 'VideoPause' : VideoPlay)"
                  class="record-btn"
                  @click="toggleRecording"
                  :disabled="isRecording && !supportsPauseResume && false"
                >
                  <template v-if="!isRecording && !isPaused">开始录制</template>
                  <template v-else-if="isRecording && supportsPauseResume">暂停录制</template>
                  <template v-else-if="isRecording && !supportsPauseResume">录制中...</template>
                  <template v-else-if="isPaused">继续录制</template>
                </el-button>
              </el-tooltip>
              <el-button
                v-if="isRecording || isPaused"
                size="large"
                type="danger"
                :icon="CircleClose"
                @click="stopRecording"
              >
                停止录制
              </el-button>
            </div>
          </div>

          <div class="timer-display" v-if="isRecording || isPaused">
            <div class="time-main">{{ formattedTime }}</div>
            <div class="time-label">{{ isPaused ? '已暂停' : '录制时长' }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">采访提纲（录制时参考）</div>
          <div v-if="currentPlan && currentPlan.questions.length">
            <div class="outline-item" v-for="(q, idx) in currentPlan.questions" :key="q.id">
              <div class="outline-num">{{ idx + 1 }}</div>
              <div class="outline-content">
                <div class="outline-question">{{ q.content || '（未填写问题）' }}</div>
                <el-tag v-if="q.category" size="small" effect="plain">{{ q.category }}</el-tag>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 20px;">
            <p class="text-muted">请在顶部选择关联的采访计划，或在采访计划页面创建提纲</p>
          </div>
        </div>
      </el-col>

      <el-col :span="7">
        <div class="card">
          <div class="card-title">录制信息</div>
          <el-form label-width="80px" size="default">
            <el-form-item label="素材标题">
              <el-input v-model="recordInfo.title" placeholder="请输入素材标题" />
            </el-form-item>
            <el-form-item label="受访人">
              <el-input v-model="recordInfo.intervieweeName" :placeholder="currentPlan?.intervieweeName || '请输入受访人姓名'" />
            </el-form-item>
            <el-form-item label="录制地点">
              <el-input v-model="recordInfo.location" :placeholder="currentPlan?.location || '请输入录制地点'" />
            </el-form-item>
            <el-form-item label="录制格式">
              <el-select v-model="recordInfo.format" style="width: 100%;">
                <el-option label="WebM (推荐)" value="webm" />
                <el-option label="MP4" value="mp4" />
                <el-option label="WAV (音频)" value="wav" />
                <el-option label="MP3 (音频)" value="mp3" />
              </el-select>
            </el-form-item>
            <el-form-item label="主题标签">
              <el-select v-model="recordInfo.tags" multiple filterable placeholder="选择标签" style="width: 100%;">
                <el-option v-for="t in tagStore.tags" :key="t.id" :label="t.name" :value="t.name" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="recordInfo.description" type="textarea" :rows="3" placeholder="录制说明、场景描述等" />
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <div class="card-title">设备选择</div>
          <el-form label-width="80px">
            <el-form-item label="摄像头">
              <el-select v-model="selectedCamera" placeholder="选择摄像头" style="width: 100%;" :disabled="isRecording" @change="restartPreview">
                <el-option v-for="d in cameras" :key="d.deviceId" :label="d.label || `摄像头 ${d.deviceId.slice(0, 8)}`" :value="d.deviceId" />
              </el-select>
            </el-form-item>
            <el-form-item label="麦克风">
              <el-select v-model="selectedMic" placeholder="选择麦克风" style="width: 100%;" :disabled="isRecording" @change="restartPreview">
                <el-option v-for="d in mics" :key="d.deviceId" :label="d.label || `麦克风 ${d.deviceId.slice(0, 8)}`" :value="d.deviceId" />
              </el-select>
            </el-form-item>
            <el-form-item label="扬声器">
              <el-select v-model="selectedSpeaker" placeholder="选择扬声器" style="width: 100%;">
                <el-option v-for="d in speakers" :key="d.deviceId" :label="d.label || `扬声器 ${d.deviceId.slice(0, 8)}`" :value="d.deviceId" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-button link type="primary" size="small" :icon="Refresh" @click="enumerateDevices">刷新设备列表</el-button>
        </div>

        <div class="card">
          <div class="card-title">本次录制记录</div>
          <div v-if="recordedClips.length" class="clip-list">
            <div class="clip-item" v-for="(clip, idx) in recordedClips" :key="idx">
              <div class="clip-icon">
                <el-icon :size="20"><VideoCamera v-if="clip.type === 'video'" /><Microphone v-else /></el-icon>
              </div>
              <div class="clip-info">
                <div class="clip-name">片段 {{ idx + 1 }}</div>
                <div class="clip-time text-small text-muted">{{ clip.duration }}</div>
              </div>
              <div class="clip-actions">
                <el-button size="small" text :icon="Check" type="success" @click="saveClip(clip)">保存</el-button>
                <el-button size="small" text type="danger" :icon="Delete" @click="removeClip(idx)">删除</el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 16px;">
            <p class="text-muted text-small">录制完成后，片段将显示在这里</p>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera, Microphone, View, VideoPlay, CircleClose, Refresh, Check, Delete
} from '@element-plus/icons-vue'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useMediaStore } from '@/stores/media'
import { useTagStore } from '@/stores/profile'
import { persistBlobFile, isElectron } from '@/utils/persist'
import type { MediaAsset } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const planStore = useInterviewPlanStore()
const mediaStore = useMediaStore()
const tagStore = useTagStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])

const recordMode = ref<'video' | 'audio'>('video')
const isPreviewing = ref(false)
const isRecording = ref(false)
const isPaused = ref(false)
const elapsedSeconds = ref(0)
const supportsPauseResume = ref(true)
let timerInterval: ReturnType<typeof setInterval> | null = null

function detectPauseResumeSupport() {
  try {
    if (typeof MediaRecorder === 'undefined') {
      supportsPauseResume.value = false
      return
    }
    const testStream = new MediaStream()
    const testRecorder = new MediaRecorder(testStream)
    const proto = Object.getPrototypeOf(testRecorder)
    supportsPauseResume.value = typeof proto.pause === 'function' && typeof proto.resume === 'function'
    try { testRecorder.stream.getTracks().forEach(t => t.stop()) } catch {}
  } catch (e) {
    supportsPauseResume.value = false
  }
}

const cameras = ref<MediaDeviceInfo[]>([])
const mics = ref<MediaDeviceInfo[]>([])
const speakers = ref<MediaDeviceInfo[]>([])
const selectedCamera = ref('')
const selectedMic = ref('')
const selectedSpeaker = ref('')

const selectedPlanId = ref('')
const currentPlan = computed(() => planStore.plans.find(p => p.id === selectedPlanId.value))

const recordedClips = ref<Array<{
  type: 'video' | 'audio'
  blob: Blob
  duration: string
  durationSeconds: number
  size: number
}>>([])

const recordInfo = reactive({
  title: '',
  intervieweeName: '',
  location: '',
  format: 'webm',
  tags: [] as string[],
  description: ''
})

const formattedTime = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600)
  const m = Math.floor((elapsedSeconds.value % 3600) / 60)
  const s = elapsedSeconds.value % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

watch(selectedPlanId, (id) => {
  const plan = planStore.plans.find(p => p.id === id)
  if (plan) {
    if (!recordInfo.title) recordInfo.title = plan.title + ' - ' + dayjs().format('YYYYMMDD')
    if (!recordInfo.intervieweeName) recordInfo.intervieweeName = plan.intervieweeName || ''
    if (!recordInfo.location) recordInfo.location = plan.location || ''
    if (plan.tags?.length && recordInfo.tags.length === 0) recordInfo.tags = [...plan.tags]
  }
})

onMounted(() => {
  enumerateDevices()
  detectPauseResumeSupport()
  if (!recordInfo.title) {
    recordInfo.title = '口述史录制_' + dayjs().format('YYYYMMDD_HHmm')
  }
})

onUnmounted(() => {
  stopPreview()
  if (timerInterval) clearInterval(timerInterval)
})

async function enumerateDevices() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices.filter(d => d.kind === 'videoinput')
    mics.value = devices.filter(d => d.kind === 'audioinput')
    speakers.value = devices.filter(d => d.kind === 'audiooutput')
    if (!selectedCamera.value && cameras.value.length) selectedCamera.value = cameras.value[0].deviceId
    if (!selectedMic.value && mics.value.length) selectedMic.value = mics.value[0].deviceId
  } catch (e) {
    console.warn('设备枚举失败:', e)
  }
}

async function startPreview() {
  try {
    const constraints: MediaStreamConstraints = {
      audio: selectedMic.value ? { deviceId: { exact: selectedMic.value } } : true
    }
    if (recordMode.value === 'video') {
      constraints.video = selectedCamera.value
        ? { deviceId: { exact: selectedCamera.value }, width: 1280, height: 720 }
        : { width: 1280, height: 720 }
    }
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoRef.value && recordMode.value === 'video') {
      videoRef.value.srcObject = mediaStream.value
    }
    isPreviewing.value = true
  } catch (e) {
    ElMessage.error('无法访问设备，请检查摄像头和麦克风权限')
    console.error(e)
  }
}

function stopPreview() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(t => t.stop())
    mediaStream.value = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
  isPreviewing.value = false
}

function restartPreview() {
  if (isPreviewing.value || isRecording.value) {
    stopRecordingCheck().then(ok => {
      if (ok) {
        stopPreview()
        setTimeout(() => startPreview(), 300)
      }
    })
  }
}

async function stopRecordingCheck() {
  if (!isRecording.value && !isPaused.value) return true
  try {
    await ElMessageBox.confirm('切换设备将停止当前录制，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    stopRecording()
    return true
  } catch {
    return false
  }
}

function onModeChange() {
  if (isPreviewing.value || isRecording.value) {
    stopPreview()
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (!isPaused.value) elapsedSeconds.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function toggleRecording() {
  if (!isPreviewing.value) {
    ElMessage.warning('请先开始预览')
    return
  }
  if (isRecording.value && supportsPauseResume.value) {
    pauseRecording()
  } else if (isPaused.value && supportsPauseResume.value) {
    resumeRecording()
  } else if (!isRecording.value && !isPaused.value) {
    startRecording()
  } else if (isRecording.value && !supportsPauseResume.value) {
    ElMessage.info('当前环境不支持暂停，如需停止请点击"停止录制"')
  }
}

function startRecording() {
  if (!mediaStream.value) return
  try {
    recordedChunks.value = []
    let mimeType = ''
    if (recordMode.value === 'video') {
      mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'
    } else {
      mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
    }
    mediaRecorder.value = new MediaRecorder(mediaStream.value, { mimeType })
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.value.push(e.data)
    }
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, { type: mimeType })
      recordedClips.value.push({
        type: recordMode.value,
        blob,
        duration: formattedTime.value,
        durationSeconds: elapsedSeconds.value,
        size: blob.size
      })
    }
    mediaRecorder.value.start()
    isRecording.value = true
    isPaused.value = false
    elapsedSeconds.value = 0
    startTimer()
    ElMessage.success('开始录制')
  } catch (e) {
    ElMessage.error('录制启动失败')
    console.error(e)
  }
}

function pauseRecording() {
  if (!mediaRecorder.value || mediaRecorder.value.state !== 'recording') return
  try {
    mediaRecorder.value.pause()
    isRecording.value = false
    isPaused.value = true
    ElMessage.info('已暂停录制，点击继续按钮恢复录制')
  } catch (e) {
    console.error('pause failed:', e)
    ElMessage.warning('暂停失败，当前环境可能不支持暂停功能')
  }
}

function resumeRecording() {
  if (!mediaRecorder.value || mediaRecorder.value.state !== 'paused') return
  try {
    mediaRecorder.value.resume()
    isRecording.value = true
    isPaused.value = false
    ElMessage.success('已恢复录制')
  } catch (e) {
    console.error('resume failed:', e)
    ElMessage.warning('恢复录制失败，请停止当前录制并重新开始')
  }
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
    isRecording.value = false
    isPaused.value = false
    stopTimer()
    ElMessage.success('录制已停止，片段已加入列表')
  }
}

function removeClip(idx: number) {
  recordedClips.value.splice(idx, 1)
}

async function saveClip(clip: {
  type: 'video' | 'audio'
  blob: Blob
  duration: string
  durationSeconds: number
  size: number
}) {
  const fileName = `${recordInfo.title || '录制素材'}_${Date.now()}.${recordInfo.format || 'webm'}`
  const persisted = await persistBlobFile(clip.blob, fileName, clip.type === 'video' ? 'video/webm' : 'audio/webm')
  const assetData = {
    type: clip.type,
    title: recordInfo.title || fileName,
    filePath: persisted.filePath,
    persistentPath: persisted.persistentPath,
    fileName,
    fileSize: persisted.size || clip.size,
    duration: clip.durationSeconds,
    format: recordInfo.format,
    interviewPlanId: selectedPlanId.value || undefined,
    intervieweeName: recordInfo.intervieweeName || undefined,
    recordedAt: dayjs().toISOString(),
    description: recordInfo.description,
    tags: [...recordInfo.tags]
  }
  const asset = mediaStore.addAsset(assetData)
  ElMessage.success(`素材已保存${persisted.persistentPath ? '（持久化）' : ''}，可前往「转写校对」处理`)
  if (confirm('是否立即前往转写校对？')) {
    router.push(`/transcript/${asset.id}`)
  }
}
</script>

<style scoped>
.recorder-page {
  min-height: 100%;
}

.preview-card {
  padding: 0;
  overflow: hidden;
}

.preview-area {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.audio-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 24px;
}

.audio-wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 80px;
}

.wave-bar {
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #ffd54f, #ff8f00);
  border-radius: 2px;
  animation: wave 1.2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 10px; }
  50% { height: 70px; }
}

.audio-status {
  text-align: center;
  color: #aaa;
}

.recording-icon {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(245, 108, 108, 0.9);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.rec-dot {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.rec-time {
  font-family: monospace;
}

.record-controls {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
}

.control-buttons {
  display: flex;
  gap: 12px;
}

.record-btn {
  min-width: 140px;
}

.timer-display {
  padding: 0 20px 20px;
  text-align: center;
}

.time-main {
  font-size: 36px;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.time-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.outline-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #faf8f5;
  border-radius: 8px;
  margin-bottom: 10px;
}

.outline-num {
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.outline-content {
  flex: 1;
}

.outline-question {
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.5;
}

.clip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #faf8f5;
  border-radius: 8px;
}

.clip-icon {
  width: 36px;
  height: 36px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clip-info {
  flex: 1;
}

.clip-name {
  font-size: 14px;
  color: var(--text-primary);
}

.clip-actions {
  display: flex;
  gap: 4px;
}
</style>
