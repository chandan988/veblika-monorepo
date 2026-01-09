"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useCreateEmploymentStatus, useEmploymentStatuses, useUpdateEmploymentStatus } from "@/hooks/use-employment-status";

export default function EmploymentStatusPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);

  const { employmentStatuses, isLoading, deleteEmploymentStatus } = useEmploymentStatuses({
    organisationId: "695131b8c139647c5a9931af",
    page,
    search,
    limit: 100,
  });

  const createMutation = useCreateEmploymentStatus();
  const updateMutation = useUpdateEmploymentStatus();

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      status: "",
      organisationId: "695131b8c139647c5a9931af",
    },
  });

  const handleCreate = () => {
    reset({
      status: "",
      organisationId: "695131b8c139647c5a9931af",
    });
    setSelectedStatus(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (status: any) => {
    setSelectedStatus(status);
    setValue("status", status.status);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setStatusToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (statusToDelete) {
      try {
        await deleteEmploymentStatus(statusToDelete);
        toast.success("Employment status deleted successfully");
        setDeleteDialogOpen(false);
        setStatusToDelete(null);
      } catch (error) {
        toast.error("Failed to delete employment status");
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (selectedStatus) {
        await updateMutation.mutateAsync({
          id: selectedStatus._id,
          data,
        });
        toast.success("Employment status updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Employment status created successfully");
      }
      setEditDialogOpen(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employment Status</h2>
          <p className="text-muted-foreground">
            Manage employment status for your organization
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Employment Status</CardTitle>
              <CardDescription>
                View and manage all employment status
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search status..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employmentStatuses?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No employment status found
                    </TableCell>
                  </TableRow>
                ) : (
                  employmentStatuses?.data?.map((status: any) => (
                    <TableRow key={status._id}>
                      <TableCell className="font-medium">{status.status}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(status)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(status._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus ? "Edit Employment Status" : "Create Employment Status"}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus
                ? "Update employment status details"
                : "Add a new employment status to your organization"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Input
                id="status"
                placeholder="e.g., Active, Onboarding, Exited"
                {...register("status", { required: true })}
              />
            </div>

          

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedStatus ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employment status
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
