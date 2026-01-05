"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Badge } from "@workspace/ui/components/badge";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";

interface ResellerApp {
  _id: string;
  appType: string;
  host: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
  createdAt: string;
}

interface Reseller {
  _id: string;
  name: string;
  contactEmail?: string;
  apps: ResellerApp[];
  createdAt: string;
}

export default function ResellerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingReseller, setIsEditingReseller] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);

  const [resellerForm, setResellerForm] = useState({
    name: "",
    contactEmail: "",
  });

  const [appForm, setAppForm] = useState({
    appType: "",
    host: "",
    isActive: true,
  });

  const [editAppForm, setEditAppForm] = useState<{
    appType: string;
    host: string;
    isActive: boolean;
  } | null>(null);

  const fetchReseller = useCallback(async () => {
    try {
      const response = await fetch(`/api/resellers/${id}`);
      const result = await response.json();
      if (result.success) {
        setReseller(result.data);
        setResellerForm({
          name: result.data.name,
          contactEmail: result.data.contactEmail || "",
        });
      } else {
        toast.error("Reseller not found");
        router.push("/master/resellers");
      }
    } catch {
      toast.error("Failed to fetch reseller");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchReseller();
  }, [fetchReseller]);

  const handleUpdateReseller = async () => {
    try {
      const response = await fetch(`/api/resellers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resellerForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Reseller updated successfully");
        setIsEditingReseller(false);
        fetchReseller();
      } else {
        toast.error(result.error || "Failed to update reseller");
      }
    } catch {
      toast.error("Failed to update reseller");
    }
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/resellers/${id}/apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("App added successfully");
        setIsAddAppOpen(false);
        setAppForm({ appType: "", host: "", isActive: true });
        fetchReseller();
      } else {
        toast.error(result.error || "Failed to add app");
      }
    } catch {
      toast.error("Failed to add app");
    }
  };

  const handleUpdateApp = async (appId: string) => {
    if (!editAppForm) return;

    try {
      const response = await fetch(`/api/resellers/${id}/apps/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAppForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("App updated successfully");
        setEditingApp(null);
        setEditAppForm(null);
        fetchReseller();
      } else {
        toast.error(result.error || "Failed to update app");
      }
    } catch {
      toast.error("Failed to update app");
    }
  };

  const handleDeleteApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/resellers/${id}/apps/${appId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("App deleted successfully");
        fetchReseller();
      } else {
        toast.error(result.error || "Failed to delete app");
      }
    } catch {
      toast.error("Failed to delete app");
    } finally {
      setDeleteAppId(null);
    }
  };

  const startEditingApp = (app: ResellerApp) => {
    setEditingApp(app._id);
    setEditAppForm({
      appType: app.appType,
      host: app.host,
      isActive: app.isActive,
    });
  };

  const cancelEditingApp = () => {
    setEditingApp(null);
    setEditAppForm(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!reseller) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/master/resellers")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Reseller Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Reseller Details</CardTitle>
              <CardDescription className="text-sm">
                Manage reseller information
              </CardDescription>
            </div>
            {!isEditingReseller ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingReseller(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdateReseller}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingReseller(false);
                    setResellerForm({
                      name: reseller.name,
                      contactEmail: reseller.contactEmail || "",
                    });
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingReseller ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Name
                </Label>
                <Input
                  id="name"
                  value={resellerForm.name}
                  onChange={(e) =>
                    setResellerForm({ ...resellerForm, name: e.target.value })
                  }
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
                  value={resellerForm.contactEmail}
                  onChange={(e) =>
                    setResellerForm({
                      ...resellerForm,
                      contactEmail: e.target.value,
                    })
                  }
                  className="text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Name:</span>
                <p className="text-sm font-medium">{reseller.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Contact:</span>
                <p className="text-sm">{reseller.contactEmail || "-"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apps Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Apps</CardTitle>
              <CardDescription className="text-sm">
                Manage apps for this reseller
              </CardDescription>
            </div>
            <Dialog open={isAddAppOpen} onOpenChange={setIsAddAppOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add App
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-lg">Add App</DialogTitle>
                  <DialogDescription className="text-sm">
                    Add a new app for this reseller
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddApp}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="appType" className="text-sm">
                        App Type
                      </Label>
                      <Select
                        value={appForm.appType}
                        onValueChange={(value) =>
                          setAppForm({ ...appForm, appType: value })
                        }
                        required
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select app type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hrms">HRMS</SelectItem>
                          <SelectItem value="social-media">
                            Social Media
                          </SelectItem>
                          <SelectItem value="backend-assist">
                            Backend Assist
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="host" className="text-sm">
                        Host
                      </Label>
                      <Input
                        id="host"
                        placeholder="example.com"
                        value={appForm.host}
                        onChange={(e) =>
                          setAppForm({ ...appForm, host: e.target.value })
                        }
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={appForm.isActive}
                        onCheckedChange={(checked) =>
                          setAppForm({ ...appForm, isActive: checked })
                        }
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        Active
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">App Type</TableHead>
                <TableHead className="text-xs">Host</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reseller.apps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No apps found
                  </TableCell>
                </TableRow>
              ) : (
                reseller.apps.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      {editingApp === app._id && editAppForm ? (
                        <Select
                          value={editAppForm.appType}
                          onValueChange={(value) =>
                            setEditAppForm({ ...editAppForm, appType: value })
                          }
                        >
                          <SelectTrigger className="text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hrms">HRMS</SelectItem>
                            <SelectItem value="social-media">
                              Social Media
                            </SelectItem>
                            <SelectItem value="backend-assist">
                              Backend Assist
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={`${getAppTypeColor(app.appType)} text-white text-xs`}
                        >
                          {app.appType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app._id && editAppForm ? (
                        <Input
                          value={editAppForm.host}
                          onChange={(e) =>
                            setEditAppForm({
                              ...editAppForm,
                              host: e.target.value,
                            })
                          }
                          className="text-sm h-8"
                        />
                      ) : (
                        <span className="text-sm">{app.host}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingApp === app._id && editAppForm ? (
                        <Switch
                          checked={editAppForm.isActive}
                          onCheckedChange={(checked) =>
                            setEditAppForm({ ...editAppForm, isActive: checked })
                          }
                        />
                      ) : (
                        <Badge
                          variant={app.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {app.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingApp === app._id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateApp(app._id)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingApp}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingApp(app)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Dialog
                            open={deleteAppId === app._id}
                            onOpenChange={(open) =>
                              setDeleteAppId(open ? app._id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="text-lg">
                                  Confirm Delete
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                  Are you sure you want to delete this app?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setDeleteAppId(null)}
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteApp(app._id)}
                                  size="sm"
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
