"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui/components/card";

interface ResellerApp {
  _id: string;
  appType: string;
  host: string;
  isActive: boolean;
}

interface Reseller {
  _id: string;
  name: string;
  contactEmail?: string;
  apps: ResellerApp[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ResellersPage() {
  const router = useRouter();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [appTypeFilter, setAppTypeFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
  });

  const fetchResellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (appTypeFilter) params.append("appType", appTypeFilter);

      const response = await fetch(`/api/resellers?${params}`);
      const result = await response.json();

      if (result.success) {
        setResellers(result.data);
        setPagination(result.pagination);
      }
    } catch {
      toast.error("Failed to fetch resellers");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, appTypeFilter]);

  useEffect(() => {
    fetchResellers();
  }, [fetchResellers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Reseller created successfully");
        setIsDialogOpen(false);
        setFormData({ name: "", contactEmail: "" });
        fetchResellers();
      } else {
        toast.error(result.error || "Failed to create reseller");
      }
    } catch {
      toast.error("Failed to create reseller");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/resellers/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Reseller deleted successfully");
        fetchResellers();
      } else {
        toast.error(result.error || "Failed to delete reseller");
      }
    } catch {
      toast.error("Failed to delete reseller");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (value: string) => {
    setAppTypeFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getAppTypeColor = (appType: string) => {
    switch (appType) {
      case "hrms":
        return "bg-blue-500";
      case "social-media":
        return "bg-purple-500";
      case "backend-assist":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading && resellers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Resellers</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage resellers and their applications
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Reseller
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      Create Reseller
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Add a new reseller to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">
                          Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">
                          Contact Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.contactEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contactEmail: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm">
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resellers..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 text-sm h-9"
                />
              </div>
              <Select value={appTypeFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by app" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  <SelectItem value="hrms">HRMS</SelectItem>
                  <SelectItem value="social-media">Social Media</SelectItem>
                  <SelectItem value="backend-assist">
                    Backend Assist
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Apps</TableHead>
                <TableHead className="text-xs">Hosts</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resellers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    No resellers found
                  </TableCell>
                </TableRow>
              ) : (
                resellers.map((reseller) => (
                  <TableRow
                    key={reseller._id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/master/resellers/${reseller._id}`)
                    }
                  >
                    <TableCell className="font-medium text-sm">
                      {reseller.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reseller.contactEmail || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {reseller.apps.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No apps
                          </span>
                        ) : (
                          reseller.apps.map((app) => (
                            <Badge
                              key={app._id}
                              className={`${getAppTypeColor(app.appType)} text-white text-[10px] px-2 py-0.5`}
                            >
                              {app.appType}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {reseller.apps.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        ) : (
                          reseller.apps.slice(0, 2).map((app) => (
                            <span
                              key={app._id}
                              className="text-xs truncate max-w-xs"
                            >
                              {app.host}
                            </span>
                          ))
                        )}
                        {reseller.apps.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{reseller.apps.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/master/resellers/${reseller._id}`);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Dialog
                          open={deleteId === reseller._id}
                          onOpenChange={(open) =>
                            setDeleteId(open ? reseller._id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle className="text-lg">
                                Delete Reseller
                              </DialogTitle>
                              <DialogDescription className="text-sm">
                                Are you sure you want to delete{" "}
                                {reseller.name}? This will also delete all
                                associated apps.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setDeleteId(null)}
                                size="sm"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(reseller._id)}
                                size="sm"
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
