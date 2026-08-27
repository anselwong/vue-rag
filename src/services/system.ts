import type { HealthResponse } from '../types/api'
import { get } from './http'

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return get<HealthResponse>('/health', signal)
}

