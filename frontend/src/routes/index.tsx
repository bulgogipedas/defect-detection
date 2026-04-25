import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { useInference } from "../queries/useInference"

export const Route = createFileRoute("/")({
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inspect Product</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-indigo-400 bg-indigo-950/20" : "border-gray-700 hover:border-indigo-600"}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg object-contain" />
        ) : (
          <p className="text-gray-500">Drop an image or click to upload</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || mutation.isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white
                   disabled:opacity-40 rounded-lg font-medium transition-colors"
      >
        {mutation.isPending ? "Analyzing…" : "Run Inference"}
      </button>

      {mutation.isError && (
        <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-200 text-sm">
          {(mutation.error as Error)?.message ?? "Inference failed. Is the API running?"}
        </div>
      )}

      {mutation.data && (
        <div
          className={`p-6 rounded-xl border ${
            mutation.data.is_defect
              ? "border-red-500/50 bg-red-950/30"
              : "border-green-500/50 bg-green-950/30"
          }`}
        >
          <p
            className={`text-xl font-bold mb-2 ${
              mutation.data.is_defect ? "text-red-400" : "text-green-400"
            }`}
          >
            {mutation.data.is_defect ? "DEFECT DETECTED" : "PASSED"}
          </p>
          <p className="text-sm text-gray-400">
            Score: <code className="text-white">{mutation.data.anomaly_score.toFixed(4)}</code>
            {" · "}
            Latency: <code className="text-white">{mutation.data.latency_ms.toFixed(1)}</code> ms
            {" · "}
            Mode: <code className="text-white">{mutation.data.model_mode}</code>
            {" · "}
            Version: <code className="text-white">{mutation.data.model_version}</code>
          </p>
        </div>
      )}
    </div>
  )
}
