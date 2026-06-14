<template>
  <div class="page-container plan-detail">
    <div class="page-header">
      <div class="flex-between" style="gap: 16px;">
        <div>
          <div class="flex-between" style="gap: 12px;">
            <el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button>
            <div>
              <div class="page-title">{{ plan?.title || '采访计划详情' }}</div>
              <div class="page-subtitle">
                <span v-if="plan?.intervieweeName">受访人：{{ plan.intervieweeName }}</span>
                <span v-if="plan?.scheduledDate" style="margin-left: 16px;">
                  时间：{{ plan.scheduledDate }} {{ plan.scheduledTime || '' }}
                </span>
                <span v-if="plan?.location" style="margin-left: 16px;">地点：{{ plan.location }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-between gap-12">
          <el-select v-model="editStatus" placeholder="状态" style="width: 120px;" @change="onStatusChange">
            <el-option label="草稿" value="draft" />
            <el-option label="已预约" value="scheduled" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-switch v-model="needsFollowUp" active-text="待补采" @change="onFollowUpChange" />
          <el-button :icon="Edit" @click="showEditDialog = true">编辑信息</el-button>
          <el-button type="primary" :icon="VideoCamera" @click="goToRecorder">开始录制</el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="17">
        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">采访提纲</div>
            <div class="flex-between gap-8">
              <el-button size="small" :icon="Plus" type="primary" @click="addQuestion">添加问题</el-button>
            </div>
          </div>

          <div class="question-list" v-if="plan?.questions.length">
            <div class="question-item" v-for="(q, idx) in plan.questions" :key="q.id">
              <div class="question-index">{{ idx + 1 }}</div>
              <div class="question-body">
                <div class="question-content">
                  <el-input
                    v-model="q.content"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入问题内容"
                    @blur="saveQuestion(q)"
                  />
                </div>
                <div class="question-meta flex-between mt-8">
                  <el-select v-model="q.category" placeholder="问题分类" clearable size="small" style="width: 160px;" @change="saveQuestion(q)">
                    <el-option label="个人经历" value="个人经历" />
                    <el-option label="学艺历程" value="学艺历程" />
                    <el-option label="技艺传承" value="技艺传承" />
                    <el-option label="代表作品" value="代表作品" />
                    <el-option label="行业发展" value="行业发展" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                  <div class="flex-between gap-8">
                    <el-button size="small" text :icon="Top" :disabled="idx === 0" @click="moveQuestion(idx, -1)">上移</el-button>
                    <el-button size="small" text :icon="Bottom" :disabled="idx === plan.questions.length - 1" @click="moveQuestion(idx, 1)">下移</el-button>
                    <el-button size="small" text type="danger" :icon="Delete" @click="removeQuestion(q.id)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" v-else>
            <el-icon :size="48"><EditPen /></el-icon>
            <p style="margin-top: 12px;">暂无采访问题</p>
            <el-button type="primary" style="margin-top: 16px;" :icon="Plus" @click="addQuestion">添加第一个问题</el-button>
          </div>
        </div>

        <div class="card" v-if="needsFollowUp">
          <div class="card-title">补采备注</div>
          <el-input
            v-model="followUpNotes"
            type="textarea"
            :rows="4"
            placeholder="记录需要补采的内容、原因、补充方向..."
            @blur="saveFollowUpNotes"
          />
        </div>

        <div class="card">
          <div class="card-title">相关素材</div>
          <el-table :data="relatedAssets" style="width: 100%" v-if="relatedAssets.length">
            <el-table-column label="类型" width="70">
              <template #default="{ row }">
                <el-tag :type="row.type === 'video' ? 'primary' : row.type === 'audio' ? '' : 'success'" size="small">
                  {{ { audio: '音频', video: '视频', image: '图片', document: '文档' }[row.type] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="fileName" label="文件名" show-overflow-tooltip />
            <el-table-column label="导入时间" width="170">
              <template #default="{ row }">{{ formatDate(row.importedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTranscript(row.id)" v-if="row.type === 'audio' || row.type === 'video'">查看转写</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="empty-state" v-else style="padding: 30px;">
            <p class="text-muted">暂无相关素材，录制或导入素材时可关联此计划</p>
          </div>
        </div>
      </el-col>

      <el-col :span="7">
        <div class="card">
          <div class="card-title">计划信息</div>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">状态</span>
              <el-tag :type="statusTagType(plan?.status || 'draft')" size="small">{{ statusText(plan?.status || 'draft') }}</el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">采访人员</span>
              <span>{{ plan?.interviewer || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">问题数量</span>
              <span>{{ plan?.questions.length || 0 }} 个</span>
            </div>
            <div class="info-item" v-if="plan?.tags?.length">
              <span class="info-label">标签</span>
              <div>
                <el-tag v-for="t in plan.tags" :key="t" size="small" effect="plain" style="margin-right: 4px; margin-bottom: 4px;">{{ t }}</el-tag>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="text-small text-muted">{{ formatDate(plan?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="text-small text-muted">{{ formatDate(plan?.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="card" v-if="plan?.description">
          <div class="card-title">计划描述</div>
          <p style="line-height: 1.8; color: var(--text-secondary);">{{ plan.description }}</p>
        </div>

        <div class="card">
          <div class="card-title">快捷入口</div>
          <div class="quick-links">
            <div class="quick-link" @click="goToRecorder">
              <el-icon><VideoCamera /></el-icon>
              <span>录制素材</span>
            </div>
            <div class="quick-link" @click="goToImport">
              <el-icon><Upload /></el-icon>
              <span>导入素材</span>
            </div>
            <div class="quick-link" @click="goToExport">
              <el-icon><Download /></el-icon>
              <span>导出成果</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showEditDialog" title="编辑计划信息" width="560px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="采访主题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="受访人">
          <el-select v-model="editForm.intervieweeId" clearable filterable placeholder="选择受访人" @change="onEditIntervieweeSelect">
            <el-option v-for="p in intervieweeStore.interviewees" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="受访人姓名" v-if="!editForm.intervieweeId">
          <el-input v-model="editForm.intervieweeName" />
        </el-form-item>
        <el-form-item label="采访时间">
          <div style="display: flex; gap: 8px;">
            <el-date-picker v-model="editForm.scheduledDate" type="date" placeholder="日期" style="flex: 1;" value-format="YYYY-MM-DD" />
            <el-time-picker v-model="editForm.scheduledTime" placeholder="时间" style="flex: 1;" value-format="HH:mm" />
          </div>
        </el-form-item>
        <el-form-item label="采访地点">
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="采访人员">
          <el-input v-model="editForm.interviewer" />
        </el-form-item>
        <el-form-item label="主题标签">
          <el-select v-model="editForm.tags" multiple placeholder="选择标签" filterable>
            <el-option v-for="tag in tagStore.tags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Edit, VideoCamera, Plus, Top, Bottom, Delete, EditPen, Upload, Download
} from '@element-plus/icons-vue'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useIntervieweeStore } from '@/stores/interviewee'
import { useMediaStore } from '@/stores/media'
import { useTagStore } from '@/stores/profile'
import type { InterviewQuestion, InterviewPlan } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const planStore = useInterviewPlanStore()
const intervieweeStore = useIntervieweeStore()
const mediaStore = useMediaStore()
const tagStore = useTagStore()

const planId = computed(() => route.params.id as string)
const plan = computed(() => planStore.currentPlan)

const editStatus = ref('')
const needsFollowUp = ref(false)
const followUpNotes = ref('')
const showEditDialog = ref(false)

const editForm = reactive({
  title: '',
  intervieweeId: '',
  intervieweeName: '',
  scheduledDate: '',
  scheduledTime: '',
  location: '',
  interviewer: '',
  description: '',
  tags: [] as string[]
})

const relatedAssets = computed(() => mediaStore.assets.filter(a => a.interviewPlanId === planId.value))

onMounted(() => {
  planStore.loadPlanById(planId.value)
})

watch(plan, (p) => {
  if (p) {
    editStatus.value = p.status
    needsFollowUp.value = p.needsFollowUp
    followUpNotes.value = p.followUpNotes || ''
    Object.assign(editForm, {
      title: p.title,
      intervieweeId: p.intervieweeId || '',
      intervieweeName: p.intervieweeName || '',
      scheduledDate: p.scheduledDate || '',
      scheduledTime: p.scheduledTime || '',
      location: p.location || '',
      interviewer: p.interviewer || '',
      description: p.description || '',
      tags: [...(p.tags || [])]
    })
  }
}, { immediate: true })

function statusText(status: string) {
  const map: Record<string, string> = { draft: '草稿', scheduled: '已预约', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', scheduled: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

function formatDate(d?: string) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function onStatusChange(val: string) {
  planStore.updatePlan(planId.value, { status: val as InterviewPlan['status'] })
  ElMessage.success('状态已更新')
}

function onFollowUpChange(val: boolean) {
  planStore.updatePlan(planId.value, { needsFollowUp: val })
}

function saveFollowUpNotes() {
  planStore.updatePlan(planId.value, { followUpNotes: followUpNotes.value })
}

function onEditIntervieweeSelect(id: string) {
  const p = intervieweeStore.interviewees.find(x => x.id === id)
  if (p) editForm.intervieweeName = p.name
}

function saveEditForm() {
  if (!editForm.title.trim()) {
    ElMessage.warning('请输入采访主题')
    return
  }
  planStore.updatePlan(planId.value, { ...editForm })
  ElMessage.success('保存成功')
  showEditDialog.value = false
}

function addQuestion() {
  planStore.addQuestion(planId.value, '', '个人经历')
}

function saveQuestion(q: InterviewQuestion) {
  planStore.updateQuestion(planId.value, q.id, { content: q.content, category: q.category })
}

function removeQuestion(id: string) {
  planStore.removeQuestion(planId.value, id)
}

function moveQuestion(idx: number, dir: number) {
  if (!plan.value) return
  const questions = [...plan.value.questions]
  const target = idx + dir
  if (target < 0 || target >= questions.length) return
  ;[questions[idx], questions[target]] = [questions[target], questions[idx]]
  questions.forEach((q, i) => (q.order = i))
  planStore.updatePlan(planId.value, { questions })
}

function goToRecorder() { router.push('/recorder') }
function goToImport() { router.push('/import') }
function goToExport() { router.push('/export') }
function openTranscript(id: string) { router.push(`/transcript/${id}`) }
</script>

<style scoped>
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #faf8f5;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.question-index {
  width: 28px;
  height: 28px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.question-body {
  flex: 1;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info-label {
  font-size: 13px;
  color: var(--text-light);
  flex-shrink: 0;
  margin-right: 12px;
}

.info-item > span:last-child {
  color: var(--text-primary);
  font-size: 14px;
  text-align: right;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.quick-link:hover {
  background: #f5f0e8;
  color: var(--primary-color);
}

.quick-link span {
  font-size: 12px;
}
</style>
