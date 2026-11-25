import { AuthCard } from '@/components/ops/auth-card'
import { Button } from '@/components/ui/button'
import { signOut } from '../auth-actions'

export default function NoAccessPage() {
  return (
    <AuthCard title="Noch kein Zugriff" description="Ihr Konto ist angelegt, aber noch nicht freigeschaltet.">
      <p className="text-sm text-muted-foreground">
        Bitte wenden Sie sich an das Büro. Sobald Ihnen eine Rolle zugewiesen wurde, können Sie sich erneut anmelden.
      </p>
      <form action={signOut} className="mt-4">
        <Button type="submit" variant="outline" className="w-full">
          Abmelden
        </Button>
      </form>
    </AuthCard>
  )
}
