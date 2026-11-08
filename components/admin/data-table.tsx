"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  searchFilter,
  pageSize = 10,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Filter data
  const filteredData = useMemo(() => {
    if (!search.trim() || !searchFilter) return data;
    const query = search.trim().toLowerCase();
    return data.filter((item) => searchFilter(item, query));
  }, [data, search, searchFilter]);

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-4">
      {searchFilter && (
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder || t("searchPlaceholder")}
              className="ps-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col, idx) => (
              <TableHead
                key={idx}
                className={`text-xs font-semibold text-foreground py-3 ${
                  col.className || ""
                }`}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                className="hover:bg-muted/30 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className={`text-xs py-3 ${col.className || ""}`}
                  >
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "")
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-40 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">
                    {emptyMessage || t("noRecords")}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredData.length === 0 ? 0 : page * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min((page + 1) * pageSize, filteredData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredData.length}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
            <span className="text-xs px-2 font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 px-2.5 rounded-lg text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

