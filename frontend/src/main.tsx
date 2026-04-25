import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import "@fontsource/ibm-plex-sans-jp/400.css"
import "@fontsource/ibm-plex-sans-jp/500.css"
import "@fontsource/ibm-plex-sans-jp/600.css"
import "@fontsource/ibm-plex-sans-jp/700.css"
import { routeTree } from "./routeTree.gen"
import "./index.css"

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById("root")
if (root) {
  ReactDOM.createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
