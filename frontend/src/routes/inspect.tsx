import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select } from "../components/ui/select"
import { cn } from "../lib/utils"
import { useCategories } from "../queries/useCategories"
import { useInference } from "../queries/useInference"

export const Route = createFileRoute("/inspect")({
  component: InferencePage,
})

function InferencePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [detectionMode, setDetectionMode] = useState<"auto_fast" | "auto" | "manual">("auto_fast")
  const [manualCategory, setManualCategory] = useState("bottle")
  const mutation = useInference()
  const categoriesQuery = useCategories()

  const categories = categoriesQuery.data?.categories ?? []
  const selectedManualCategory = categories.includes(manualCategory) ? manualCategory : categories[0] ?? "bottle"
  const requestCategory = detectionMode === "manual" ? selectedManualCategory : detectionMode

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
    form.append("category", requestCategory)
    mutation.mutate(form)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Inspect Product</CardTitle>
          <CardDescription>Pilih mode inferensi dulu, lalu (opsional) kategori manual.</CardDescription>
          <div className="flex items-center gap-2 pt-1">
            {detectionMode === "auto_fast" ? (
              <Badge
                variant="secondary"
                title="Fast mode: optimized for speed with slight potential accuracy trade-off."
              >
                Fast Mode
              </Badge>
            ) : detectionMode === "auto" ? (
              <Badge
                variant="outline"
                title="Accurate mode: optimized for category precision, usually slightly slower."
              >
                Accurate Mode
              </Badge>
            ) : (
              <Badge
                variant="outline"
                title="Manual mode: uses selected category directly, fastest and most stable if category is known."
              >
                Manual Category
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {detectionMode === "auto_fast"
                ? "Speed-first auto detection"
                : detectionMode === "auto"
                  ? "Accuracy-first auto detection"
                  : "Direct category inference"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Inference Mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <ModeButton
                active={detectionMode === "auto_fast"}
                title="Auto Fast"
                subtitle="Cepat, akurasi cukup"
                onClick={() => setDetectionMode("auto_fast")}
              />
              <ModeButton
                active={detectionMode === "auto"}
                title="Auto Accurate"
                subtitle="Lebih presisi, sedikit lebih lambat"
                onClick={() => setDetectionMode("auto")}
              />
              <ModeButton
                active={detectionMode === "manual"}
                title="Manual Category"
                subtitle="Pilih kategori sendiri"
                onClick={() => setDetectionMode("manual")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Category (Manual Only)</p>
            <Select
              value={selectedManualCategory}
              disabled={detectionMode !== "manual"}
              onChange={(e) => setManualCategory(e.target.value)}
            >
              {categories.length === 0 ? (
                <option value="bottle">bottle</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              )}
            </Select>
            {detectionMode !== "manual" ? (
              <p className="text-xs text-muted-foreground">
                Kategori ditentukan otomatis oleh sistem untuk mode Auto.
              </p>
            ) : null}
          </div>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
              isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/60"
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="preview" className="mx-auto max-h-64 rounded-lg object-contain" />
            ) : (
              <p className="text-muted-foreground">Drop an image or click to upload</p>
            )}
          </div>

          <Button type="button" onClick={handleSubmit} disabled={!file || mutation.isPending} className="w-full">
            {mutation.isPending ? "Analyzing..." : "Run Inference"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inference Result</CardTitle>
          <CardDescription>Operational output and model traceability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading categories...</p> : null}
          {mutation.isError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {(mutation.error as Error)?.message ?? "Inference failed. Is the API running?"}
            </div>
          )}
          {!mutation.data && !mutation.isError ? (
            <p className="text-sm text-muted-foreground">No result yet. Run inference to see output.</p>
          ) : null}
          {mutation.data && (
            <div className="space-y-3">
              <Badge variant={mutation.data.is_defect ? "destructive" : "default"}>
                {mutation.data.is_defect ? "DEFECT DETECTED" : "PASSED"}
              </Badge>
              <div className="space-y-1 text-sm">
                <p>
                  Score: <code>{mutation.data.anomaly_score.toFixed(4)}</code>
                </p>
                <p>
                  Latency: <code>{mutation.data.latency_ms.toFixed(1)} ms</code>
                </p>
                <p>
                  Mode: <code>{mutation.data.model_mode}</code>
                </p>
                <p>
                  Requested: <code>{requestCategory}</code>
                </p>
                <p>
                  Version: <code>{mutation.data.model_version}</code>
                </p>
                <p>
                  Category: <code>{mutation.data.category}</code>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ModeButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </button>
  )
}
