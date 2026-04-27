import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useRef } from "react"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const scopeRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
      tl.from("[data-hero-el]", { y: 24, opacity: 0, duration: 0.6, stagger: 0.08 })
        .from("[data-section-el]", { y: 20, opacity: 0, duration: 0.45, stagger: 0.05 }, "-=0.3")
    },
    { scope: scopeRef },
  )

  return (
    <div ref={scopeRef} className="space-y-10 sm:space-y-14">
      <section data-page-anim data-section-el className="surface-panel hero-glow overflow-hidden p-5 sm:p-8 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Badge data-hero-el variant="secondary" className="w-fit">
              Visual Defect Platform
            </Badge>
            <h1 data-hero-el className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Modern inspection UX with production-ready MLOps workflow.
            </h1>
            <p data-hero-el className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
              Detect anomalies, trace active model versions, and monitor runtime telemetry from one cohesive operator
              console built for real manufacturing scenarios.
            </p>
            <div data-hero-el className="flex flex-wrap items-center gap-3">
              <Button asChild className="animate-soft-pulse rounded-full px-6 micro-lift">
                <Link to="/inspect">Open Live Inspector</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6 micro-lift">
                <Link to="/analytics">Explore Analytics</Link>
              </Button>
            </div>
            <div data-hero-el className="grid gap-3 sm:grid-cols-3">
              <StatPill label="Categories" value="15 Classes" />
              <StatPill label="Stack" value="FastAPI + React" />
              <StatPill label="Mode" value="Auto / Manual" />
            </div>
          </div>

          <div data-hero-el className="surface-panel bg-card/80 p-4">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section data-page-anim data-section-el className="grid gap-4 sm:gap-5 md:grid-cols-3">
        <FeatureCard
          title="Experience-Driven UX"
          description="Split modes (Fast, Accurate, Manual), skeleton loading, and micro interactions for smooth operator flow."
        />
        <FeatureCard
          title="MLOps-Grade Runtime"
          description="Model version visibility, promotion gates, and category-aware inference with fallback safety modes."
        />
        <FeatureCard
          title="Operational Observability"
          description="Track defect rate, p50/p95 latency, mode usage, and inspection history to support production decisions."
        />
      </section>

      <section data-page-anim data-section-el className="grid gap-4 lg:grid-cols-3">
        <article className="surface-panel p-5 lg:col-span-2">
          <p className="section-eyebrow">Workflow</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">From raw images to operations</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <StoryStep
              step="01"
              title="Collect & Understand"
              detail="Use MVTec AD categories and profile data quality before model training."
            />
            <StoryStep
              step="02"
              title="Train & Evaluate"
              detail="Train category-specific PatchCore models with AUROC/F1 quality gates."
            />
            <StoryStep
              step="03"
              title="Ship & Monitor"
              detail="Deploy API + dashboard with telemetry and model traceability."
            />
          </div>
        </article>

        <article className="surface-panel flex flex-col justify-between p-5">
          <div>
            <p className="section-eyebrow">Quick Access</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">Operator shortcuts</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Jump directly to the operational pages used during day-to-day inspection.
            </p>
          </div>
          <div className="mt-5 grid gap-2">
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link to="/inspect">Inspect Products</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link to="/history">Review History</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link to="/analytics">Read Telemetry</Link>
            </Button>
          </div>
        </article>
      </section>

      <section data-page-anim data-section-el className="surface-panel p-5 sm:p-8">
        <div className="mb-6">
          <p className="section-eyebrow">Architecture</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Full-stack implementation context</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <StackGroup
            title="Frontend"
            items={["React + Vite", "TypeScript", "TanStack Router/Query/Table", "Tailwind + shadcn-style UI"]}
          />
          <StackGroup
            title="Backend & ML"
            items={["FastAPI", "PyTorch + PatchCore", "MLflow", "PostgreSQL (Supabase-ready)"]}
          />
          <StackGroup
            title="DevOps & QA"
            items={["GitHub Actions", "Ruff + Pytest + ESLint", "Container build checks", "Model evaluation gate"]}
          />
          <StackGroup
            title="Monitoring & Ops"
            items={["P50/P95 latency telemetry", "Defect rate analytics", "Model mode/version traceability", "History API + dashboard"]}
          />
        </div>
      </section>

      <section data-page-anim data-section-el className="rounded-[2rem] border border-border bg-foreground px-5 py-8 text-background sm:px-8 sm:py-10 md:flex md:items-center md:justify-between md:px-12">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Ready to run your first inspection?</h2>
          <p className="mt-2 text-sm text-white/80">Move from setup to insight with one streamlined workflow.</p>
        </div>
        <Button asChild variant="secondary" className="mt-5 rounded-full md:mt-0">
          <Link to="/inspect">Open Inspector</Link>
        </Button>
      </section>

      <section data-page-anim data-section-el className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
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
    <Card className="rounded-3xl micro-lift">
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
    <article className="rounded-2xl border border-border bg-muted/40 p-4 micro-lift">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  )
}

function StoryStep({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-border bg-muted/30 p-4 micro-lift">
      <p className="text-xs font-semibold text-primary">{step}</p>
      <h3 className="mt-1 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  )
}

function StackGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-border bg-muted/30 p-4 micro-lift">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function HeroVisual() {
  return (
    <svg viewBox="0 0 640 420" className="h-full w-full rounded-xl">
      <defs>
        <linearGradient id="panelGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.32)" />
          <stop offset="100%" stopColor="hsl(194 95% 45% / 0.22)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="640" height="420" rx="20" fill="hsl(var(--card))" />
      <rect x="20" y="20" width="600" height="380" rx="18" fill="url(#panelGrad)" />

      <rect x="48" y="52" width="188" height="116" rx="14" fill="hsl(var(--background) / 0.86)" />
      <rect x="252" y="52" width="340" height="116" rx="14" fill="hsl(var(--background) / 0.74)" />
      <rect x="48" y="186" width="268" height="186" rx="14" fill="hsl(var(--background) / 0.86)" />
      <rect x="332" y="186" width="260" height="86" rx="14" fill="hsl(var(--background) / 0.8)" />
      <rect x="332" y="286" width="260" height="86" rx="14" fill="hsl(var(--background) / 0.8)" />

      <circle cx="142" cy="110" r="38" fill="hsl(var(--primary) / 0.35)" />
      <rect x="104" y="154" width="76" height="8" rx="4" fill="hsl(var(--muted-foreground) / 0.42)" />

      <rect x="278" y="84" width="112" height="12" rx="6" fill="hsl(var(--primary) / 0.4)" />
      <rect x="278" y="108" width="204" height="10" rx="5" fill="hsl(var(--muted-foreground) / 0.38)" />
      <rect x="278" y="130" width="164" height="10" rx="5" fill="hsl(var(--muted-foreground) / 0.34)" />

      <polyline
        points="78,328 128,274 176,296 228,246 286,262"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="286" cy="262" r="8" fill="hsl(var(--primary))" />

      <rect x="360" y="214" width="152" height="14" rx="7" fill="hsl(var(--primary) / 0.4)" />
      <rect x="360" y="240" width="108" height="10" rx="5" fill="hsl(var(--muted-foreground) / 0.35)" />
      <rect x="360" y="314" width="172" height="14" rx="7" fill="hsl(194 95% 45% / 0.4)" />
      <rect x="360" y="338" width="128" height="10" rx="5" fill="hsl(var(--muted-foreground) / 0.35)" />
    </svg>
  )
}
