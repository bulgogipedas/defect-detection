import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { CategoriesResponse } from "../types/api"

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => axios.get<CategoriesResponse>("/api/v1/categories").then((r) => r.data),
    staleTime: 60_000,
  })
}
