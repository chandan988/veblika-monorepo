"use client";

import { useState } from "react";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact
} from "@/hooks/use-contacts";
import { useSession } from "@/hooks/useSession";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Search, User, Mail, Phone, X, Edit, Trash, Copy, Calendar, ArrowUpDown } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
import { Label } from "@workspace/ui/components/label";
import { useToast } from "@workspace/ui/components/use-toast";
import { useOrganisationStore } from "@/stores/organisation-store";

interface Contact {
  _id: string;
  orgId: string;
  name?: string;
  email: string;
  phone: string;
  slackId?: string;
  whatsappId?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  search: string;
  source: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  slackId: string;
  whatsappId: string;
  source: string;
}

export default function ContactsPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { toast } = useToast();
  const { data: sessionData } = useSession();
  const { activeOrganisation } = useOrganisationStore();
  const orgId = activeOrganisation?._id || "";

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    source: "all",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: contactsData, isLoading } = useContacts({
    orgId,
    search: filters.search,
    limit: 50,
  });

  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    slackId: "",
    whatsappId: "",
    source: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<ContactFormData>>({});

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Filter and sort contacts
  const getFilteredContacts = () => {
    let filtered = contactsData?.data || [];

    // Filter by source
    if (filters.source !== "all") {
      filtered = filtered.filter((contact: Contact) =>
        contact.source?.toLowerCase() === filters.source.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter((contact: Contact) =>
        new Date(contact.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter((contact: Contact) =>
        new Date(contact.createdAt) <= new Date(filters.dateTo)
      );
    }

    // Sort contacts
    filtered = [...filtered].sort((a: Contact, b: Contact) => {
      let aVal, bVal;

      switch (filters.sortBy) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "email":
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case "createdAt":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return filters.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const contacts = getFilteredContacts();

  const validateForm = (): boolean => {
    const errors: Partial<ContactFormData> = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      slackId: "",
      whatsappId: "",
      source: "",
    });
    setFormErrors({});
    setSelectedContact(null);
  };

  const handleAddContact = async () => {
    if (!validateForm()) return;

    try {
      await createContactMutation.mutateAsync({
        orgId,
        ...formData,
      });

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add contact",
        variant: "destructive",
      });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name || "",
      email: contact.email,
      phone: contact.phone,
      slackId: contact.slackId || "",
      whatsappId: contact.whatsappId || "",
      source: contact.source || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!validateForm() || !selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact._id,
        data: formData,
      });

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      resetForm();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      await deleteContactMutation.mutateAsync(selectedContact._id);

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      setSelectedContact(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied",
      description: "Email copied to clipboard",
    });
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      source: "all",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const scrollToLetter = (letter: string) => {
    const firstContact = contacts.find((c: Contact) =>
      c.name?.toUpperCase().startsWith(letter)
    );
    if (firstContact) {
      const element = document.getElementById(`contact-${firstContact._id}`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar - Filters */}
      {showFilters && (
        <div className="w-64 border-r bg-card p-4 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs"
              >
                Reset
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Name, email, phone, ID..."
                    className="pl-9 h-9"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Source</label>
                <Select
                  value={filters.source}
                  onValueChange={(value) => setFilters({ ...filters, source: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="website">Webchat</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Date From</label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Date To</label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Sort Order</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: "asc" | "desc") =>
                    setFilters({ ...filters, sortOrder: value })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>Total Contacts:</span>
                  <span className="font-medium">{contactsData?.pagination?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered:</span>
                  <span className="font-medium">{contacts.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Contacts</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add Contact
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your customer contacts and relationships
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </Card>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No contacts found
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact: Contact) => (
                  <Card
                    key={contact._id}
                    id={`contact-${contact._id}`}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{contact.name || "Unknown"}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {contact.source && (
                          <Badge variant="secondary" className="capitalize">
                            {contact.source}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyEmail(contact.email)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {contactsData?.pagination && (
              <div className="text-xs text-muted-foreground text-center mt-6">
                Showing {contacts.length} of {contactsData.pagination.total} contacts
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Alphabet Index */}
      <div className="w-12 border-l bg-card flex flex-col items-center py-4 gap-1 overflow-y-auto">
        <button
          className="text-xs font-medium text-muted-foreground hover:text-foreground py-1"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          All
        </button>
        {alphabet.map((letter) => (
          <button
            key={letter}
            className="text-xs font-medium text-muted-foreground hover:text-foreground py-1 hover:bg-accent px-2 rounded transition-colors"
            onClick={() => scrollToLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your organization. Email and phone are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-xs text-red-500">{formErrors.phone}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slackId">Slack ID</Label>
              <Input
                id="slackId"
                placeholder="U01234ABCD"
                value={formData.slackId}
                onChange={(e) => handleInputChange("slackId", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsappId">WhatsApp ID</Label>
              <Input
                id="whatsappId"
                placeholder="+1234567890"
                value={formData.whatsappId}
                onChange={(e) => handleInputChange("whatsappId", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleInputChange("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gmail">Gmail</SelectItem>
                  <SelectItem value="Slack">Slack</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(false);
              }}
              disabled={createContactMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={createContactMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {createContactMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information. Email and phone are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-xs text-red-500">{formErrors.phone}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-slackId">Slack ID</Label>
              <Input
                id="edit-slackId"
                placeholder="U01234ABCD"
                value={formData.slackId}
                onChange={(e) => handleInputChange("slackId", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-whatsappId">WhatsApp ID</Label>
              <Input
                id="edit-whatsappId"
                placeholder="+1234567890"
                value={formData.whatsappId}
                onChange={(e) => handleInputChange("whatsappId", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleInputChange("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gmail">Gmail</SelectItem>
                  <SelectItem value="Slack">Slack</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
              }}
              disabled={updateContactMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContact}
              disabled={updateContactMutation.isPending}
            >
              {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact "{selectedContact?.name || selectedContact?.email}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedContact(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
