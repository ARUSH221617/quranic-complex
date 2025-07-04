"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DetailedGalleryData, GalleryData } from "./schema";
import { GalleryEditSheet } from "././gallery-edit-sheet"; // Keep the specific import path for clarity
import { GalleryCreateSheet } from "./gallery-create-sheet";

// Define columns based on the GalleryData type
export const columns: ColumnDef<GalleryData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Add columns based on GalleryData schema
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <img
        src={row.getValue("image")}
        alt="Gallery Item"
        className="h-16 w-16 object-cover rounded-md"
      />
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate">
        {row.getValue("description")}
      </div>
    ),
  },
  // Actions column
  {
    id: "actions",
    cell: ({ row, table }) => {
      const galleryItem = row.original;
      // Access the meta property correctly
      const { openEditSheet, deleteGalleryItem } = table.options.meta as {
        openEditSheet: (item: GalleryData) => void;
        deleteGalleryItem: (item: GalleryData) => void;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <MoreVerticalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onSelect={() => openEditSheet(galleryItem)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => deleteGalleryItem(galleryItem)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Update DataTable component props and state
interface DataTableProps {
  data: Array<GalleryData>;
}

export function GalleryDataTable({ data: initialData }: DataTableProps) {
  // State for table data, editing sheet, and loading
  const [gallery, setGallery] = React.useState<GalleryData[]>(initialData);
  const [editingGalleryId, setEditingGalleryId] = React.useState<
    string | null
  >(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  // Existing state
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Update local data when initialData changes
  React.useEffect(() => {
    setGallery(initialData);
  }, [initialData]);

  // Function to refetch gallery items
  const refetchGallery = React.useCallback(async () => {
    setIsLoading(true);
    toast({
      title: "Refreshing gallery data...",
      description: "Please wait.",
    });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery?locale=en`,
        {
          cache: "no-store",
        },
      );
      if (!res.ok) {
        let errorMsg = "Failed to fetch gallery items";
        try {
          const errorBody = await res.json();
          errorMsg = errorBody.message || errorMsg;
        } catch (e) {
          /* ignore json parse error */
        }
        throw new Error(errorMsg);
      }
      const freshGallery: GalleryData[] = await res.json();
      setGallery(freshGallery); // Update local state
      toast({
        title: "Success",
        description: "Gallery data refreshed!",
      });
    } catch (error) {
      console.error("Refetch failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Refetch failed",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Function to open the edit sheet
  const openEditSheet = React.useCallback((item: GalleryData) => {
    setEditingGalleryId(item.id);
    setIsEditOpen(true);
  }, []);

  const deleteGalleryItem = async (item: GalleryData) => {
    setIsLoading(true);
    toast({ title: "Deleting gallery item...", description: "Please wait." });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gallery/${item.id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        let errorMsg = "Failed to delete gallery item";
        try {
          const errorBody = await res.json();
          errorMsg = errorBody.message || errorMsg;
        } catch (e) {
          /* ignore json parse error */
        }
        throw new Error(errorMsg);
      }
      toast({
        title: "Success",
        description: "Gallery item has been deleted!",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Delete failed",
      });
    } finally {
      await refetchGallery();
    }
  };

  const table = useReactTable({
    data: gallery, // Use internal state for data
    columns, // Use the new columns definition
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id, // Use the actual gallery item ID (string)
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // Pass meta data to columns (e.g., the function to open the sheet)
    meta: {
      openEditSheet,
      deleteGalleryItem,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        {/* Filter by title */}
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          {/* Add Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetchGallery}
            disabled={isLoading}
          >
            <RefreshCwIcon
              className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {/* Column visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <ColumnsIcon className="mr-2 size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Add Gallery Item button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Gallery Item
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="rows-per-page"
              className="whitespace-nowrap text-sm font-medium"
            >
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <GalleryCreateSheet
        isOpen={isCreateOpen}
        onOpenChangeAction={setIsCreateOpen}
        onCreateSuccessAction={refetchGallery}
      />

      <GalleryEditSheet
        galleryId={editingGalleryId}
        isOpen={isEditOpen}
        onOpenChangeAction={setIsEditOpen}
        onUpdateSuccessAction={refetchGallery}
      />
    </div>
  );
}
