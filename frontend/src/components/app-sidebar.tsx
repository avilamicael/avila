"use client"

import * as React from "react"
import {
  Bot,
  Building2,
  Settings2,
  CircleDollarSign,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const data = {
    user: {
      name: user?.full_name || "Usúario",
      avatar: user?.avatar,
    },

    navMain: [
      {
        title: "Financeiro",
        url: "#",
        icon: CircleDollarSign,
        items: [
          {
            title: "Adicionar Conta",
            url: "/payables/create",
          },
          {
            title: "Listar Contas",
            url: "/payables/",
          },
        ],
      },
      {
        title: "IA",
        url: "#",
        icon: Bot,
        items: [
          {
            title: "Alpha",
            url: "#",
          },
          {
            title: "Beta",
            url: "#",
          },
          {
            title: "Gamma",
            url: "#",
          },
        ],
      },
      {
        title: "Configurações",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "Administração",
            url: "#",
          },
        ],
      },
    ],

  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="*">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.tenant_name || "AVILA SOLUÇÔES"}</span>
                  <span className="truncate text-xs">{user?.email || "contato@avila.com.br"}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
