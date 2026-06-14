<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">采访计划</div>
        <div class="page-subtitle">管理采访提纲、预约受访艺人、跟进采访进度</div>
      </div>
      <div class="header-actions flex-between gap-12">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px;">
          <el-option label="草稿" value="draft" />
          <el-option label="已预约" value="scheduled" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input v-model="searchText" placeholder="搜索计划" clearable style="width: 200px;" />
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建计划</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="plan-cards" v-if="filteredPlans.length > 0">
      <el-col :span="8" v-for="plan in filteredPlans" :key="plan.id">
        <div class="plan-card" @click="openPlan(plan.id)">
          <div class="plan-card-header">
            <el-tag :type="statusTagType(plan.status)" size="small">{{ statusText(plan.status) }}</el-tag>
            <el-tag v-if="plan.needsFollowUp" type="warning" size="small" effect="dark">待补采</el-tag>
          </div>
          <div class="plan-card-title">{{ plan.title }}</div>
          <div class="plan-card-meta">
            <div class="meta-item" v-if="plan.intervieweeName">
              <el-icon><User /></el-icon>
              <span>{{ plan.intervieweeName }}</span>
            </div>
            <div class="meta-item" v-if="plan.scheduledDate">
              <el-icon><Calendar /></el-icon>
              <span>{{ plan.scheduledDate }} {{ plan.scheduledTime || '' }}</span>
            </div>
          </div>
          <div class="plan-card-desc text-muted text-small" v-if="plan.description">
            {{ plan.description.slice(0, 60) }}{{ plan.description.length > 60 ? '...' : '' }}
          </div>
          <div class="plan-card-footer">
            <div class="question-count">
              <el-icon><List /></el-icon>
              <span>{{ plan.questions.length }} 个问题</span>
            </div>
            <div class="tag-list">
              <el-tag size="small" v-for="tag in plan.tags.slice(0, 2)" :key="tag" effect="plain">{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="empty-state" v-else>
      <el-icon :size="64"><DocumentAdd /></el-icon>
      <p style="margin-top: 16px; font-size: 15px;">还没有采访计划</p>
      <p class="text-muted" style="margin-top: 4px;">创建第一个采访计划，开始口述史采集工作</p>
      <el-button type="primary" size="large" style="margin-top: 24px;" :icon="Plus" @click="showCreateDialog = true">
        新建采访计划
      </el-button>
    </div>

    <el-dialog v-model="showCreateDialog" title="新建采访计划" width="600px" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="100px" ref="createFormRef">
        <el-form-item label="采访主题" prop="title" :rules="[{ required: true, message: '请输入采访主题', trigger: 'blur' }]">
          <el-input v-model="createForm.title" placeholder="例如：XX工艺传承人访谈" />
        </el-form-item>
        <el-form-item label="受访艺人">
          <el-select
            v-model="createForm.intervieweeId"
            placeholder="选择已有受访人"
            clearable
            filterable
            @change="onIntervieweeSelect"
          >
            <el-option v-for="p in intervieweeStore.interviewees" :key="p.id" :label="p.name" :value="p.id">
              <span>{{ p.name }}</span>
              <span class="text-muted text-small" style="margin-left: 8px;">{{ p.artCategory || p.occupation || '' }}</span>
            </el-option>
          </el-select>
          <el-button link type="primary" style="margin-left: 8px;" @click="showIntervieweeDialog = true">新建受访人</el-button>
        </el-form-item>
        <el-form-item label="受访人姓名" v-if="!createForm.intervieweeId">
          <el-input v-model="createForm.intervieweeName" placeholder="受访人姓名" />
        </el-form-item>
        <el-form-item label="采访时间">
          <div style="display: flex; gap: 8px;">
            <el-date-picker v-model="createForm.scheduledDate" type="date" placeholder="选择日期" style="flex: 1;" />
            <el-time-picker v-model="createForm.scheduledTime" placeholder="选择时间" style="flex: 1;" />
          </div>
        </el-form-item>
        <el-form-item label="采访地点">
          <el-input v-model="createForm.location" placeholder="例如：文化馆三楼采访室" />
        </el-form-item>
        <el-form-item label="采访人员">
          <el-input v-model="createForm.interviewer" placeholder="采访人姓名" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="采访背景、目的等说明" />
        </el-form-item>
        <el-form-item label="主题标签">
          <el-select v-model="createForm.tags" multiple placeholder="选择标签" filterable>
            <el-option v-for="tag in tagStore.tags" :key="tag.id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPlan">创建计划</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showIntervieweeDialog" title="新建受访人" width="500px">
      <el-form :model="intervieweeForm" label-width="90px">
        <el-form-item label="姓名" required>
          <el-input v-model="intervieweeForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="intervieweeForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="intervieweeForm.birthDate" type="date" placeholder="选择出生日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="民族">
          <el-input v-model="intervieweeForm.ethnicity" placeholder="例如：汉族" />
        </el-form-item>
        <el-form-item label="籍贯">
          <el-input v-model="intervieweeForm.nativePlace" placeholder="例如：浙江杭州" />
        </el-form-item>
        <el-form-item label="技艺类别">
          <el-input v-model="intervieweeForm.artCategory" placeholder="例如：木雕、越剧" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="intervieweeForm.contact" placeholder="电话或其他联系方式" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showIntervieweeDialog = false">取消</el-button>
        <el-button type="primary" @click="createInterviewee">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { Plus, User, Calendar, List, DocumentAdd } from '@element-plus/icons-vue'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useIntervieweeStore } from '@/stores/interviewee'
import { useTagStore } from '@/stores/profile'
import type { InterviewPlan } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const planStore = useInterviewPlanStore()
const intervieweeStore = useIntervieweeStore()
const tagStore = useTagStore()

const searchText = ref('')
const filterStatus = ref('')
const showCreateDialog = ref(false)
const showIntervieweeDialog = ref(false)
const createFormRef = ref<InstanceType<typeof ElForm>>()

const createForm = reactive({
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

const intervieweeForm = reactive({
  name: '',
  gender: '男' as '男' | '女',
  birthDate: '',
  ethnicity: '',
  nativePlace: '',
  artCategory: '',
  occupation: '',
  contact: '',
  address: '',
  biography: ''
})

const filteredPlans = computed(() => {
  let result = planStore.plans
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      (p.intervieweeName || '').toLowerCase().includes(kw) ||
      p.description?.toLowerCase().includes(kw)
    )
  }
  return [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function statusText(status: InterviewPlan['status']) {
  const map = { draft: '草稿', scheduled: '已预约', completed: '已完成', cancelled: '已取消' }
  return map[status]
}

function statusTagType(status: InterviewPlan['status']) {
  const map: Record<string, string> = { draft: 'info', scheduled: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status]
}

function openPlan(id: string) {
  router.push(`/interview-plans/${id}`)
}

function onIntervieweeSelect(id: string) {
  const p = intervieweeStore.interviewees.find(x => x.id === id)
  if (p) {
    createForm.intervieweeName = p.name
  }
}

function createInterviewee() {
  if (!intervieweeForm.name.trim()) {
    ElMessage.warning('请输入受访人姓名')
    return
  }
  const item = intervieweeStore.create({ ...intervieweeForm })
  createForm.intervieweeId = item.id
  createForm.intervieweeName = item.name
  ElMessage.success('受访人已添加')
  showIntervieweeDialog.value = false
  Object.assign(intervieweeForm, {
    name: '', gender: '男', birthDate: '', ethnicity: '', nativePlace: '',
    artCategory: '', occupation: '', contact: '', address: '', biography: ''
  })
}

function createPlan() {
  createFormRef.value?.validate(valid => {
    if (!valid) return
    let dateStr = createForm.scheduledDate
    if (dateStr && typeof dateStr !== 'string') {
      dateStr = dayjs(dateStr as any).format('YYYY-MM-DD')
    }
    let timeStr = createForm.scheduledTime
    if (timeStr && typeof timeStr !== 'string') {
      timeStr = dayjs(timeStr as any).format('HH:mm')
    }
    const plan = planStore.createPlan({
      title: createForm.title,
      intervieweeId: createForm.intervieweeId || undefined,
      intervieweeName: createForm.intervieweeName || undefined,
      scheduledDate: dateStr as string,
      scheduledTime: timeStr as string,
      location: createForm.location || undefined,
      interviewer: createForm.interviewer || undefined,
      description: createForm.description || undefined
    })
    if (createForm.tags.length > 0) {
      planStore.updatePlan(plan.id, { tags: createForm.tags })
    }
    ElMessage.success('采访计划已创建')
    showCreateDialog.value = false
    Object.assign(createForm, {
      title: '', intervieweeId: '', intervieweeName: '', scheduledDate: '',
      scheduledTime: '', location: '', interviewer: '', description: '', tags: []
    })
    router.push(`/interview-plans/${plan.id}`)
  })
}
</script>

<style scoped>
.plan-cards {
  margin-top: 8px;
}

.plan-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  margin-bottom: 16px;
}

.plan-card:hover {
  box-shadow: 0 4px 20px rgba(139, 90, 43, 0.12);
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.plan-card-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.plan-card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.4;
}

.plan-card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.plan-card-desc {
  margin-bottom: 14px;
  line-height: 1.6;
}

.plan-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.question-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-light);
}

.tag-list {
  display: flex;
  gap: 4px;
}
</style>
