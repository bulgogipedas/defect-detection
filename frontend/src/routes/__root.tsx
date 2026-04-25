import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Link, Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen text-[#1d1d1f]">
      <nav className="sticky top-0 z-40 border-b border-black/10 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/" className="shrink-0 text-sm font-semibold tracking-tight text-[#1d1d1f]">
            Defect Detector
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-5">
            <Link
              to="/"
              className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
              activeProps={{ className: "text-sm text-[#1d1d1f] font-medium" }}
            >
              Home
            </Link>
            <Link
              to="/inspect"
              className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
              activeProps={{ className: "text-sm text-[#1d1d1f] font-medium" }}
            >
              Inspect
            </Link>
            <Link
              to="/history"
              className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
              activeProps={{ className: "text-sm text-[#1d1d1f] font-medium" }}
            >
              History
            </Link>
            <Link
              to="/analytics"
              className="text-sm text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
              activeProps={{ className: "text-sm text-[#1d1d1f] font-medium" }}
            >
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-[#86868b] sm:px-6 sm:pb-10">
        Local-first MLOps visual inspection platform.
      </footer>

      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </>
      )}
    </div>
  )
}
