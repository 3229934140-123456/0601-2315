export interface Interviewee {
  id: string
  name: string
  gender: '男' | '女'
  birthDate?: string
  ethnicity?: string
  nativePlace?: string
  occupation?: string
  artCategory?: string
  contact?: string
  address?: string
  biography?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface InterviewQuestion {
  id: string
  content: string
  category?: string
  order: number
}

export interface InterviewPlan {
  id: string
  title: string
  intervieweeId?: string
  intervieweeName?: string
  scheduledDate?: string
  scheduledTime?: string
  location?: string
  interviewer?: string
  description?: string
  questions: InterviewQuestion[]
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled'
  tags: string[]
  needsFollowUp: boolean
  followUpNotes?: string
  createdAt: string
  updatedAt: string
}

export interface MediaAsset {
  id: string
  type: 'audio' | 'video' | 'image' | 'document'
  title: string
  filePath: string
  persistentPath?: string
  fileName: string
  fileSize: number
  duration?: number
  format?: string
  interviewPlanId?: string
  intervieweeId?: string
  intervieweeName?: string
  recordedAt?: string
  importedAt: string
  description?: string
  tags: string[]
}

export interface TimestampMarker {
  id: string
  mediaAssetId: string
  time: number
  label: string
  description?: string
  type: 'chapter' | 'topic' | 'dialect' | 'skill' | 'important'
}

export interface TranscriptSegment {
  id: string
  mediaAssetId: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
  annotations: Annotation[]
  isEdited: boolean
  needsReview: boolean
}

export interface Annotation {
  id: string
  type: 'dialect' | 'skill' | 'person' | 'place' | 'event'
  startIndex: number
  endIndex: number
  term: string
  explanation?: string
}

export interface PersonProfile {
  id: string
  intervieweeId?: string
  name: string
  gender?: '男' | '女'
  aliases?: string[]
  birthDate?: string
  deathDate?: string
  ethnicity?: string
  nativePlace?: string
  occupation?: string
  artCategory?: string
  representativeWorks?: string[]
  biography?: string
  chronology: ChronologyEvent[]
  relatedPhotos: RelatedPhoto[]
  authorization: AuthorizationInfo
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ChronologyEvent {
  id: string
  year: string
  title: string
  description?: string
  type: 'life' | 'art' | 'award' | 'work' | 'other'
  relatedMediaIds?: string[]
}

export interface RelatedPhoto {
  id: string
  title: string
  filePath: string
  description?: string
  takenAt?: string
}

export interface AuthorizationInfo {
  hasAuthorization: boolean
  authorizationType?: 'full' | 'partial' | 'research_only'
  authorizedScope?: string
  authorizedBy?: string
  authorizedDate?: string
  restrictions?: string
  documentPath?: string
}

export interface TopicTag {
  id: string
  name: string
  color: string
  category: 'theme' | 'art' | 'region' | 'era' | 'other'
  description?: string
  usageCount: number
}

export interface SearchResult {
  type: 'segment' | 'asset' | 'person' | 'plan'
  id: string
  title: string
  snippet?: string
  matchedTags?: string[]
  timestamp?: number
  mediaAssetId?: string
}

export interface ExportConfig {
  format: 'srt' | 'vtt' | 'txt' | 'docx' | 'markdown'
  includeTimestamps: boolean
  includeAnnotations: boolean
  includeTags: boolean
  generateSummary: boolean
}
