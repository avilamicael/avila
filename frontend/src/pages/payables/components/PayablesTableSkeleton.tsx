import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function PayablesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"><Skeleton className="h-4 w-4" /></TableHead>
          <TableHead className="w-[120px]"><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-32" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
          <TableHead className="w-[150px] text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><div className="flex flex-col gap-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-24" /></div></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><div className="flex flex-col gap-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-24" /></div></TableCell>
            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell><div className="flex gap-2 justify-center"><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-16" /></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}