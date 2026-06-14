<template>
  <div class="page-container tags-page">
    <div class="page-header">
      <div>
        <div class="page-title">主题标签</div>
        <div class="page-subtitle">管理口述史主题标签，快速检索相关内容片段</div>
      </div>
      <div class="header-actions flex-between gap-12">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建标签</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="9">
        <div class="card">
          <div class="card-title">标签分类</div>
          <div class="category-tabs">
            <div
              class="category-tab"
              :class="{ active: activeCategory === '' }"
              @click="activeCategory = ''"
            >
              <el-icon><Grid /></el-icon>
              <span>全部</span>
              <span class="count">{{ tagStore.tags.length }}</span>
            </div>
            <div
              v-for="cat in categories"
              :key="cat.key"
              class="category-tab"
              :class="{ active: activeCategory === cat.key }"
              @click="activeCategory = cat.key"
            >
              <el-icon><component :is="cat.icon" /></el-icon>
              <span>{{ cat.label }}</span>
              <span class="count">{{ getCategoryCount(cat.key) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">标签列表</div>
            <el-input v-model="searchTag" placeholder="搜索标签" clearable size="small" style="width: 180px;" />
          </div>
          <div class="tag-list">
            <div
              v-for="tag in filteredTags"
              :key="tag.id"
              class="tag-item"
              :class="{ active: selectedTagId === tag.id }"
              @click="selectTag(tag.id)"
            >
              <span class="tag-color" :style="{ background: tag.color }"></span>
              <div class="tag-info">
                <div class="tag-name">{{ tag.name }}</div>
                <div class="tag-cat text-small text-muted">
                  {{ categoryLabel(tag.category) }} · 使用 {{ tag.usageCount }} 次
                </div>
              </div>
              <div class="tag-actions">
                <el-button size="small" text type="primary" :icon="Edit" @click.stop="editTag(tag)"></el-button>
                <el-button size="small" text type="danger" :icon="Delete" @click.stop="deleteTag(tag)"></el-button>
              </div>
            </div>
            <div v-if="filteredTags.length === 0" class="empty-state" style="padding: 20px;">
              <p class="text-muted">暂无标签</p>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="15">
        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">
              <span v-if="selectedTag">检索结果 - {{ selectedTag.name }}</span>
              <span v-else>内容检索</span>
            </div>
            <div class="flex-between gap-8">
              <el-select v-model="searchType" placeholder="搜索范围" size="small" style="width: 140px;">
                <el-option label="全部" value="all" />
                <el-option label="转写片段" value="segment" />
                <el-option label="素材" value="asset" />
                <el-option label="人物档案" value="person" />
                <el-option label="采访计划" value="plan" />
              </el-select>
              <el-input v-model="searchKeyword" placeholder="关键词搜索" clearable size="small" style="width: 220px;" />
              <el-button type="primary" size="small" :icon="Search" @click="doSearch">搜索</el-button>
            </div>
          </div>

          <div class="search-results" v-if="searchResults.length">
            <div
              v-for="(item, idx) in searchResults"
              :key="idx"
              class="result-item"
              @click="openResult(item)"
            >
              <div class="result-type">
                <el-tag size="small" :type="resultTypeTag(item.type)" effect="plain">
                  {{ resultTypeText(item.type) }}
                </el-tag>
              </div>
              <div class="result-content">
                <div class="result-title">{{ item.title }}</div>
                <div class="result-snippet text-muted text-small" v-if="item.snippet">{{ item.snippet }}</div>
                <div class="result-meta text-small text-muted mt-8" v-if="item.matchedTags?.length">
                  <span>匹配标签：
                    <el-tag v-for="t in item.matchedTags" :key="t" size="small" effect="plain" style="margin-left: 4px;">{{ t }}</el-tag>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 40px;">
            <el-icon :size="48" color="#c4b8a8"><Search /></el-icon>
            <p style="margin-top: 12px;">{{ searchKeyword || selectedTag ? '没有找到相关内容' : '选择标签或输入关键词开始检索' }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" :title="editingTag ? '编辑标签' : '新建标签'" width="480px">
      <el-form :model="tagForm" label-width="90px">
        <el-form-item label="标签名称" required>
          <el-input v-model="tagForm.name" placeholder="如：传统技艺" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="tagForm.category" style="width: 100%;">
            <el-option v-for="c in categories" :key="c.key" :label="c.label" :value="c.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="tagForm.color" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tagForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeTagDialog">取消</el-button>
        <el-button type="primary" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Search, Grid, Collection, Picture, Calendar, User, Files
} from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/profile'
import { useMediaStore } from '@/stores/media'
import { useInterviewPlanStore } from '@/stores/interviewPlan'
import { useProfileStore } from '@/stores/profile'
import type { TopicTag, SearchResult } from '@/types'

const router = useRouter()
const tagStore = useTagStore()
const mediaStore = useMediaStore()
const planStore = useInterviewPlanStore()
const profileStore = useProfileStore()

const categories = [
  { key: 'theme', label: '主题', icon: Collection },
  { key: 'art', label: '艺术', icon: Picture },
  { key: 'region', label: '地域', icon: 'Location' as any },
  { key: 'era', label: '年代', icon: Calendar },
  { key: 'other', label: '其他', icon: 'More' as any }
]

const activeCategory = ref('')
const searchTag = ref('')
const selectedTagId = ref('')
const searchType = ref('all')
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const editingTag = ref<TopicTag | null>(null)
const searchResults = ref<SearchResult[]>([])

const tagForm = reactive({
  name: '',
  category: 'theme' as TopicTag['category'],
  color: '#8b5a2b',
  description: ''
})

onMounted(() => {
  tagStore.loadAll()
})

const selectedTag = computed(() => tagStore.tags.find(t => t.id === selectedTagId.value))

const filteredTags = computed(() => {
  let result = tagStore.tags
  if (activeCategory.value) {
    result = result.filter(t => t.category === activeCategory.value)
  }
  if (searchTag.value) {
    const kw = searchTag.value.toLowerCase()
    result = result.filter(t => t.name.toLowerCase().includes(kw))
  }
  return [...result].sort((a, b) => b.usageCount - a.usageCount)
})

function getCategoryCount(cat: string) {
  return tagStore.tags.filter(t => t.category === cat).length
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    theme: '主题', art: '艺术', region: '地域', era: '年代', other: '其他'
  }
  return map[cat] || cat
}

function selectTag(id: string) {
  selectedTagId.value = id
  doSearch()
}

function editTag(tag: TopicTag) {
  editingTag.value = tag
  tagForm.name = tag.name
  tagForm.category = tag.category
  tagForm.color = tag.color
  tagForm.description = tag.description || ''
  showCreateDialog.value = true
}

function closeTagDialog() {
  showCreateDialog.value = false
  editingTag.value = null
  tagForm.name = ''
  tagForm.category = 'theme'
  tagForm.color = '#8b5a2b'
  tagForm.description = ''
}

function saveTag() {
  if (!tagForm.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  if (editingTag.value) {
    tagStore.update(editingTag.value.id, { ...tagForm })
    ElMessage.success('已更新')
  } else {
    tagStore.create({ ...tagForm })
    ElMessage.success('已创建')
  }
  closeTagDialog()
}

function deleteTag(tag: TopicTag) {
  ElMessageBox.confirm(`删除标签「${tag.name}」吗？`, '删除确认', {
    type: 'warning'
  }).then(() => {
    tagStore.remove(tag.id)
    if (selectedTagId.value === tag.id) {
      selectedTagId.value = ''
    }
    ElMessage.success('已删除')
  }).catch(() => {})
}

function doSearch() {
  const results: SearchResult[] = []
  const tagName = selectedTag.value?.name
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (searchType.value === 'all' || searchType.value === 'segment') {
    mediaStore.transcripts.forEach(seg => {
      if (!seg.text) return
      const text = seg.text.toLowerCase()
      if (tagName) {
        const asset = mediaStore.assets.find(a => a.id === seg.mediaAssetId)
        const hasTag = asset?.tags.includes(tagName)
        if (!hasTag) return
      }
      if (keyword && !text.includes(keyword)) return
      results.push({
        type: 'segment',
        id: seg.id,
        title: `片段 - ${formatTime(seg.startTime)}`,
        snippet: seg.text.slice(0, 100),
        matchedTags: tagName ? [tagName] : [],
        timestamp: seg.startTime,
        mediaAssetId: seg.mediaAssetId
      })
    })
  }

  if (searchType.value === 'all' || searchType.value === 'asset') {
    mediaStore.assets.forEach(asset => {
      if (tagName && !asset.tags.includes(tagName)) return
      if (keyword) {
        const titleMatch = asset.title.toLowerCase().includes(keyword)
        const nameMatch = asset.fileName?.toLowerCase().includes(keyword)
        const descMatch = asset.description?.toLowerCase().includes(keyword)
        if (!titleMatch && !nameMatch && !descMatch) return
      }
      results.push({
        type: 'asset',
        id: asset.id,
        title: asset.title,
        snippet: asset.description || asset.fileName,
        matchedTags: tagName ? [tagName] : asset.tags
      })
    })
  }

  if (searchType.value === 'all' || searchType.value === 'person') {
    profileStore.profiles.forEach(p => {
      if (tagName && !p.tags.includes(tagName)) return
      if (keyword) {
        const nameMatch = p.name.toLowerCase().includes(keyword)
        const bioMatch = p.biography?.toLowerCase().includes(keyword)
        const artMatch = p.artCategory?.toLowerCase().includes(keyword)
        const occMatch = p.occupation?.toLowerCase().includes(keyword)
        if (!nameMatch && !bioMatch && !artMatch && !occMatch) return
      }
      results.push({
        type: 'person',
        id: p.id,
        title: p.name,
        snippet: p.artCategory || p.occupation || p.biography?.slice(0, 80),
        matchedTags: tagName ? [tagName] : p.tags
      })
    })
  }

  if (searchType.value === 'all' || searchType.value === 'plan') {
    planStore.plans.forEach(plan => {
      if (tagName && !plan.tags.includes(tagName)) return
      if (keyword) {
        const titleMatch = plan.title.toLowerCase().includes(keyword)
        const descMatch = plan.description?.toLowerCase().includes(keyword)
        const outlineMatch = plan.outline?.some(o => o.content?.toLowerCase().includes(keyword))
        if (!titleMatch && !descMatch && !outlineMatch) return
      }
      results.push({
        type: 'plan',
        id: plan.id,
        title: plan.title,
        snippet: plan.description,
        matchedTags: tagName ? [tagName] : plan.tags
      })
    })
  }

  searchResults.value = results.slice(0, 50)
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function resultTypeText(type: string) {
  const map: Record<string, string> = {
    segment: '转写片段', asset: '素材', person: '人物', plan: '采访计划'
  }
  return map[type] || type
}

function resultTypeTag(type: string) {
  const map: Record<string, string> = {
    segment: '', asset: 'primary', person: 'success', plan: 'warning'
  }
  return map[type] || ''
}

function openResult(item: SearchResult) {
  if (item.type === 'segment' && item.mediaAssetId) {
    router.push(`/transcript/${item.mediaAssetId}`)
  } else if (item.type === 'asset') {
    router.push(`/transcript/${item.id}`)
  } else if (item.type === 'person') {
    router.push(`/profiles/${item.id}`)
  } else if (item.type === 'plan') {
    router.push(`/interview-plans/${item.id}`)
  }
}
</script>

<style scoped>
.tags-page { min-height: 100%; }

.category-tabs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.category-tab:hover {
  background: #faf6f0;
}

.category-tab.active {
  background: #fff3e0;
  color: var(--primary-color);
  font-weight: 500;
}

.category-tab .count {
  margin-left: auto;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 10px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  background: #faf8f5;
}

.tag-item.active {
  border-color: var(--primary-color);
  background: #fffaf3;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-info {
  flex: 1;
  min-width: 0;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.tag-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tag-item:hover .tag-actions {
  opacity: 1;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.result-item {
  padding: 14px 16px;
  background: #faf8f5;
  border-radius: 10px;
  border-left: 3px solid var(--primary-light);
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: #fff3e0;
  border-left-color: var(--primary-color);
}

.result-type {
  margin-bottom: 8px;
}

.result-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.result-snippet {
  margin-top: 4px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
