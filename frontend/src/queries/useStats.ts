import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { StatsResponse } from "../types/api"

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => axios.get<StatsResponse>("/api/v1/stats").then((r) => r.data),
    staleTime: 30_000,
  })
}
