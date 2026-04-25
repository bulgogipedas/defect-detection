import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { useInference } from "../queries/useInference"

export const Route = createFileRoute("/inspect")({
  component: InferencePage,
})

function InferencePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const mutation = useInference()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (accepted) => {
      const f = accepted[0]
      if (!f) return
      setFile(f)
      setPreview(URL.createObjectURL(f))
    },
  })

  const handleSubmit = () => {
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    form.append("category", "bottle")
    mutation.mutate(form)
  }

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-3xl">Inspect Product</h1>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
          isDragActive
            ? "border-[#0071e3] bg-[#0071e3]/5"
            : "border-black/20 bg-white hover:border-[#0071e3]/60"
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="preview" className="mx-auto max-h-64 rounded-lg object-contain" />
        ) : (
          <p className="text-[#6e6e73]">Drop an image or click to upload</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || mutation.isPending}
        className="w-full rounded-xl bg-[#0071e3] py-3 font-medium text-white transition hover:bg-[#0066cc] disabled:opacity-40"
      >
        {mutation.isPending ? "Analyzing…" : "Run Inference"}
      </button>

      {mutation.isError && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-900">
          {(mutation.error as Error)?.message ?? "Inference failed. Is the API running?"}
        </div>
      )}

      {mutation.data && (
        <div
          className={`rounded-xl border p-6 ${
            mutation.data.is_defect
              ? "border-red-300 bg-red-50"
              : "border-emerald-300 bg-emerald-50"
          }`}
        >
          <p
            className={`mb-2 text-xl font-bold ${
              mutation.data.is_defect ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {mutation.data.is_defect ? "DEFECT DETECTED" : "PASSED"}
          </p>
          <p className="text-sm text-[#3a3a3c]">
            Score: <code className="text-[#1d1d1f]">{mutation.data.anomaly_score.toFixed(4)}</code>
            {" · "}
            Latency: <code className="text-[#1d1d1f]">{mutation.data.latency_ms.toFixed(1)}</code> ms
            {" · "}
            Mode: <code className="text-[#1d1d1f]">{mutation.data.model_mode}</code>
            {" · "}
            Version: <code className="text-[#1d1d1f]">{mutation.data.model_version}</code>
          </p>
        </div>
      )}
    </div>
  )
}
