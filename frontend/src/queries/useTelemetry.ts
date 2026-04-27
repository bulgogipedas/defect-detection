import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { TelemetryResponse } from "../types/api"

export function useTelemetry() {
  return useQuery({
    queryKey: ["telemetry"],
    queryFn: () => axios.get<TelemetryResponse>("/api/v1/telemetry").then((r) => r.data),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}
