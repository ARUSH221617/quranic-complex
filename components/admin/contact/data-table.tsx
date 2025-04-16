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
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  EyeIcon,
  TrashIcon, // Import TrashIcon for Delete action
  RefreshCwIcon, // Import RefreshCwIcon for Refresh button
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { ContactData } from "./schema"; // Import ContactData
import { ContactViewSheet } from "./contact-view-sheet"; // Import ContactViewSheet

// Define columns based on the ContactData type
export const columns: ColumnDef<ContactData>[] = [
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
  // Add columns based on ContactData schema
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div className="max-w-[400px] truncate">{row.getValue("subject")}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Received Date",
    cell: ({ row }) => (
      <div>{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>
    ),
  },
  // Actions column
  {
    id: "actions",
    cell: ({ row, table }) => {
      const contact = row.original;
      // Access the meta property correctly
      const { openViewSheet, openDeleteDialog } = table.options.meta as {
        openViewSheet: (contact: ContactData) => void;
        openDeleteDialog: (contact: ContactData) => void; // Add openDeleteDialog
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
            <DropdownMenuItem onSelect={() => openViewSheet(contact)}>
              <EyeIcon className="mr-2 size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => openDeleteDialog(contact)}
              className="text-red-600 focus:text-red-600"
            >
              <TrashIcon className="mr-2 size-4" />
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
  data: Array<ContactData>;
}

export function ContactDataTable({ data: initialData }: DataTableProps) {
  // State for table data and viewing sheet
  const [contacts, setContacts] = React.useState<ContactData[]>(initialData);
  const [viewingContact, setViewingContact] = // Re-add viewingContact state
    React.useState<ContactData | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [contactToDelete, setContactToDelete] =
    React.useState<ContactData | null>(null); // State for contact to delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false); // State for delete dialog
  const [isLoading, setIsLoading] = React.useState(false); // Loading state for refresh/delete
  const { toast } = useToast(); // Get toast function

  // Existing state for table controls
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
    setContacts(initialData);
  }, [initialData]);

  // Function to refetch contacts
  const refetchContacts = React.useCallback(async () => {
    setIsLoading(true);
    toast({
      title: "Refreshing contact messages...",
      description: "Please wait.",
    });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        cache: "no-store",
      });
      if (!res.ok) {
        let errorMsg = "Failed to fetch contacts";
        try {
          const errorBody = await res.json();
          errorMsg = errorBody.message || errorMsg;
        } catch (e) {
          /* ignore json parse error */
        }
        throw new Error(errorMsg);
      }
      const freshContacts: ContactData[] = await res.json();
      setContacts(freshContacts); // Update local state
      toast({
        title: "Success",
        description: "Contact messages refreshed!",
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

  // Function to open the view sheet
  const openViewSheet = (contact: ContactData) => {
    setViewingContact(contact);
    setIsViewOpen(true);
  };

  // Function to open the delete confirmation dialog
  const openDeleteDialog = (contact: ContactData) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle the confirmed deletion
  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    setIsLoading(true); // Indicate loading state during deletion
    toast({
      title: "Deleting contact message...",
      description: `Attempting to delete message from ${contactToDelete.name}.`,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contact?id=${contactToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        let errorData = { message: "Deletion failed" };
        try {
          errorData = await response.json();
        } catch (e) {
          /* Ignore if response is not JSON */
        }
        throw new Error(
          errorData.message ||
            `Failed to delete contact message. Status: ${response.status}`,
        );
      }

      toast({
        title: "Success",
        description: "Contact message deleted successfully!",
      });
      refetchContacts(); // Refetch data to update the table
      setIsDeleteDialogOpen(false); // Close the dialog
      setContactToDelete(null); // Clear the contact to delete
    } catch (error) {
      console.error("Deletion failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Deletion failed",
      });
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const table = useReactTable({
    data: contacts, // Use internal state for data
    columns, // Use the new columns definition
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id, // Use the actual contact ID (string)
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
    // Pass meta data to columns
    meta: {
      openViewSheet,
      openDeleteDialog, // Pass delete dialog function
      refetchContacts, // Pass refetch function if needed elsewhere (optional here)
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        {/* Filter by subject */}
        <Input
          placeholder="Filter by subject..."
          value={
            (table.getColumn("subject")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("subject")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          {/* Add Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetchContacts}
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
                      {/* Display user-friendly names */}
                      {column.id === "createdAt" ? "Received Date" : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Removed Add and Refresh buttons */}
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

      {/* Add the ContactViewSheet */}
      <ContactViewSheet
        contact={viewingContact}
        isOpen={isViewOpen}
        onOpenChangeAction={setIsViewOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contact message from{" "}
              <span className="font-semibold">{contactToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && (
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
