import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [darkMode, setDarkMode] = useState(false)
  const mainRef = useRef<HTMLElement | null>(null)
  const routeTransitionRef = useRef<HTMLDivElement | null>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

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

  const navLink =
    "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"

  useGSAP(
    () => {
      if (!mainRef.current || !routeTransitionRef.current) return
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

      tl.fromTo(
        routeTransitionRef.current,
        { scaleX: 0, transformOrigin: "left center", opacity: 0.9 },
        { scaleX: 1, duration: 0.2, opacity: 1 },
      )
        .to(routeTransitionRef.current, {
          scaleX: 0,
          transformOrigin: "right center",
          duration: 0.25,
          opacity: 0.9,
        })
        .fromTo(
          "[data-page-shell]",
          { y: 18, opacity: 0, filter: "blur(6px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.5,
            clearProps: "filter",
          },
          "-=0.15",
        )

      const nodes = mainRef.current.querySelectorAll("[data-page-anim]")
      if (nodes.length > 0) {
        tl.fromTo(
          nodes,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05 },
          "-=0.35",
        )
      }
    },
    { dependencies: [pathname], scope: mainRef },
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/" className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold tracking-tight text-foreground micro-lift">
            Defect Detection Portfolio
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:gap-3">
            <Link
              to="/"
              className={navLink}
              activeProps={{ className: cn(navLink, "bg-primary text-primary-foreground shadow-sm") }}
            >
              Home
            </Link>
            <Link
              to="/inspect"
              className={navLink}
              activeProps={{ className: cn(navLink, "bg-primary text-primary-foreground shadow-sm") }}
            >
              Inspect
            </Link>
            <Link
              to="/history"
              className={navLink}
              activeProps={{ className: cn(navLink, "bg-primary text-primary-foreground shadow-sm") }}
            >
              History
            </Link>
            <Link
              to="/analytics"
              className={navLink}
              activeProps={{ className: cn(navLink, "bg-primary text-primary-foreground shadow-sm") }}
            >
              Analytics
            </Link>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      <main ref={mainRef} className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div
          ref={routeTransitionRef}
          aria-hidden
          className="pointer-events-none absolute left-4 right-4 top-0 z-10 h-1 rounded-full bg-primary/60 sm:left-6 sm:right-6"
        />
        <div data-page-shell key={pathname}>
          <Outlet />
        </div>
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
