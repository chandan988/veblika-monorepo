"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Switch } from "@workspace/ui/components/switch";
import { useCreateOrganisation, useUpdateOrganisation } from "@/hooks/use-organisations";
import { toast } from "sonner";

interface OrganisationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation?: any;
}

export function OrganisationDialog({
  open,
  onOpenChange,
  organisation,
}: OrganisationDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      displayName: "",
      email: "",
      phone: "",
      alternatePhone: "",
      website: "",
      logo: "",
      orgType: "",
      industry: "",
      size: "",
      taxId: "",
      registrationNumber: "",
      "address.street": "",
      "address.city": "",
      "address.state": "",
      "address.country": "",
      "address.postalCode": "",
      "billingAddress.street": "",
      "billingAddress.city": "",
      "billingAddress.state": "",
      "billingAddress.country": "",
      "billingAddress.postalCode": "",
      "contactPerson.name": "",
      "contactPerson.email": "",
      "contactPerson.phone": "",
      "contactPerson.designation": "",
      currency: "USD",
      timezone: "UTC",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      workingHoursPerDay: 8,
      isActive: true,
    },
  });

  const createMutation = useCreateOrganisation();
  const updateMutation = useUpdateOrganisation();

  useEffect(() => {
    if (organisation) {
      reset({
        name: organisation.name || "",
        displayName: organisation.displayName || "",
        email: organisation.email || "",
        phone: organisation.phone || "",
        alternatePhone: organisation.alternatePhone || "",
        website: organisation.website || "",
        logo: organisation.logo || "",
        orgType: organisation.orgType || "",
        industry: organisation.industry || "",
        size: organisation.size || "",
        taxId: organisation.taxId || "",
        registrationNumber: organisation.registrationNumber || "",
        "address.street": organisation.address?.street || "",
        "address.city": organisation.address?.city || "",
        "address.state": organisation.address?.state || "",
        "address.country": organisation.address?.country || "",
        "address.postalCode": organisation.address?.postalCode || "",
        "billingAddress.street": organisation.billingAddress?.street || "",
        "billingAddress.city": organisation.billingAddress?.city || "",
        "billingAddress.state": organisation.billingAddress?.state || "",
        "billingAddress.country": organisation.billingAddress?.country || "",
        "billingAddress.postalCode": organisation.billingAddress?.postalCode || "",
        "contactPerson.name": organisation.contactPerson?.name || "",
        "contactPerson.email": organisation.contactPerson?.email || "",
        "contactPerson.phone": organisation.contactPerson?.phone || "",
        "contactPerson.designation": organisation.contactPerson?.designation || "",
        currency: organisation.currency || "USD",
        timezone: organisation.timezone || "UTC",
        dateFormat: organisation.dateFormat || "DD/MM/YYYY",
        timeFormat: organisation.timeFormat || "24h",
        workingHoursPerDay: organisation.workingHoursPerDay || 8,
        isActive: organisation.isActive ?? true,
      });
    } else {
      reset();
    }
  }, [organisation, reset]);

  const onSubmit = async (data: any) => {
    try {
      // Transform flat data to nested structure
      const payload = {
        name: data.name,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        website: data.website,
        logo: data.logo,
        orgType: data.orgType,
        industry: data.industry,
        size: data.size,
        taxId: data.taxId,
        registrationNumber: data.registrationNumber,
        address: {
          street: data["address.street"],
          city: data["address.city"],
          state: data["address.state"],
          country: data["address.country"],
          postalCode: data["address.postalCode"],
        },
        billingAddress: {
          street: data["billingAddress.street"],
          city: data["billingAddress.city"],
          state: data["billingAddress.state"],
          country: data["billingAddress.country"],
          postalCode: data["billingAddress.postalCode"],
        },
        contactPerson: {
          name: data["contactPerson.name"],
          email: data["contactPerson.email"],
          phone: data["contactPerson.phone"],
          designation: data["contactPerson.designation"],
        },
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        workingHoursPerDay: data.workingHoursPerDay,
        isActive: data.isActive,
      };

      if (organisation) {
        await updateMutation.mutateAsync({ id: organisation._id, data: payload });
        toast.success("Organisation updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Organisation created successfully");
      }

      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const isActive = watch("isActive");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {organisation ? "Edit Organisation" : "Create New Organisation"}
          </DialogTitle>
          <DialogDescription>
            {organisation
              ? "Update organisation details and settings"
              : "Add a new organisation to your system"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="contact">Contact Person</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organisation Name *</Label>
                  <Input id="name" {...register("name", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" {...register("displayName")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input id="alternatePhone" {...register("alternatePhone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...register("website")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgType">Organisation Type</Label>
                  <Input
                    id="orgType"
                    {...register("orgType")}
                    placeholder="e.g., Private, Public, Non-Profit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    {...register("industry")}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Input
                    id="size"
                    {...register("size")}
                    placeholder="e.g., 1-50, 51-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input id="taxId" {...register("taxId")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    {...register("registrationNumber")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" {...register("logo")} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active Organisation</Label>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-4">Physical Address</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.street">Street Address</Label>
                    <Textarea id="address.street" {...register("address.street")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.city">City</Label>
                      <Input id="address.city" {...register("address.city")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.state">State/Province</Label>
                      <Input id="address.state" {...register("address.state")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.country">Country</Label>
                      <Input id="address.country" {...register("address.country")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.postalCode">Postal Code</Label>
                      <Input
                        id="address.postalCode"
                        {...register("address.postalCode")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-semibold mb-4">Billing Address</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress.street">Street Address</Label>
                    <Textarea
                      id="billingAddress.street"
                      {...register("billingAddress.street")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress.city">City</Label>
                      <Input
                        id="billingAddress.city"
                        {...register("billingAddress.city")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress.state">State/Province</Label>
                      <Input
                        id="billingAddress.state"
                        {...register("billingAddress.state")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress.country">Country</Label>
                      <Input
                        id="billingAddress.country"
                        {...register("billingAddress.country")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress.postalCode">Postal Code</Label>
                      <Input
                        id="billingAddress.postalCode"
                        {...register("billingAddress.postalCode")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson.name">Contact Name *</Label>
                  <Input
                    id="contactPerson.name"
                    {...register("contactPerson.name", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson.email">Contact Email *</Label>
                  <Input
                    id="contactPerson.email"
                    type="email"
                    {...register("contactPerson.email", { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson.phone">Contact Phone</Label>
                  <Input
                    id="contactPerson.phone"
                    {...register("contactPerson.phone")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson.designation">Designation</Label>
                  <Input
                    id="contactPerson.designation"
                    {...register("contactPerson.designation")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" {...register("currency")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" {...register("timezone")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={watch("dateFormat")}
                    onValueChange={(value) => setValue("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={watch("timeFormat")}
                    onValueChange={(value) => setValue("timeFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hours</SelectItem>
                      <SelectItem value="24h">24 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHoursPerDay">Working Hours Per Day</Label>
                <Input
                  id="workingHoursPerDay"
                  type="number"
                  {...register("workingHoursPerDay")}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : organisation
                ? "Update Organisation"
                : "Create Organisation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
