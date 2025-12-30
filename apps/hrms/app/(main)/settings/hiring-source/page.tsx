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
import { Textarea } from "@workspace/ui/components/textarea";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  useHiringSources,
  useCreateHiringSource,
  useUpdateHiringSource,
} from "@/hooks/use-hiring-source";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function HiringSourcePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

  const { hiringSources, isLoading, deleteHiringSource } = useHiringSources({
    organisationId: "695131b8c139647c5a9931af",
    page,
    search,
    limit: 100,
  });

  const createMutation = useCreateHiringSource();
  const updateMutation = useUpdateHiringSource();

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      source: "",
      organisationId: "695131b8c139647c5a9931af",
    },
  });

  const handleCreate = () => {
    reset({
      source: "",
      organisationId: "695131b8c139647c5a9931af",
    });
    setSelectedSource(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (source: any) => {
    setSelectedSource(source);
    setValue("source", source.source);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSourceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sourceToDelete) {
      try {
        await deleteHiringSource(sourceToDelete);
        toast.success("Hiring source deleted successfully");
        setDeleteDialogOpen(false);
        setSourceToDelete(null);
      } catch (error) {
        toast.error("Failed to delete hiring source");
      }
    }
  };

  const onSubmit = async (data: any) => {
    console.log("Submitting data:", data);
    try {
      if (selectedSource) {
        await updateMutation.mutateAsync({
          id: selectedSource._id,
          data,
        });
        toast.success("Hiring source updated successfully");
      } else {
        await createMutation.mutateAsync({
          source:data?.source,
          organisationId: "695131b8c139647c5a9931af",
        });
        toast.success("Hiring source created successfully");
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
          <h2 className="text-3xl font-bold tracking-tight">Hiring Sources</h2>
          <p className="text-muted-foreground">
            Manage hiring sources for your organization
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Hiring Sources</CardTitle>
              <CardDescription>
                View and manage all hiring sources
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
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
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hiringSources?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No hiring sources found
                    </TableCell>
                  </TableRow>
                ) : (
                  hiringSources?.data?.map((source: any) => (
                    <TableRow key={source._id}>
                      <TableCell className="font-medium">{source.source}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(source)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(source._id)}
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
              {selectedSource ? "Edit Hiring Source" : "Create Hiring Source"}
            </DialogTitle>
            <DialogDescription>
              {selectedSource
                ? "Update hiring source details"
                : "Add a new hiring source to your organization"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">
                Source <span className="text-red-500">*</span>
              </Label>
              <Input
                id="source"
                placeholder="e.g., LinkedIn, Referral, Job Board"
                {...register("source", { required: true })}
              />
            </div>

           

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedSource ? "Update" : "Create"}
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
              This action cannot be undone. This will permanently delete the hiring source
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSourceToDelete(null)}>
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
