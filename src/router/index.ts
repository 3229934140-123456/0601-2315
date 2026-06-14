import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/interview-plans',
    name: 'InterviewPlans',
    component: () => import('@/views/InterviewPlans.vue'),
    meta: { title: '采访计划' }
  },
  {
    path: '/interview-plans/:id',
    name: 'InterviewPlanDetail',
    component: () => import('@/views/InterviewPlanDetail.vue'),
    meta: { title: '采访计划详情' }
  },
  {
    path: '/recorder',
    name: 'Recorder',
    component: () => import('@/views/Recorder.vue'),
    meta: { title: '录音录像' }
  },
  {
    path: '/import',
    name: 'Import',
    component: () => import('@/views/MediaImport.vue'),
    meta: { title: '素材导入' }
  },
  {
    path: '/transcript/:id',
    name: 'Transcript',
    component: () => import('@/views/Transcript.vue'),
    meta: { title: '文字转写校对' }
  },
  {
    path: '/profiles',
    name: 'Profiles',
    component: () => import('@/views/Profiles.vue'),
    meta: { title: '人物档案' }
  },
  {
    path: '/profiles/:id',
    name: 'ProfileDetail',
    component: () => import('@/views/ProfileDetail.vue'),
    meta: { title: '人物档案详情' }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/Tags.vue'),
    meta: { title: '主题标签' }
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('@/views/Export.vue'),
    meta: { title: '成果导出' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
