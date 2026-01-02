"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, MapPin, Briefcase, Calendar } from "lucide-react";
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
import { Badge } from "@workspace/ui/components/badge";
import { JobOpeningDialog } from "@/components/ats/job-opening-dialog";
import { useJobOpenings } from "@/hooks/use-job-openings";
import { toast } from "sonner";

export default function JobOpeningPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJobOpening, setSelectedJobOpening] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobOpeningToDelete, setJobOpeningToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { jobOpenings, isLoading, deleteJobOpening } = useJobOpenings({
    page,
    search,
    organisationId: "695131b8c139647c5a9931af",
  });

  const handleEdit = (jobOpening: any) => {
    setSelectedJobOpening(jobOpening);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setJobOpeningToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobOpeningToDelete) {
      try {
        await deleteJobOpening(jobOpeningToDelete);
        toast.success("Job opening deleted successfully");
        setDeleteDialogOpen(false);
        setJobOpeningToDelete(null);
      } catch (error) {
        toast.error("Failed to delete job opening");
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedJobOpening(null);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("open")) return "default";
    if (statusLower.includes("closed") || statusLower.includes("filled")) return "secondary";
    if (statusLower.includes("on hold")) return "outline";
    return "default";
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Openings</h2>
          <p className="text-muted-foreground">
            Manage and track all job openings in your organization
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Job Opening
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Openings</CardTitle>
          <CardDescription>
            View and manage all active and past job openings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title, industry, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading job openings...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!jobOpenings?.data || jobOpenings.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No job openings found</p>
                        <Button variant="outline" onClick={handleCreateNew} className="mt-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first job opening
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobOpenings.data.map((jobOpening: any) => (
                    <TableRow key={jobOpening._id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{jobOpening.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {jobOpening.workExperience}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{jobOpening.industry}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{jobOpening.jobType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {jobOpening.isRemote ? (
                            <Badge variant="secondary" className="text-xs">Remote</Badge>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {jobOpening.city || jobOpening.state || jobOpening.country || "Not specified"}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{jobOpening.noOfPositions}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeColor(jobOpening.jobOpeningStatus)}>
                          {jobOpening.jobOpeningStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(jobOpening.targetDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(jobOpening)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(jobOpening._id)}
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

          {jobOpenings?.pagination && jobOpenings.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, jobOpenings.pagination.total)} of {jobOpenings.pagination.total} job openings
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === jobOpenings.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <JobOpeningDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        jobOpening={selectedJobOpening}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job opening
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobOpeningToDelete(null)}>
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
