// src/components/RoutesTable.tsx
import React, { useRef, useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row as TableRowType, // Renamed to avoid conflict
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

// Assuming your shadcn Table components are correctly imported
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path if needed
import { cn } from "@/lib/utils"; // For shadcn class utility
import type { Route } from "@/data/routes";
import { Link } from "react-router";

const routeTypeMap: { [key: number]: string } = {
  0: "Light Rail",
  1: "Subway",
  2: "Rail",
  3: "Bus",
  4: "Ferry",
  5: "Cable Car",
  6: "Gondola",
  7: "Funicular",
};

interface RoutesTableProps {
  data: Route[];
}

function RoutesTable({ data }: RoutesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<Array<ColumnDef<Route>>>(
    () => [
      {
        accessorKey: "route_id",
        header: "ID",
        size: 80,
        cell: (info) => (
          <Link to={`/routes/${info.getValue<string>()}`}>
            <div className="font-bold p-1 px-4 text-center rounded-sm hover:bg-muted border-1 ">
              {info.getValue<string>()}
            </div>
          </Link>
        ),
      },

      {
        accessorKey: "route_desc",
        header: "Description",
        cell: (info) => (
          <div className="text-ellipsis overflow-hidden">
            {info.getValue<string>()}
          </div>
        ),
        size: 350,
      },
      {
        accessorKey: "route_type",
        header: "Type",
        cell: (info) => routeTypeMap[info.getValue<number>()] || "Unknown",
        size: 120,
      },
      {
        accessorKey: "route_long_name",
        header: "",
        cell: (info) => (
          <div
            className="rounded-md p-1 px-2 text-center text-sm font-bold"
            style={{
              backgroundColor: `#${info.row.original.route_color}`,
              color: `#${info.row.original.route_text_color}`,
            }}
          >
            {info.getValue<string>()}
          </div>
        ),
        size: 260,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true, // Optional: for development debugging
  });

  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="overflow-auto max-h-[calc(100vh-4rem)]">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        <Table>
          <TableHeader className="">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="sticky top-0 bg-background z-100"
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default RoutesTable;
