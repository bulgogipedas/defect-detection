import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { InferenceResponse } from "../types/api"

export function useInference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) =>
      axios.post<InferenceResponse>("/api/v1/infer", form).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["results"] })
      void qc.invalidateQueries({ queryKey: ["stats"] })
      void qc.invalidateQueries({ queryKey: ["telemetry"] })
    },
  })
}
