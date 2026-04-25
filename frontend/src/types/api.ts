export interface InferenceResponse {
  image_id: string
  image_url: string
  is_defect: boolean
  anomaly_score: number
  detections: Record<string, unknown>[]
  latency_ms: number
}

export interface ResultRecord {
  id: string
  image_id: string
  image_url: string
  category: string
  is_defect: boolean
  anomaly_score: number
  latency_ms: number
  created_at: string
}

export interface PaginatedResults {
  data: ResultRecord[]
  total: number
  page: number
  page_size: number
}

export interface StatsResponse {
  total: number
  defect_rate: number
  avg_latency_ms: number
}
