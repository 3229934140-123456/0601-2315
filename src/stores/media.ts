import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MediaAsset, TranscriptSegment, TimestampMarker, Annotation } from '@/types'
import { mediaAssetStore, transcriptStore, markerStore, generateId } from './storage'

export const useMediaStore = defineStore('media', () => {
  const assets = ref<MediaAsset[]>([])
  const currentAsset = ref<MediaAsset | null>(null)
  const transcripts = ref<TranscriptSegment[]>([])
  const markers = ref<TimestampMarker[]>([])

  function loadAll() {
    assets.value = mediaAssetStore.getAll()
  }

  function loadAsset(id: string) {
    currentAsset.value = mediaAssetStore.getById(id) || null
    if (currentAsset.value) {
      transcripts.value = transcriptStore.getByMediaAsset(id)
      markers.value = markerStore.getByMediaAsset(id)
    }
  }

  function addAsset(data: Omit<MediaAsset, 'id' | 'importedAt'>) {
    const asset = mediaAssetStore.create(data)
    assets.value.push(asset)
    return asset
  }

  function updateAsset(id: string, updates: Partial<MediaAsset>) {
    const updated = mediaAssetStore.update(id, updates)
    if (updated) {
      const index = assets.value.findIndex(a => a.id === id)
      if (index !== -1) assets.value[index] = updated
      if (currentAsset.value?.id === id) currentAsset.value = updated
    }
    return updated
  }

  function removeAsset(id: string) {
    mediaAssetStore.delete(id)
    assets.value = assets.value.filter(a => a.id !== id)
    if (currentAsset.value?.id === id) {
      currentAsset.value = null
      transcripts.value = []
      markers.value = []
    }
  }

  function addTranscriptSegment(segment: Omit<TranscriptSegment, 'id'>) {
    const s = transcriptStore.create(segment)
    transcripts.value.push(s)
    transcripts.value.sort((a, b) => a.startTime - b.startTime)
    return s
  }

  function updateTranscriptSegment(id: string, updates: Partial<TranscriptSegment>) {
    const updated = transcriptStore.update(id, updates)
    if (updated) {
      const index = transcripts.value.findIndex(t => t.id === id)
      if (index !== -1) transcripts.value[index] = updated
    }
    return updated
  }

  function removeTranscriptSegment(id: string) {
    transcriptStore.delete(id)
    transcripts.value = transcripts.value.filter(t => t.id !== id)
  }

  function bulkAddTranscripts(segments: Array<Omit<TranscriptSegment, 'id'>>) {
    const newSegments = transcriptStore.bulkCreate(segments)
    transcripts.value.push(...newSegments)
    transcripts.value.sort((a, b) => a.startTime - b.startTime)
    return newSegments
  }

  function addMarker(marker: Omit<TimestampMarker, 'id'>) {
    const m = markerStore.create(marker)
    markers.value.push(m)
    markers.value.sort((a, b) => a.time - b.time)
    return m
  }

  function updateMarker(id: string, updates: Partial<TimestampMarker>) {
    const updated = markerStore.update(id, updates)
    if (updated) {
      const index = markers.value.findIndex(m => m.id === id)
      if (index !== -1) markers.value[index] = updated
    }
    return updated
  }

  function removeMarker(id: string) {
    markerStore.delete(id)
    markers.value = markers.value.filter(m => m.id !== id)
  }

  function addAnnotation(segmentId: string, annotation: Omit<Annotation, 'id'>) {
    const segment = transcripts.value.find(t => t.id === segmentId)
    if (!segment) return null
    const newAnnotation: Annotation = {
      ...annotation,
      id: generateId()
    }
    const updated = transcriptStore.update(segmentId, {
      annotations: [...segment.annotations, newAnnotation]
    })
    if (updated) {
      const index = transcripts.value.findIndex(t => t.id === segmentId)
      if (index !== -1) transcripts.value[index] = updated
    }
    return newAnnotation
  }

  function removeAnnotation(segmentId: string, annotationId: string) {
    const segment = transcripts.value.find(t => t.id === segmentId)
    if (!segment) return
    const annotations = segment.annotations.filter(a => a.id !== annotationId)
    const updated = transcriptStore.update(segmentId, { annotations })
    if (updated) {
      const index = transcripts.value.findIndex(t => t.id === segmentId)
      if (index !== -1) transcripts.value[index] = updated
    }
  }

  const audioAssets = computed(() => assets.value.filter(a => a.type === 'audio'))
  const videoAssets = computed(() => assets.value.filter(a => a.type === 'video'))
  const imageAssets = computed(() => assets.value.filter(a => a.type === 'image'))
  const documentAssets = computed(() => assets.value.filter(a => a.type === 'document'))

  return {
    assets,
    currentAsset,
    transcripts,
    markers,
    loadAll,
    loadAsset,
    addAsset,
    updateAsset,
    removeAsset,
    addTranscriptSegment,
    updateTranscriptSegment,
    removeTranscriptSegment,
    bulkAddTranscripts,
    addMarker,
    updateMarker,
    removeMarker,
    addAnnotation,
    removeAnnotation,
    audioAssets,
    videoAssets,
    imageAssets,
    documentAssets
  }
})
