import { Outlet, createRootRoute, Link } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-white">Defect Detector</span>
        <Link to="/" className="text-gray-400 hover:text-white text-sm" activeProps={{ className: "text-white text-sm" }}>
          Inspect
        </Link>
        <Link
          to="/history"
          className="text-gray-400 hover:text-white text-sm"
          activeProps={{ className: "text-white text-sm" }}
        >
          History
        </Link>
        <Link
          to="/analytics"
          className="text-gray-400 hover:text-white text-sm"
          activeProps={{ className: "text-white text-sm" }}
        >
          Analytics
        </Link>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </div>
  )
}
