import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InterviewPlan, InterviewQuestion } from '@/types'
import { interviewPlanStore, generateId } from './storage'

export const useInterviewPlanStore = defineStore('interviewPlan', () => {
  const plans = ref<InterviewPlan[]>([])
  const currentPlan = ref<InterviewPlan | null>(null)

  function loadPlans() {
    plans.value = interviewPlanStore.getAll()
  }

  function loadPlanById(id: string) {
    currentPlan.value = interviewPlanStore.getById(id) || null
  }

  function createPlan(data: {
    title: string
    intervieweeId?: string
    intervieweeName?: string
    scheduledDate?: string
    scheduledTime?: string
    location?: string
    interviewer?: string
    description?: string
  }) {
    const plan = interviewPlanStore.create({
      ...data,
      questions: [],
      status: 'draft',
      tags: [],
      needsFollowUp: false
    })
    plans.value.push(plan)
    return plan
  }

  function updatePlan(id: string, updates: Partial<InterviewPlan>) {
    const updated = interviewPlanStore.update(id, updates)
    if (updated) {
      const index = plans.value.findIndex(p => p.id === id)
      if (index !== -1) {
        plans.value[index] = updated
      }
      if (currentPlan.value?.id === id) {
        currentPlan.value = updated
      }
    }
    return updated
  }

  function deletePlan(id: string) {
    interviewPlanStore.delete(id)
    plans.value = plans.value.filter(p => p.id !== id)
    if (currentPlan.value?.id === id) {
      currentPlan.value = null
    }
  }

  function addQuestion(planId: string, content: string, category?: string) {
    const plan = interviewPlanStore.getById(planId)
    if (!plan) return null
    const question: InterviewQuestion = {
      id: generateId(),
      content,
      category,
      order: plan.questions.length
    }
    const updated = interviewPlanStore.update(planId, {
      questions: [...plan.questions, question]
    })
    if (updated) {
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) plans.value[index] = updated
      if (currentPlan.value?.id === planId) currentPlan.value = updated
    }
    return question
  }

  function updateQuestion(planId: string, questionId: string, updates: Partial<InterviewQuestion>) {
    const plan = interviewPlanStore.getById(planId)
    if (!plan) return null
    const questions = plan.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    )
    const updated = interviewPlanStore.update(planId, { questions })
    if (updated) {
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) plans.value[index] = updated
      if (currentPlan.value?.id === planId) currentPlan.value = updated
    }
    return updated
  }

  function removeQuestion(planId: string, questionId: string) {
    const plan = interviewPlanStore.getById(planId)
    if (!plan) return
    const questions = plan.questions.filter(q => q.id !== questionId)
    const updated = interviewPlanStore.update(planId, { questions })
    if (updated) {
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) plans.value[index] = updated
      if (currentPlan.value?.id === planId) currentPlan.value = updated
    }
  }

  const draftPlans = computed(() => plans.value.filter(p => p.status === 'draft'))
  const scheduledPlans = computed(() => plans.value.filter(p => p.status === 'scheduled'))
  const completedPlans = computed(() => plans.value.filter(p => p.status === 'completed'))
  const followUpPlans = computed(() => plans.value.filter(p => p.needsFollowUp))

  return {
    plans,
    currentPlan,
    loadPlans,
    loadPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    addQuestion,
    updateQuestion,
    removeQuestion,
    draftPlans,
    scheduledPlans,
    completedPlans,
    followUpPlans
  }
})
