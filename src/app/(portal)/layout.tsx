import { LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/actions/portal'
import { SidebarNavClient, MobileNavClient } from '@/components/dashboard/SidebarNavClient'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="theme-marketing flex h-screen bg-[var(--color-mark-base)] overflow-hidden text-[var(--color-mark-primary)] pb-[68px] md:pb-0 relative antialiased">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[var(--color-mark-amber)] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 border-r border-black/5 bg-white/80 backdrop-blur-xl flex-col h-full z-20 shrink-0 relative shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-black/5">
          <div className="w-8 h-8 rounded bg-[var(--color-mark-ink)] text-white flex items-center justify-center mr-3 shadow-md">
            <span className="font-inter font-bold text-xs">LG</span>
          </div>
          <span className="font-inter font-bold text-lg tracking-tight text-[var(--color-mark-ink)]">LaunchGrid</span>
        </div>
        
        <SidebarNavClient />
        
        <div className="p-4 border-t border-black/5">
          <form action={signOutAction}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl hover:bg-red-50 text-[var(--color-mark-secondary)] hover:text-red-600 font-semibold transition-all duration-200 text-left cursor-pointer">
              <LogOut className="w-4.5 h-4.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto bg-[var(--color-mark-base)] z-10 font-inter">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <MobileNavClient />
    </div>
  )
}
