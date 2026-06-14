<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">工作台</div>
        <div class="page-subtitle">欢迎使用口述史采录工作站，今日工作概览</div>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="goToNewPlan">新建采访计划</el-button>
        <el-button :icon="VideoCamera" @click="goToRecorder">开始录制</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff3e0; color: #e65100;">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ planStore.plans.length }}</div>
            <div class="stat-label">采访计划</div>
          </div>
          <div class="stat-trend stat-trend-up">
            <span>本月 +{{ planStore.plans.length }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e3f2fd; color: #1565c0;">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ intervieweeStore.interviewees.length }}</div>
            <div class="stat-label">受访艺人</div>
          </div>
          <div class="stat-trend stat-trend-up">
            <span>档案 {{ profileStore.profiles.length }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e8f5e9; color: #2e7d32;">
            <el-icon :size="24"><VideoCamera /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ mediaStore.videoAssets.length }}</div>
            <div class="stat-label">视频素材</div>
          </div>
          <div class="stat-trend">
            <span>音频 {{ mediaStore.audioAssets.length }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f3e5f5; color: #7b1fa2;">
            <el-icon :size="24"><PriceTag /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ tagStore.tags.length }}</div>
            <div class="stat-label">主题标签</div>
          </div>
          <div class="stat-trend">
            <span>待补采 {{ planStore.followUpPlans.length }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="14">
        <div class="card">
          <div class="flex-between" style="margin-bottom: 16px;">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">近期采访计划</div>
            <el-button link type="primary" @click="router.push('/interview-plans')">查看全部</el-button>
          </div>
          <el-table :data="recentPlans" style="width: 100%" v-if="recentPlans.length > 0">
            <el-table-column prop="title" label="采访主题" min-width="180">
              <template #default="{ row }">
                <div class="plan-title-cell">{{ row.title }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="intervieweeName" label="受访人" width="120" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                <span v-if="row.scheduledDate">{{ row.scheduledDate }} {{ row.scheduledTime }}</span>
                <span v-else class="text-light">未安排</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPlan(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="empty-state" v-else>
            <el-icon :size="48"><Box /></el-icon>
            <p style="margin-top: 12px;">暂无采访计划</p>
            <el-button type="primary" style="margin-top: 16px;" @click="goToNewPlan">创建第一个计划</el-button>
          </div>
        </div>

        <div class="card">
          <div class="flex-between" style="margin-bottom: 16px;">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">最近素材</div>
            <el-button link type="primary" @click="router.push('/import')">素材库</el-button>
          </div>
          <el-table :data="recentAssets" style="width: 100%" v-if="recentAssets.length > 0">
            <el-table-column label="类型" width="70">
              <template #default="{ row }">
                <el-tag :type="assetTagType(row.type)" size="small">{{ assetTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="fileName" label="文件名" min-width="150" show-overflow-tooltip />
            <el-table-column label="时长/大小" width="120">
              <template #default="{ row }">
                <span v-if="row.duration">{{ formatDuration(row.duration) }}</span>
                <span v-else>{{ formatFileSize(row.fileSize) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openTranscript(row.id)" v-if="row.type === 'audio' || row.type === 'video'">转写</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="empty-state" v-else>
            <el-icon :size="48"><Folder /></el-icon>
            <p style="margin-top: 12px;">暂无素材</p>
          </div>
        </div>
      </el-col>

      <el-col :span="10">
        <div class="card">
          <div class="card-title" style="margin-bottom: 16px;">快捷操作</div>
          <div class="quick-actions">
            <div class="quick-action" @click="goToNewPlan">
              <div class="quick-icon" style="background: #fff3e0;"><el-icon :size="22"><Plus /></el-icon></div>
              <span>新建采访计划</span>
            </div>
            <div class="quick-action" @click="goToRecorder">
              <div class="quick-icon" style="background: #ffebee;"><el-icon :size="22"><VideoCamera /></el-icon></div>
              <span>开始录制</span>
            </div>
            <div class="quick-action" @click="goToImport">
              <div class="quick-icon" style="background: #e3f2fd;"><el-icon :size="22"><Upload /></el-icon></div>
              <span>导入素材</span>
            </div>
            <div class="quick-action" @click="goToProfiles">
              <div class="quick-icon" style="background: #e8f5e9;"><el-icon :size="22"><User /></el-icon></div>
              <span>人物档案</span>
            </div>
            <div class="quick-action" @click="goToTags">
              <div class="quick-icon" style="background: #f3e5f5;"><el-icon :size="22"><PriceTag /></el-icon></div>
              <span>标签管理</span>
            </div>
            <div class="quick-action" @click="goToExport">
              <div class="quick-icon" style="background: #fff8e1;"><el-icon :size="22"><Download /></el-icon></div>
              <span>成果导出</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 16px;">待办提醒</div>
          <div class="todo-list">
            <div class="todo-item" v-for="(plan, idx) in planStore.followUpPlans.slice(0, 5)" :key="idx">
              <div class="todo-dot todo-dot-orange"></div>
              <div class="todo-content">
                <div class="todo-title">【待补采】{{ plan.title }}</div>
                <div class="todo-desc text-small text-muted">{{ plan.followUpNotes || '需要补采相关内容' }}</div>
              </div>
            </div>
            <div class="todo-item" v-for="(plan, idx) in scheduledToday" :key="'s' + idx">
              <div class="todo-dot todo-dot-blue"></div>
              <div class="todo-content">
                <div class="todo-title">【今日采访】{{ plan.title }}</div>
                <div class="todo-desc text-small text-muted">{{ plan.scheduledTime }} · {{ plan.location || '地点待定' }}</div>
              </div>
            </div>
            <div class="empty-state" v-if="planStore.followUpPlans.length === 0 && scheduledToday.length === 0" style="padding: 20px;">
              <el-icon :size="32"><CircleCheck /></el-icon>
              <p style="margin-top: 8px; font-size: 13px;">暂无待办事项</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 16px;">常用标签</div>
          <div class="tag-cloud">
            <el-tag
              v-for="tag in tagStore.tags.slice(0, 12)"
              :key="tag.id"
              :color="tag.color + '20'"
              :style="{ color: tag.color, borderColor: tag.color + '40' }"
              effect="plain"
              style="margin: 4px;"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, VideoCamera, Calendar, User, PriceTag, Box, Folder, CircleCheck
} from '@element-plus/icons-vue'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useIntervieweeStore } from '@/stores/interviewee'
import { useMediaStore } from '@/stores/media'
import { useProfileStore, useTagStore } from '@/stores/profile'
import dayjs from 'dayjs'

const router = useRouter()
const planStore = useInterviewPlanStore()
const intervieweeStore = useIntervieweeStore()
const mediaStore = useMediaStore()
const profileStore = useProfileStore()
const tagStore = useTagStore()

const recentPlans = computed(() => [...planStore.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5))
const recentAssets = computed(() => [...mediaStore.assets].sort((a, b) => b.importedAt.localeCompare(a.importedAt)).slice(0, 5))
const scheduledToday = computed(() => planStore.plans.filter(p => p.scheduledDate === dayjs().format('YYYY-MM-DD')))

function statusText(status: string) {
  const map: Record<string, string> = { draft: '草稿', scheduled: '已预约', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', scheduled: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

function assetTypeText(type: string) {
  const map: Record<string, string> = { audio: '音频', video: '视频', image: '图片', document: '文档' }
  return map[type] || type
}

function assetTagType(type: string) {
  const map: Record<string, string> = { audio: '', video: 'primary', image: 'success', document: 'info' }
  return map[type] || ''
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function goToNewPlan() { router.push('/interview-plans') }
function goToRecorder() { router.push('/recorder') }
function goToImport() { router.push('/import') }
function goToProfiles() { router.push('/profiles') }
function goToTags() { router.push('/tags') }
function goToExport() { router.push('/export') }
function openPlan(id: string) { router.push(`/interview-plans/${id}`) }
function openTranscript(id: string) { router.push(`/transcript/${id}`) }
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-trend {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-size: 11px;
  color: var(--text-light);
}

.stat-trend-up {
  color: #27ae60;
}

.plan-title-cell {
  font-weight: 500;
  color: var(--text-primary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action:hover {
  background: #faf6f0;
  transform: translateY(-2px);
}

.quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-action span {
  font-size: 12px;
  color: var(--text-secondary);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.todo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.todo-dot-orange { background: #e67e22; }
.todo-dot-blue { background: #2980b9; }

.todo-content { flex: 1; }

.todo-title {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.todo-desc {
  margin-top: 2px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
}
</style>
