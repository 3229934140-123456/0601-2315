import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PersonProfile, TopicTag } from '@/types'
import { profileStore, tagStore, generateId } from './storage'

export const useProfileStore = defineStore('profile', () => {
  const profiles = ref<PersonProfile[]>([])
  const currentProfile = ref<PersonProfile | null>(null)

  function loadAll() {
    profiles.value = profileStore.getAll()
  }

  function loadById(id: string) {
    currentProfile.value = profileStore.getById(id) || null
  }

  function loadByIntervieweeId(intervieweeId: string) {
    currentProfile.value = profileStore.getByIntervieweeId(intervieweeId) || null
  }

  function create(data: Omit<PersonProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const profile = profileStore.create(data)
    profiles.value.push(profile)
    return profile
  }

  function update(id: string, updates: Partial<PersonProfile>) {
    const updated = profileStore.update(id, updates)
    if (updated) {
      const index = profiles.value.findIndex(p => p.id === id)
      if (index !== -1) profiles.value[index] = updated
      if (currentProfile.value?.id === id) currentProfile.value = updated
    }
    return updated
  }

  function remove(id: string) {
    profileStore.delete(id)
    profiles.value = profiles.value.filter(p => p.id !== id)
    if (currentProfile.value?.id === id) currentProfile.value = null
  }

  function addChronologyEvent(profileId: string, event: Omit<PersonProfile['chronology'][0], 'id'>) {
    const profile = profileStore.getById(profileId)
    if (!profile) return null
    const newEvent = { ...event, id: generateId() }
    const chronology = [...profile.chronology, newEvent].sort((a, b) => a.year.localeCompare(b.year))
    const updated = profileStore.update(profileId, { chronology })
    if (updated) {
      const index = profiles.value.findIndex(p => p.id === profileId)
      if (index !== -1) profiles.value[index] = updated
      if (currentProfile.value?.id === profileId) currentProfile.value = updated
    }
    return newEvent
  }

  function removeChronologyEvent(profileId: string, eventId: string) {
    const profile = profileStore.getById(profileId)
    if (!profile) return
    const chronology = profile.chronology.filter(e => e.id !== eventId)
    const updated = profileStore.update(profileId, { chronology })
    if (updated) {
      const index = profiles.value.findIndex(p => p.id === profileId)
      if (index !== -1) profiles.value[index] = updated
      if (currentProfile.value?.id === profileId) currentProfile.value = updated
    }
  }

  function addRelatedPhoto(profileId: string, photo: Omit<PersonProfile['relatedPhotos'][0], 'id'>) {
    const profile = profileStore.getById(profileId)
    if (!profile) return null
    const newPhoto = { ...photo, id: generateId() }
    const relatedPhotos = [...profile.relatedPhotos, newPhoto]
    const updated = profileStore.update(profileId, { relatedPhotos })
    if (updated) {
      const index = profiles.value.findIndex(p => p.id === profileId)
      if (index !== -1) profiles.value[index] = updated
      if (currentProfile.value?.id === profileId) currentProfile.value = updated
    }
    return newPhoto
  }

  function removeRelatedPhoto(profileId: string, photoId: string) {
    const profile = profileStore.getById(profileId)
    if (!profile) return
    const relatedPhotos = profile.relatedPhotos.filter(p => p.id !== photoId)
    const updated = profileStore.update(profileId, { relatedPhotos })
    if (updated) {
      const index = profiles.value.findIndex(p => p.id === profileId)
      if (index !== -1) profiles.value[index] = updated
      if (currentProfile.value?.id === profileId) currentProfile.value = updated
    }
  }

  return {
    profiles,
    currentProfile,
    loadAll,
    loadById,
    loadByIntervieweeId,
    create,
    update,
    remove,
    addChronologyEvent,
    removeChronologyEvent,
    addRelatedPhoto,
    removeRelatedPhoto
  }
})

export const useTagStore = defineStore('tag', () => {
  const tags = ref<TopicTag[]>([])

  function loadAll() {
    tags.value = tagStore.getAll()
  }

  function create(data: Omit<TopicTag, 'id' | 'usageCount'>) {
    const tag = tagStore.create(data)
    tags.value.push(tag)
    return tag
  }

  function update(id: string, updates: Partial<TopicTag>) {
    const updated = tagStore.update(id, updates)
    if (updated) {
      const index = tags.value.findIndex(t => t.id === id)
      if (index !== -1) tags.value[index] = updated
    }
    return updated
  }

  function remove(id: string) {
    tagStore.delete(id)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  function incrementUsage(id: string) {
    tagStore.incrementUsage(id)
    const tag = tags.value.find(t => t.id === id)
    if (tag) tag.usageCount++
  }

  return {
    tags,
    loadAll,
    create,
    update,
    remove,
    incrementUsage
  }
})
