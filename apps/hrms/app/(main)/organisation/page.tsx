"use client";

import { useState } from "react";
import { Plus, Search, Building2, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
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
import { Badge } from "@workspace/ui/components/badge";
import { OrganisationDrawer } from "@/components/organisation/organisation-drawer";
import { useOrganisations } from "@/hooks/use-organisations";
import { toast } from "sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";

export default function OrganisationPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { organisations, isLoading, deleteOrganisation } = useOrganisations({
    page,
    search,
  });

  const handleEdit = (org: any) => {
    setSelectedOrg(org);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this organisation?")) {
      try {
        await deleteOrganisation(id);
        toast.success("Organisation deleted successfully");
      } catch (error) {
        toast.error("Failed to delete organisation");
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedOrg(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organisations</h2>
          <p className="text-muted-foreground">
            Manage your organisation settings and information
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organisation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Organisations</CardTitle>
              <CardDescription>
                View and manage all registered organisations
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organisations..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organisations?.data?.map((org: any) => (
                  <TableRow key={org._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt={org.name}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {org.timeZone || "Asia/Kolkata"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{org.industry || "-"}</TableCell>
                    <TableCell>
                      {org.website ? (
                        <a 
                          href={org.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{org.country || "India"}</TableCell>
                    <TableCell>{org.settings?.currency || "INR"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={org.isActive ? "default" : "secondary"}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(`/organisation/${org._id}`, "_blank")}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(org)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(org._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && organisations?.data?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No organisations found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first organisation
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Organisation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <OrganisationDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        organisation={selectedOrg}
      />
    </div>
  );
}
