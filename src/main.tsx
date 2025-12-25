import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { context, connectLogger, clearStack } from "@reatom/core"
import { reatomContext } from "@reatom/react"

import "./index.css"
import App from "./App.tsx"

// Clear default context for predictability
clearStack()

// Create root frame and connect logger in dev mode
const rootFrame = context.start()
if (import.meta.env.DEV) {
  rootFrame.run(connectLogger)
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <reatomContext.Provider value={rootFrame}>
      <App />
    </reatomContext.Provider>
  </StrictMode>
)
