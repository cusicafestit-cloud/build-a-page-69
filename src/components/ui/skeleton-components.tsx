import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Skeleton para cards de eventos
export const EventCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton para filas de tabla
export const TableRowSkeleton = ({ columns }: { columns: number }) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton className="h-4 w-full" />
      </TableCell>
    ))}
  </TableRow>
);

// Skeleton para tabla completa
export const TableSkeleton = ({ 
  columns, 
  rows = 5, 
  headers 
}: { 
  columns: number; 
  rows?: number; 
  headers?: string[] 
}) => (
  <>
    <TableHeader>
      <TableRow>
        {headers ? 
          headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          )) :
          Array.from({ length: columns }).map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))
        }
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRowSkeleton key={index} columns={columns} />
      ))}
    </TableBody>
  </>
);

// Skeleton para formularios
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

// Skeleton para selectores/dropdowns
export const SelectSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
  </div>
);

// Skeleton para grid de cards
export const CardGridSkeleton = ({ 
  items = 6, 
  columns = 3 
}: { 
  items?: number; 
  columns?: number 
}) => (
  <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-${columns}`}>
    {Array.from({ length: items }).map((_, index) => (
      <EventCardSkeleton key={index} />
    ))}
  </div>
);

// Skeleton para estadísticas/métricas
export const StatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Skeleton para lista de elementos
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

// Skeleton para badges/etiquetas
export const BadgeSkeleton = () => (
  <Skeleton className="h-5 w-16 rounded-full" />
);

// Skeleton para botones
export const ButtonSkeleton = ({ width = "w-24" }: { width?: string }) => (
  <Skeleton className={`h-10 ${width}`} />
);

// Skeleton para searchbox/comando
export const SearchSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    <div className="space-y-1">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  </div>
);
