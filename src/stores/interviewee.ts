import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Interviewee } from '@/types'
import { intervieweeStore } from './storage'

export const useIntervieweeStore = defineStore('interviewee', () => {
  const interviewees = ref<Interviewee[]>([])
  const currentInterviewee = ref<Interviewee | null>(null)

  function loadAll() {
    interviewees.value = intervieweeStore.getAll()
  }

  function loadById(id: string) {
    currentInterviewee.value = intervieweeStore.getById(id) || null
  }

  function create(data: Omit<Interviewee, 'id' | 'createdAt' | 'updatedAt'>) {
    const item = intervieweeStore.create(data)
    interviewees.value.push(item)
    return item
  }

  function update(id: string, updates: Partial<Interviewee>) {
    const updated = intervieweeStore.update(id, updates)
    if (updated) {
      const index = interviewees.value.findIndex(p => p.id === id)
      if (index !== -1) interviewees.value[index] = updated
      if (currentInterviewee.value?.id === id) currentInterviewee.value = updated
    }
    return updated
  }

  function remove(id: string) {
    intervieweeStore.delete(id)
    interviewees.value = interviewees.value.filter(p => p.id !== id)
    if (currentInterviewee.value?.id === id) currentInterviewee.value = null
  }

  return {
    interviewees,
    currentInterviewee,
    loadAll,
    loadById,
    create,
    update,
    remove
  }
})
