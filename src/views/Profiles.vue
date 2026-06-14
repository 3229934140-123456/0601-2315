<template>
  <div class="page-container profiles-page">
    <div class="page-header">
      <div>
        <div class="page-title">人物档案</div>
        <div class="page-subtitle">建立受访艺人档案，记录生平年表、传承脉络、授权信息</div>
      </div>
      <div class="header-actions flex-between gap-12">
        <el-input v-model="searchText" placeholder="搜索姓名、技艺..." clearable style="width: 240px;" />
        <el-select v-model="filterCategory" placeholder="技艺类别" clearable style="width: 150px;">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="createNewProfile">新建档案</el-button>
      </div>
    </div>

    <el-row :gutter="16" v-if="filteredProfiles.length">
      <el-col :span="6" v-for="profile in filteredProfiles" :key="profile.id">
        <div class="profile-card" @click="openProfile(profile.id)">
          <div class="profile-avatar">
            <el-avatar :size="64">
              {{ profile.name ? profile.name.slice(0, 1) : '?' }}
            </el-avatar>
          </div>
          <div class="profile-info">
            <div class="profile-name">{{ profile.name }}</div>
            <div class="profile-meta text-small text-muted" v-if="profile.artCategory">
              {{ profile.artCategory }}
            </div>
            <div class="profile-meta text-small text-muted" v-if="profile.nativePlace">
              {{ profile.nativePlace }}
            </div>
            <div class="profile-stats mt-8">
              <span class="stat-badge">
                <el-icon :size="12"><Calendar /></el-icon>
                {{ profile.chronology.length }} 条年表
              </span>
              <span class="stat-badge">
                <el-icon :size="12"><Picture /></el-icon>
                {{ profile.relatedPhotos.length }} 张照片
              </span>
            </div>
            <div class="profile-auth mt-8">
              <el-tag v-if="profile.authorization.hasAuthorization" type="success" size="small" effect="plain">
                <el-icon style="margin-right: 2px;"><CircleCheck /></el-icon>已授权
              </el-tag>
              <el-tag v-else type="warning" size="small" effect="plain">
                <el-icon style="margin-right: 2px;"><Warning /></el-icon>未授权
              </el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="empty-state" v-else style="margin-top: 60px;">
      <el-icon :size="64" color="#c4b8a8"><UserFilled /></el-icon>
      <p style="margin-top: 16px; font-size: 16px;">暂无人物档案</p>
      <p class="text-muted" style="margin-top: 4px;">为受访艺人建立完整的人物档案</p>
      <el-button type="primary" style="margin-top: 20px;" :icon="Plus" @click="createNewProfile">新建人物档案</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, UserFilled, Calendar, Picture, CircleCheck, Warning } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import { useIntervieweeStore } from '@/stores/interviewee'

const router = useRouter()
const profileStore = useProfileStore()
const intervieweeStore = useIntervieweeStore()

const searchText = ref('')
const filterCategory = ref('')

onMounted(() => {
  profileStore.loadAll()
})

const categories = computed(() => {
  const set = new Set<string>()
  profileStore.profiles.forEach(p => { if (p.artCategory) set.add(p.artCategory) })
  return Array.from(set)
})

const filteredProfiles = computed(() => {
  let result = profileStore.profiles
  if (filterCategory.value) result = result.filter(p => p.artCategory === filterCategory.value)
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      (p.artCategory || '').toLowerCase().includes(kw) ||
      (p.nativePlace || '').toLowerCase().includes(kw) ||
      (p.occupation || '').toLowerCase().includes(kw)
    )
  }
  return result
})

function createNewProfile() {
  const profile = profileStore.create({
    name: '新人物档案',
    chronology: [],
    relatedPhotos: [],
    authorization: { hasAuthorization: false },
    tags: []
  })
  ElMessage.success('已创建新档案')
  router.push(`/profiles/${profile.id}`)
}

function openProfile(id: string) {
  router.push(`/profiles/${id}`)
}
</script>

<style scoped>
.profiles-page {
  min-height: 100%;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.profile-card:hover {
  box-shadow: 0 4px 20px rgba(139, 90, 43, 0.1);
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar :deep(.el-avatar) {
  background: linear-gradient(135deg, #a67c52, #8b5a2b);
  font-size: 24px;
  font-weight: 600;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.profile-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-stats {
  display: flex;
  gap: 10px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-light);
  background: #faf8f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.profile-auth {
  display: flex;
}
</style>
