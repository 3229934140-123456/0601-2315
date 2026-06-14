<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <div class="app-title">
          <div class="title-main">口述史采录</div>
          <div class="title-sub">数字文化馆工作站</div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="transparent"
        text-color="#d4c4a8"
        active-text-color="#ffd54f"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/interview-plans">
          <el-icon><Calendar /></el-icon>
          <span>采访计划</span>
        </el-menu-item>
        <el-menu-item index="/recorder">
          <el-icon><VideoCamera /></el-icon>
          <span>录音录像</span>
        </el-menu-item>
        <el-menu-item index="/import">
          <el-icon><Upload /></el-icon>
          <span>素材导入</span>
        </el-menu-item>
        <el-menu-item index="/transcript/0">
          <el-icon><EditPen /></el-icon>
          <span>转写校对</span>
        </el-menu-item>
        <el-menu-item index="/profiles">
          <el-icon><User /></el-icon>
          <span>人物档案</span>
        </el-menu-item>
        <el-menu-item index="/tags">
          <el-icon><PriceTag /></el-icon>
          <span>主题标签</span>
        </el-menu-item>
        <el-menu-item index="/export">
          <el-icon><Download /></el-icon>
          <span>成果导出</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <div class="version-info">v1.0.0</div>
      </div>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">{{ currentRoute.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索素材、人物、标签..."
            class="search-input"
            clearable
            :prefix-icon="Search"
          />
          <el-tooltip content="帮助">
            <el-button circle :icon="QuestionFilled" class="header-btn" />
          </el-tooltip>
          <el-tooltip content="设置">
            <el-button circle :icon="Setting" class="header-btn" />
          </el-tooltip>
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">馆</el-avatar>
            <span class="user-name">文化馆馆员</span>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, QuestionFilled, Setting } from '@element-plus/icons-vue'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useIntervieweeStore } from '@/stores/interviewee'
import { useMediaStore } from '@/stores/media'
import { useProfileStore, useTagStore } from '@/stores/profile'

const route = useRoute()
const searchQuery = ref('')

const activeMenu = computed(() => {
  if (route.path.startsWith('/interview-plans')) return '/interview-plans'
  if (route.path.startsWith('/transcript')) return '/transcript/0'
  if (route.path.startsWith('/profiles')) return '/profiles'
  return route.path
})

const currentRoute = computed(() => route)

const planStore = useInterviewPlanStore()
const intervieweeStore = useIntervieweeStore()
const mediaStore = useMediaStore()
const profileStore = useProfileStore()
const tagStore = useTagStore()

onMounted(() => {
  planStore.loadPlans()
  intervieweeStore.loadAll()
  mediaStore.loadAll()
  profileStore.loadAll()
  tagStore.loadAll()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
}

.app-sidebar {
  background: linear-gradient(180deg, #3d2b1f 0%, #2c1810 100%);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1a0f08;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 213, 79, 0.15);
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3d2b1f;
}

.app-title {
  color: #d4c4a8;
}

.title-main {
  font-size: 15px;
  font-weight: 600;
  color: #ffd54f;
}

.title-sub {
  font-size: 11px;
  color: #8b7355;
  margin-top: 2px;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  padding: 12px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 46px;
  line-height: 46px;
  margin: 2px 12px;
  border-radius: 8px;
  padding-left: 16px !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 213, 79, 0.08);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 213, 79, 0.15);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 213, 79, 0.1);
}

.version-info {
  font-size: 12px;
  color: #5d4e37;
  text-align: center;
}

.app-header {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.header-btn {
  background: #f5f0e8;
  border: none;
  color: var(--text-secondary);
}

.header-btn:hover {
  background: #ebe0d0;
  color: var(--primary-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  border-left: 1px solid var(--border-color);
}

.user-avatar {
  background: var(--primary-color);
}

.user-name {
  font-size: 13px;
  color: var(--text-primary);
}

.app-main {
  padding: 0;
  background: var(--bg-color);
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
