import { useQuery, keepPreviousData } from "@tanstack/react-query"
import axios from "axios"
import type { PaginatedResults } from "../types/api"

export function useResults(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["results", page, pageSize],
    queryFn: () =>
      axios
        .get<PaginatedResults>("/api/v1/results", {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}
