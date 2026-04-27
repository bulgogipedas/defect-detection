import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Link, Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    setDarkMode(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  const navLink = "text-sm text-muted-foreground transition-colors hover:text-foreground"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/" className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
            Defect Detector
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-5">
            <Link
              to="/"
              className={navLink}
              activeProps={{ className: cn(navLink, "font-medium text-foreground") }}
            >
              Home
            </Link>
            <Link
              to="/inspect"
              className={navLink}
              activeProps={{ className: cn(navLink, "font-medium text-foreground") }}
            >
              Inspect
            </Link>
            <Link
              to="/history"
              className={navLink}
              activeProps={{ className: cn(navLink, "font-medium text-foreground") }}
            >
              History
            </Link>
            <Link
              to="/analytics"
              className={navLink}
              activeProps={{ className: cn(navLink, "font-medium text-foreground") }}
            >
              Analytics
            </Link>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6 sm:pb-10">
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
