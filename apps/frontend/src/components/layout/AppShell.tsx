import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, Building2, FolderKanban, Palette, Briefcase, BarChart3, Calculator, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    label: 'ダッシュボード',
    children: [
      {
        label: '山積ダッシュボード',
        href: '/workload',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'マスタ管理',
    children: [
      {
        label: 'ビジネスユニット',
        href: '/master/business-units',
        icon: Building2,
      },
      {
        label: '案件',
        href: '/master/projects',
        icon: Briefcase,
      },
      {
        label: '案件タイプ',
        href: '/master/project-types',
        icon: FolderKanban,
      },
      {
        label: '作業種類',
        href: '/master/work-types',
        icon: Palette,
      },
      {
        label: '間接作業・キャパシティ設定',
        href: '/master/indirect-capacity-settings',
        icon: Calculator,
      },
    ],
  },
]

function SidebarNav() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <nav className="flex flex-col gap-2 p-4">
      {menuItems.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.children.map((item) => {
              const isActive = currentPath.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center px-6">
          <h1 className="text-lg font-bold text-sidebar-foreground">操業管理システム</h1>
        </div>
        <Separator />
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-6 pb-0">
                <SheetTitle>操業管理システム</SheetTitle>
              </SheetHeader>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">操業管理システム</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            'animate-in fade-in duration-300',
            currentPath.startsWith('/workload') || currentPath.startsWith('/master/indirect-capacity-settings') ? 'h-full' : 'mx-auto max-w-4xl px-6 py-8',
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
