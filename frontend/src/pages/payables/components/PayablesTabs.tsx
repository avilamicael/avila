import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ActiveTab } from "@/hooks/payables/usePayables"

interface PayablesTabsProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}

export function PayablesTabs({ activeTab, onTabChange }: PayablesTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ActiveTab)}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all" className="flex items-center gap-2">
          <span>📋</span>
          <span>Todas</span>
        </TabsTrigger>
        <TabsTrigger value="overdue" className="flex items-center gap-2">
          <span>⏰</span>
          <span>Vencidas</span>
        </TabsTrigger>
        <TabsTrigger value="due" className="flex items-center gap-2">
          <span>💰</span>
          <span>A Pagar</span>
        </TabsTrigger>
        <TabsTrigger value="paid" className="flex items-center gap-2">
          <span>✅</span>
          <span>Pagas</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
