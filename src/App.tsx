import { reatomComponent } from '@reatom/react'
import { AuthGuard, NewTabPage } from '@/shared/ui'

const App = reatomComponent(() => {
  return (
    <AuthGuard>
      <NewTabPage />
    </AuthGuard>
  )
}, 'App')

export default App
