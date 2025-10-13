import { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      {/* Sidebar lateral */}
      <AppSidebar />

      {/* Conteúdo principal */}
      <SidebarInset>
        {/* Header */}
        <AppHeader />

        {/* Conteúdo da página */}
        <main className="p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}