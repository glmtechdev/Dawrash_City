import { BottomNav } from '@/components/dawrash/bottom-nav'
import { MemberTopNav, MemberDesktopBrand } from '@/components/dawrash/member-nav'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()
    return data?.is_admin === true
  } catch {
    return false
  }
}

export async function MemberLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await getIsAdmin()

  return (
    <div className="min-h-svh bg-background pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <MemberDesktopBrand />
          <div className="flex items-center gap-2">
            <MemberTopNav isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
