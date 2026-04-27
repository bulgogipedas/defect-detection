import { Link, createFileRoute } from "@tanstack/react-router"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <Card className="animate-fade-up rounded-[2rem]">
        <CardHeader className="px-5 py-8 sm:px-8 sm:py-10 md:px-14 md:py-12">
          <Badge variant="secondary" className="w-fit">Manufacturing Intelligence</Badge>
          <CardTitle className="max-w-4xl text-3xl sm:text-4xl md:text-6xl">
            Professional visual inspection platform for modern quality teams.
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-7 sm:text-base md:text-lg">
            Detect anomalies in product images, track model performance, and operate inference workflows with a
            local-first MLOps stack.
          </CardDescription>
          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
            <Button asChild className="animate-soft-pulse rounded-full px-6">
              <Link to="/inspect">Start Inspection</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <section className="animate-fade-up-delay grid gap-4 sm:gap-5 md:grid-cols-3">
        <FeatureCard
          title="Fast Inference"
          description="Upload and evaluate product photos in seconds with transparent score and latency outputs."
        />
        <FeatureCard
          title="MLOps Ready"
          description="Model version visibility, telemetry endpoints, and CI quality gates built into the workflow."
        />
        <FeatureCard
          title="Operational Dashboard"
          description="Track inspection history and defect trends to make confident production decisions."
        />
      </section>

      <section className="rounded-[2rem] border border-border bg-foreground px-5 py-8 text-background sm:px-8 sm:py-10 md:flex md:items-center md:justify-between md:px-12">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Ready to run your first inspection?</h2>
          <p className="mt-2 text-sm text-white/80">Move from setup to insight with one streamlined workflow.</p>
        </div>
        <Button asChild variant="secondary" className="mt-5 rounded-full md:mt-0">
          <Link to="/inspect">Open Inspector</Link>
        </Button>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Enterprise Trust</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for production quality operations
            </h2>
          </div>
          <Link
            to="/history"
            className="text-sm font-medium text-primary transition-colors hover:opacity-80"
          >
            Open live history →
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
          <TrustCard title="Model Versioning" detail="Active model manifest, promotion policy, and explicit version in inference responses." />
          <TrustCard title="Operational Telemetry" detail="P50/P95 latency, defect rate, and mode distribution available via API and dashboard." />
          <TrustCard title="Secure Runtime Defaults" detail="Configurable serving modes (auto, production, demo) with graceful fallback control." />
          <TrustCard title="Release Confidence" detail="CI checks for lint, test, build, container build, and model-change gate enforcement." />
        </div>
      </section>
    </div>
  )
}

type FeatureCardProps = {
  title: string
  description: string
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="mt-2 text-sm leading-6">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

type TrustCardProps = {
  title: string
  detail: string
}

function TrustCard({ title, detail }: TrustCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-muted/40 p-4">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  )
}
