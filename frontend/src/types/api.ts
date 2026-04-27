export interface InferenceResponse {
  image_id: string
  image_url: string
  category: string
  is_defect: boolean
  anomaly_score: number
  detections: Record<string, unknown>[]
  latency_ms: number
  model_mode: string
  model_version: string
}

export interface ResultRecord {
  id: string
  image_id: string
  image_url: string
  category: string
  is_defect: boolean
  anomaly_score: number
  latency_ms: number
  model_mode: string
  model_version: string
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

export interface TelemetryResponse {
  total: number
  defect_rate: number
  avg_latency_ms: number
  p50_latency_ms: number
  p95_latency_ms: number
  demo_inference_count: number
  production_inference_count: number
}

export interface CategoriesResponse {
  categories: string[]
}
