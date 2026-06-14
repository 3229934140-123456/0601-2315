<template>
  <div class="page-container profile-detail">
    <div class="page-header">
      <div class="flex-between" style="gap: 16px; flex: 1;">
        <div>
          <div class="flex-between" style="gap: 12px;">
            <el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button>
            <div>
              <div class="page-title">{{ profile?.name || '人物档案' }}</div>
              <div class="page-subtitle">
                <span v-if="profile?.artCategory">{{ profile.artCategory }}</span>
                <span v-if="profile?.nativePlace" style="margin-left: 12px;">{{ profile.nativePlace }}</span>
                <span v-if="profile?.ethnicity" style="margin-left: 12px;">{{ profile.ethnicity }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-between gap-8">
          <el-button :icon="Edit" @click="showEditDialog = true">编辑资料</el-button>
          <el-button type="primary" :icon="Download" @click="goToExport">导出档案</el-button>
        </div>
      </div>
    </div>

    <div v-if="!profile" class="empty-state" style="margin-top: 80px;">
      <el-icon :size="56" color="#c4b8a8"><UserFilled /></el-icon>
      <p style="margin-top: 12px;">未找到人物档案</p>
    </div>

    <el-row :gutter="16" v-else>
      <el-col :span="8">
        <div class="card">
          <div class="profile-header">
            <el-avatar :size="80" class="big-avatar">
              {{ profile.name ? profile.name.slice(0, 1) : '?' }}
            </el-avatar>
            <div class="profile-header-info">
              <div class="profile-name-lg">{{ profile.name }}</div>
              <div class="profile-sub" v-if="profile.aliases?.length">
                别名：{{ profile.aliases.join('、') }}
              </div>
              <div class="profile-auth mt-8">
                <el-tag v-if="profile.authorization.hasAuthorization" type="success" effect="light">
                  <el-icon style="margin-right: 4px;"><CircleCheck /></el-icon>已获得授权
                </el-tag>
                <el-tag v-else type="warning" effect="light">
                  <el-icon style="margin-right: 4px;"><Warning /></el-icon>未授权
                </el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="info-section">
            <div class="info-title mb-12">基本信息</div>
            <div class="info-grid">
              <div class="info-item" v-if="profile.gender">
                <span class="info-label">性别</span>
                <span>{{ profile.gender }}</span>
              </div>
              <div class="info-item" v-if="profile.birthDate">
                <span class="info-label">出生日期</span>
                <span>{{ profile.birthDate }}</span>
              </div>
              <div class="info-item" v-if="profile.deathDate">
                <span class="info-label">逝世日期</span>
                <span>{{ profile.deathDate }}</span>
              </div>
              <div class="info-item" v-if="profile.ethnicity">
                <span class="info-label">民族</span>
                <span>{{ profile.ethnicity }}</span>
              </div>
              <div class="info-item" v-if="profile.nativePlace">
                <span class="info-label">籍贯</span>
                <span>{{ profile.nativePlace }}</span>
              </div>
              <div class="info-item" v-if="profile.occupation">
                <span class="info-label">职业</span>
                <span>{{ profile.occupation }}</span>
              </div>
              <div class="info-item" v-if="profile.artCategory">
                <span class="info-label">技艺类别</span>
                <span>{{ profile.artCategory }}</span>
              </div>
            </div>
          </div>

          <div class="info-section mt-16" v-if="profile.representativeWorks?.length">
            <div class="info-title mb-12">代表作品</div>
            <div class="works-list">
              <el-tag v-for="(w, idx) in profile.representativeWorks" :key="idx" effect="plain" style="margin: 4px;">
                {{ w }}
              </el-tag>
            </div>
          </div>

          <div class="info-section mt-16" v-if="profile.biography">
            <div class="info-title mb-12">人物简介</div>
            <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">{{ profile.biography }}</p>
          </div>

          <div class="info-section mt-16" v-if="profile.tags?.length">
            <div class="info-title mb-12">主题标签</div>
            <div>
              <el-tag v-for="t in profile.tags" :key="t" effect="plain" style="margin: 4px;">{{ t }}</el-tag>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex-between mb-12">
            <div class="info-title">授权说明</div>
            <el-button size="small" text type="primary" @click="showAuthDialog = true">编辑授权</el-button>
          </div>
          <div v-if="profile.authorization.hasAuthorization">
            <div class="auth-item">
              <span class="info-label">授权类型</span>
              <el-tag :type="authTypeTag(profile.authorization.authorizationType)">
                {{ authTypeText(profile.authorization.authorizationType) }}
              </el-tag>
            </div>
            <div class="auth-item" v-if="profile.authorization.authorizedScope">
              <span class="info-label">授权范围</span>
              <span>{{ profile.authorization.authorizedScope }}</span>
            </div>
            <div class="auth-item" v-if="profile.authorization.authorizedBy">
              <span class="info-label">授权人</span>
              <span>{{ profile.authorization.authorizedBy }}</span>
            </div>
            <div class="auth-item" v-if="profile.authorization.authorizedDate">
              <span class="info-label">授权日期</span>
              <span>{{ profile.authorization.authorizedDate }}</span>
            </div>
            <div class="auth-item" v-if="profile.authorization.restrictions">
              <span class="info-label">使用限制</span>
              <span style="line-height: 1.6;">{{ profile.authorization.restrictions }}</span>
            </div>
          </div>
          <div v-else class="text-muted text-small">暂未录入授权信息，请确认使用范围</div>
        </div>
      </el-col>

      <el-col :span="16">
        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">人物年表</div>
            <el-button size="small" type="primary" :icon="Plus" @click="showChronologyDialog = true">添加事件</el-button>
          </div>
          <el-timeline v-if="profile.chronology.length">
            <el-timeline-item
              v-for="event in sortedChronology"
              :key="event.id"
              :timestamp="event.year"
              :type="chronologyType(event.type)"
              placement="top"
            >
              <div class="chronology-item">
                <div class="flex-between">
                  <div class="chronology-title">{{ event.title }}</div>
                  <div>
                    <el-button size="small" text type="danger" @click="removeChronology(event.id)">删除</el-button>
                  </div>
                </div>
                <el-tag size="small" effect="plain" style="margin-right: 8px;">{{ chronologyTypeText(event.type) }}</el-tag>
                <p class="chronology-desc text-muted text-small mt-8" v-if="event.description">{{ event.description }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div class="empty-state" v-else style="padding: 30px;">
            <el-icon :size="40" color="#c4b8a8"><Calendar /></el-icon>
            <p style="margin-top: 10px;">暂无年表记录</p>
            <el-button type="primary" size="small" style="margin-top: 12px;" @click="showChronologyDialog = true">添加第一条年表</el-button>
          </div>
        </div>

        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title" style="border: none; margin: 0; padding: 0;">关联照片与文献</div>
            <el-button size="small" type="primary" :icon="Plus" @click="showPhotoDialog = true">添加资料</el-button>
          </div>
          <el-row :gutter="12" v-if="profile.relatedPhotos.length">
            <el-col :span="8" v-for="photo in profile.relatedPhotos" :key="photo.id">
              <div class="photo-item">
                <div class="photo-thumb">
                  <img v-if="photo.filePath && photo.filePath.startsWith('blob:')" :src="photo.filePath" />
                  <el-icon v-else :size="36" color="#a67c52"><Picture /></el-icon>
                </div>
                <div class="photo-info">
                  <div class="photo-title">{{ photo.title }}</div>
                  <div class="photo-meta text-small text-muted" v-if="photo.takenAt">{{ photo.takenAt }}</div>
                  <div class="photo-desc text-small" v-if="photo.description">{{ photo.description }}</div>
                </div>
                <div class="photo-action">
                  <el-button size="small" text type="danger" @click="removePhoto(photo.id)">删除</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
          <div class="empty-state" v-else style="padding: 30px;">
            <el-icon :size="40" color="#c4b8a8"><Picture /></el-icon>
            <p style="margin-top: 10px;">暂无关联资料</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showEditDialog" title="编辑人物资料" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="别名">
          <el-select v-model="editForm.aliases" multiple filterable allow-create default-first-option placeholder="输入别名回车添加" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="editForm.birthDate" type="date" placeholder="选择日期" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="逝世日期">
          <el-date-picker v-model="editForm.deathDate" type="date" placeholder="选择日期" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="民族">
          <el-input v-model="editForm.ethnicity" />
        </el-form-item>
        <el-form-item label="籍贯">
          <el-input v-model="editForm.nativePlace" placeholder="如：浙江杭州" />
        </el-form-item>
        <el-form-item label="职业">
          <el-input v-model="editForm.occupation" />
        </el-form-item>
        <el-form-item label="技艺类别">
          <el-input v-model="editForm.artCategory" placeholder="如：木雕、越剧" />
        </el-form-item>
        <el-form-item label="代表作品">
          <el-select v-model="editForm.representativeWorks" multiple filterable allow-create default-first-option placeholder="输入作品名回车添加" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="主题标签">
          <el-select v-model="editForm.tags" multiple filterable placeholder="选择标签" style="width: 100%;">
            <el-option v-for="t in tagStore.tags" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="人物简介">
          <el-input v-model="editForm.biography" type="textarea" :rows="4" placeholder="生平、成就、传承等简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showChronologyDialog" title="添加年表事件" width="500px">
      <el-form :model="chronologyForm" label-width="90px">
        <el-form-item label="年份" required>
          <el-input v-model="chronologyForm.year" placeholder="如：1952 或 1952年春" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="chronologyForm.type" style="width: 100%;">
            <el-option label="生平经历" value="life" />
            <el-option label="艺术历程" value="art" />
            <el-option label="获奖荣誉" value="award" />
            <el-option label="代表作品" value="work" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="chronologyForm.title" placeholder="事件标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="chronologyForm.description" type="textarea" :rows="3" placeholder="详细说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChronologyDialog = false">取消</el-button>
        <el-button type="primary" @click="addChronology">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPhotoDialog" title="添加关联资料" width="500px">
      <el-form :model="photoForm" label-width="90px">
        <el-form-item label="资料标题" required>
          <el-input v-model="photoForm.title" />
        </el-form-item>
        <el-form-item label="文件">
          <el-button @click="selectPhotoFile">选择文件</el-button>
          <span class="text-small text-muted" style="margin-left: 8px;" v-if="photoForm.filePath">已选择</span>
        </el-form-item>
        <el-form-item label="拍摄日期">
          <el-date-picker v-model="photoForm.takenAt" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="photoForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhotoDialog = false">取消</el-button>
        <el-button type="primary" @click="addPhoto">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAuthDialog" title="编辑授权信息" width="500px">
      <el-form :model="authForm" label-width="100px">
        <el-form-item label="是否授权">
          <el-switch v-model="authForm.hasAuthorization" />
        </el-form-item>
        <template v-if="authForm.hasAuthorization">
          <el-form-item label="授权类型">
            <el-select v-model="authForm.authorizationType" style="width: 100%;">
              <el-option label="完全授权" value="full" />
              <el-option label="部分授权" value="partial" />
              <el-option label="仅供研究" value="research_only" />
            </el-select>
          </el-form-item>
          <el-form-item label="授权范围">
            <el-input v-model="authForm.authorizedScope" placeholder="如：可用于非商业展览、研究出版" />
          </el-form-item>
          <el-form-item label="授权人">
            <el-input v-model="authForm.authorizedBy" />
          </el-form-item>
          <el-form-item label="授权日期">
            <el-date-picker v-model="authForm.authorizedDate" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="使用限制">
            <el-input v-model="authForm.restrictions" type="textarea" :rows="2" placeholder="禁止使用的场景或其他限制" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showAuthDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAuth">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Edit, Download, UserFilled, CircleCheck, Warning, Plus, Calendar, Picture
} from '@element-plus/icons-vue'
import { useProfileStore, useTagStore } from '@/stores/profile'
import type { PersonProfile, ChronologyEvent } from '@/types'

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const tagStore = useTagStore()

const profileId = computed(() => route.params.id as string)
const profile = computed(() => profileStore.currentProfile)

const showEditDialog = ref(false)
const showChronologyDialog = ref(false)
const showPhotoDialog = ref(false)
const showAuthDialog = ref(false)

const editForm = reactive<Partial<PersonProfile>>({
  name: '', aliases: [], gender: '男', birthDate: '', deathDate: '',
  ethnicity: '', nativePlace: '', occupation: '', artCategory: '',
  representativeWorks: [], biography: '', tags: []
})

const chronologyForm = reactive({
  year: '', type: 'life' as ChronologyEvent['type'], title: '', description: ''
})

const photoForm = reactive({
  title: '', filePath: '', takenAt: '', description: ''
})

const authForm = reactive<PersonProfile['authorization']>({
  hasAuthorization: false,
  authorizationType: undefined,
  authorizedScope: '',
  authorizedBy: '',
  authorizedDate: '',
  restrictions: ''
})

const sortedChronology = computed(() =>
  [...(profile.value?.chronology || [])].sort((a, b) => a.year.localeCompare(b.year))
)

onMounted(() => {
  profileStore.loadById(profileId.value)
  tagStore.loadAll()
})

watch(profile, (p) => {
  if (p) {
    Object.assign(editForm, {
      name: p.name, aliases: [...(p.aliases || [])], gender: p.gender,
      birthDate: p.birthDate || '', deathDate: p.deathDate || '',
      ethnicity: p.ethnicity || '', nativePlace: p.nativePlace || '',
      occupation: p.occupation || '', artCategory: p.artCategory || '',
      representativeWorks: [...(p.representativeWorks || [])],
      biography: p.biography || '', tags: [...(p.tags || [])]
    })
    Object.assign(authForm, { ...p.authorization })
  }
}, { immediate: true, deep: true })

function chronologyType(type: string) {
  const map: Record<string, string> = { life: 'primary', art: 'success', award: 'warning', work: '', other: 'info' }
  return map[type] || ''
}

function chronologyTypeText(type: string) {
  const map: Record<string, string> = { life: '生平', art: '艺术', award: '获奖', work: '作品', other: '其他' }
  return map[type] || type
}

function authTypeText(type?: string) {
  const map: Record<string, string> = { full: '完全授权', partial: '部分授权', research_only: '仅供研究' }
  return map[type || ''] || '未指定'
}

function authTypeTag(type?: string) {
  const map: Record<string, string> = { full: 'success', partial: 'warning', research_only: 'info' }
  return map[type || ''] || ''
}

function saveProfile() {
  if (!editForm.name?.trim()) { ElMessage.warning('请输入姓名'); return }
  profileStore.update(profileId.value, { ...editForm } as any)
  ElMessage.success('保存成功')
  showEditDialog.value = false
}

function addChronology() {
  if (!chronologyForm.year.trim() || !chronologyForm.title.trim()) {
    ElMessage.warning('请填写年份和标题')
    return
  }
  profileStore.addChronologyEvent(profileId.value, { ...chronologyForm })
  ElMessage.success('已添加')
  showChronologyDialog.value = false
  Object.assign(chronologyForm, { year: '', type: 'life', title: '', description: '' })
}

function removeChronology(id: string) {
  profileStore.removeChronologyEvent(profileId.value, id)
  ElMessage.success('已删除')
}

async function selectPhotoFile() {
  try {
    const paths = await window.electronAPI.selectFiles([
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: '文档', extensions: ['pdf', 'doc', 'docx', 'txt'] }
    ])
    if (paths?.length) {
      photoForm.filePath = paths[0]
      if (!photoForm.title) {
        photoForm.title = paths[0].split(/[\\/]/).pop() || '未命名'
      }
    }
  } catch {
    ElMessage.info('当前环境不支持文件选择')
  }
}

function addPhoto() {
  if (!photoForm.title.trim()) { ElMessage.warning('请输入标题'); return }
  profileStore.addRelatedPhoto(profileId.value, { ...photoForm })
  ElMessage.success('已添加')
  showPhotoDialog.value = false
  Object.assign(photoForm, { title: '', filePath: '', takenAt: '', description: '' })
}

function removePhoto(id: string) {
  profileStore.removeRelatedPhoto(profileId.value, id)
  ElMessage.success('已删除')
}

function saveAuth() {
  profileStore.update(profileId.value, { authorization: { ...authForm } })
  ElMessage.success('授权信息已保存')
  showAuthDialog.value = false
}

function goToExport() { router.push('/export') }
</script>

<style scoped>
.profile-detail { min-height: 100%; }

.profile-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.big-avatar {
  background: linear-gradient(135deg, #a67c52, #8b5a2b);
  font-size: 32px;
  font-weight: 600;
}

.profile-header-info { flex: 1; }

.profile-name-lg {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.profile-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
}

.info-item > span:last-child {
  font-size: 14px;
  color: var(--text-primary);
}

.works-list { display: flex; flex-wrap: wrap; }

.auth-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.auth-item .info-label {
  width: 70px;
  flex-shrink: 0;
  padding-top: 2px;
}

.chronology-item {
  padding: 8px 0;
}

.chronology-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.chronology-desc {
  line-height: 1.6;
}

.photo-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #faf8f5;
  border-radius: 8px;
  margin-bottom: 12px;
}

.photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-info { flex: 1; min-width: 0; }

.photo-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.photo-desc {
  color: var(--text-secondary);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-action { flex-shrink: 0; }
</style>
