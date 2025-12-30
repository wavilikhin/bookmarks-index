import { MainScreen } from '@/screens'
import { AuthGuard } from './auth'
import { MigrationDialog } from '@/components/migration/migration-dialog'

export default function App() {
  return (
    <AuthGuard>
      <MainScreen />
      <MigrationDialog />
    </AuthGuard>
  )
}
