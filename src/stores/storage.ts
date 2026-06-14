import type {
  InterviewPlan,
  Interviewee,
  MediaAsset,
  TranscriptSegment,
  TimestampMarker,
  PersonProfile,
  TopicTag
} from '@/types'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEYS = {
  INTERVIEW_PLANS: 'ohs_interview_plans',
  INTERVIEWEES: 'ohs_interviewees',
  MEDIA_ASSETS: 'ohs_media_assets',
  TRANSCRIPTS: 'ohs_transcripts',
  MARKERS: 'ohs_markers',
  PROFILES: 'ohs_profiles',
  TAGS: 'ohs_tags'
}

function readFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function writeToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function generateId(): string {
  return uuidv4()
}

export function now(): string {
  return new Date().toISOString()
}

export const interviewPlanStore = {
  getAll(): InterviewPlan[] {
    return readFromStorage<InterviewPlan>(STORAGE_KEYS.INTERVIEW_PLANS)
  },
  getById(id: string): InterviewPlan | undefined {
    return this.getAll().find(p => p.id === id)
  },
  create(plan: Omit<InterviewPlan, 'id' | 'createdAt' | 'updatedAt'>): InterviewPlan {
    const plans = this.getAll()
    const newPlan: InterviewPlan = {
      ...plan,
      id: generateId(),
      createdAt: now(),
      updatedAt: now()
    }
    plans.push(newPlan)
    writeToStorage(STORAGE_KEYS.INTERVIEW_PLANS, plans)
    return newPlan
  },
  update(id: string, updates: Partial<InterviewPlan>): InterviewPlan | undefined {
    const plans = this.getAll()
    const index = plans.findIndex(p => p.id === id)
    if (index === -1) return undefined
    plans[index] = { ...plans[index], ...updates, updatedAt: now() }
    writeToStorage(STORAGE_KEYS.INTERVIEW_PLANS, plans)
    return plans[index]
  },
  delete(id: string): boolean {
    const plans = this.getAll().filter(p => p.id !== id)
    writeToStorage(STORAGE_KEYS.INTERVIEW_PLANS, plans)
    return true
  }
}

export const intervieweeStore = {
  getAll(): Interviewee[] {
    return readFromStorage<Interviewee>(STORAGE_KEYS.INTERVIEWEES)
  },
  getById(id: string): Interviewee | undefined {
    return this.getAll().find(p => p.id === id)
  },
  create(interviewee: Omit<Interviewee, 'id' | 'createdAt' | 'updatedAt'>): Interviewee {
    const items = this.getAll()
    const newItem: Interviewee = {
      ...interviewee,
      id: generateId(),
      createdAt: now(),
      updatedAt: now()
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.INTERVIEWEES, items)
    return newItem
  },
  update(id: string, updates: Partial<Interviewee>): Interviewee | undefined {
    const items = this.getAll()
    const index = items.findIndex(p => p.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates, updatedAt: now() }
    writeToStorage(STORAGE_KEYS.INTERVIEWEES, items)
    return items[index]
  },
  delete(id: string): boolean {
    const items = this.getAll().filter(p => p.id !== id)
    writeToStorage(STORAGE_KEYS.INTERVIEWEES, items)
    return true
  }
}

export const mediaAssetStore = {
  getAll(): MediaAsset[] {
    return readFromStorage<MediaAsset>(STORAGE_KEYS.MEDIA_ASSETS)
  },
  getById(id: string): MediaAsset | undefined {
    return this.getAll().find(a => a.id === id)
  },
  getByType(type: MediaAsset['type']): MediaAsset[] {
    return this.getAll().filter(a => a.type === type)
  },
  create(asset: Omit<MediaAsset, 'id' | 'importedAt'>): MediaAsset {
    const items = this.getAll()
    const newItem: MediaAsset = {
      ...asset,
      id: generateId(),
      importedAt: now()
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.MEDIA_ASSETS, items)
    return newItem
  },
  update(id: string, updates: Partial<MediaAsset>): MediaAsset | undefined {
    const items = this.getAll()
    const index = items.findIndex(a => a.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates }
    writeToStorage(STORAGE_KEYS.MEDIA_ASSETS, items)
    return items[index]
  },
  delete(id: string): boolean {
    const items = this.getAll().filter(a => a.id !== id)
    writeToStorage(STORAGE_KEYS.MEDIA_ASSETS, items)
    return true
  }
}

export const transcriptStore = {
  getByMediaAsset(mediaAssetId: string): TranscriptSegment[] {
    const all = readFromStorage<TranscriptSegment>(STORAGE_KEYS.TRANSCRIPTS)
    return all.filter(t => t.mediaAssetId === mediaAssetId).sort((a, b) => a.startTime - b.startTime)
  },
  create(segment: Omit<TranscriptSegment, 'id'>): TranscriptSegment {
    const items = readFromStorage<TranscriptSegment>(STORAGE_KEYS.TRANSCRIPTS)
    const newItem: TranscriptSegment = {
      ...segment,
      id: generateId()
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.TRANSCRIPTS, items)
    return newItem
  },
  update(id: string, updates: Partial<TranscriptSegment>): TranscriptSegment | undefined {
    const items = readFromStorage<TranscriptSegment>(STORAGE_KEYS.TRANSCRIPTS)
    const index = items.findIndex(t => t.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates }
    writeToStorage(STORAGE_KEYS.TRANSCRIPTS, items)
    return items[index]
  },
  delete(id: string): boolean {
    const items = readFromStorage<TranscriptSegment>(STORAGE_KEYS.TRANSCRIPTS).filter(t => t.id !== id)
    writeToStorage(STORAGE_KEYS.TRANSCRIPTS, items)
    return true
  },
  bulkCreate(segments: Array<Omit<TranscriptSegment, 'id'>>): TranscriptSegment[] {
    const items = readFromStorage<TranscriptSegment>(STORAGE_KEYS.TRANSCRIPTS)
    const newItems = segments.map(s => ({ ...s, id: generateId() }))
    items.push(...newItems)
    writeToStorage(STORAGE_KEYS.TRANSCRIPTS, items)
    return newItems
  }
}

export const markerStore = {
  getByMediaAsset(mediaAssetId: string): TimestampMarker[] {
    const all = readFromStorage<TimestampMarker>(STORAGE_KEYS.MARKERS)
    return all.filter(m => m.mediaAssetId === mediaAssetId).sort((a, b) => a.time - b.time)
  },
  create(marker: Omit<TimestampMarker, 'id'>): TimestampMarker {
    const items = readFromStorage<TimestampMarker>(STORAGE_KEYS.MARKERS)
    const newItem: TimestampMarker = {
      ...marker,
      id: generateId()
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.MARKERS, items)
    return newItem
  },
  update(id: string, updates: Partial<TimestampMarker>): TimestampMarker | undefined {
    const items = readFromStorage<TimestampMarker>(STORAGE_KEYS.MARKERS)
    const index = items.findIndex(m => m.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates }
    writeToStorage(STORAGE_KEYS.MARKERS, items)
    return items[index]
  },
  delete(id: string): boolean {
    const items = readFromStorage<TimestampMarker>(STORAGE_KEYS.MARKERS).filter(m => m.id !== id)
    writeToStorage(STORAGE_KEYS.MARKERS, items)
    return true
  }
}

export const profileStore = {
  getAll(): PersonProfile[] {
    return readFromStorage<PersonProfile>(STORAGE_KEYS.PROFILES)
  },
  getById(id: string): PersonProfile | undefined {
    return this.getAll().find(p => p.id === id)
  },
  getByIntervieweeId(intervieweeId: string): PersonProfile | undefined {
    return this.getAll().find(p => p.intervieweeId === intervieweeId)
  },
  create(profile: Omit<PersonProfile, 'id' | 'createdAt' | 'updatedAt'>): PersonProfile {
    const items = this.getAll()
    const newItem: PersonProfile = {
      ...profile,
      id: generateId(),
      createdAt: now(),
      updatedAt: now()
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.PROFILES, items)
    return newItem
  },
  update(id: string, updates: Partial<PersonProfile>): PersonProfile | undefined {
    const items = this.getAll()
    const index = items.findIndex(p => p.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates, updatedAt: now() }
    writeToStorage(STORAGE_KEYS.PROFILES, items)
    return items[index]
  },
  delete(id: string): boolean {
    const items = this.getAll().filter(p => p.id !== id)
    writeToStorage(STORAGE_KEYS.PROFILES, items)
    return true
  }
}

export const tagStore = {
  getAll(): TopicTag[] {
    const tags = readFromStorage<TopicTag>(STORAGE_KEYS.TAGS)
    if (tags.length === 0) {
      const defaultTags: TopicTag[] = [
        { id: generateId(), name: '传统技艺', color: '#e67e22', category: 'art', description: '', usageCount: 0 },
        { id: generateId(), name: '民间音乐', color: '#27ae60', category: 'art', description: '', usageCount: 0 },
        { id: generateId(), name: '民俗活动', color: '#2980b9', category: 'theme', description: '', usageCount: 0 },
        { id: generateId(), name: '口述历史', color: '#8e44ad', category: 'theme', description: '', usageCount: 0 },
        { id: generateId(), name: '非物质文化遗产', color: '#c0392b', category: 'theme', description: '', usageCount: 0 }
      ]
      writeToStorage(STORAGE_KEYS.TAGS, defaultTags)
      return defaultTags
    }
    return tags
  },
  getById(id: string): TopicTag | undefined {
    return this.getAll().find(t => t.id === id)
  },
  create(tag: Omit<TopicTag, 'id' | 'usageCount'>): TopicTag {
    const items = this.getAll()
    const newItem: TopicTag = {
      ...tag,
      id: generateId(),
      usageCount: 0
    }
    items.push(newItem)
    writeToStorage(STORAGE_KEYS.TAGS, items)
    return newItem
  },
  update(id: string, updates: Partial<TopicTag>): TopicTag | undefined {
    const items = this.getAll()
    const index = items.findIndex(t => t.id === id)
    if (index === -1) return undefined
    items[index] = { ...items[index], ...updates }
    writeToStorage(STORAGE_KEYS.TAGS, items)
    return items[index]
  },
  incrementUsage(id: string): void {
    const tag = this.getById(id)
    if (tag) {
      this.update(id, { usageCount: tag.usageCount + 1 })
    }
  },
  delete(id: string): boolean {
    const items = this.getAll().filter(t => t.id !== id)
    writeToStorage(STORAGE_KEYS.TAGS, items)
    return true
  }
}
