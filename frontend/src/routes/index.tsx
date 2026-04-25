import { Link, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="animate-fade-up rounded-[2rem] border border-black/10 bg-white/75 px-5 py-10 shadow-sm backdrop-blur sm:px-8 sm:py-14 md:px-14">
        <p className="mb-4 text-sm font-medium tracking-wide text-[#6e6e73]">Manufacturing Intelligence</p>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl md:text-6xl">
          Professional visual inspection platform for modern quality teams.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#3a3a3c] sm:text-base md:text-lg">
          Detect anomalies in product images, track model performance, and operate inference workflows with
          a local-first MLOps stack.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
          <Link
            to="/inspect"
            className="animate-soft-pulse rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0066cc] sm:px-6 sm:py-3"
          >
            Start Inspection
          </Link>
          <Link
            to="/analytics"
            className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition hover:bg-black/5 sm:px-6 sm:py-3"
          >
            View Analytics
          </Link>
        </div>
      </section>

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

      <section className="rounded-[2rem] border border-black/10 bg-[#1d1d1f] px-5 py-8 text-white sm:px-8 sm:py-10 md:flex md:items-center md:justify-between md:px-12">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Ready to run your first inspection?</h2>
          <p className="mt-2 text-sm text-white/80">Move from setup to insight with one streamlined workflow.</p>
        </div>
        <Link
          to="/inspect"
          className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1f] sm:px-6 sm:py-3 md:mt-0"
        >
          Open Inspector
        </Link>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#6e6e73]">Enterprise Trust</p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-3xl">
              Built for production quality operations
            </h2>
          </div>
          <Link
            to="/history"
            className="text-sm font-medium text-[#0071e3] transition-colors hover:text-[#0066cc]"
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
    <article className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
      <h3 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#3a3a3c]">{description}</p>
    </article>
  )
}

type TrustCardProps = {
  title: string
  detail: string
}

function TrustCard({ title, detail }: TrustCardProps) {
  return (
    <article className="rounded-2xl border border-black/10 bg-[#f5f5f7] p-4">
      <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#3a3a3c]">{detail}</p>
    </article>
  )
}
