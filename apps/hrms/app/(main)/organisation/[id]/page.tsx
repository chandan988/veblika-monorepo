"use client";

import { useParams } from "next/navigation";
import { useOrganisation } from "@/hooks/use-organisations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Calendar,
  Settings,
  CreditCard,
} from "lucide-react";
import { Separator } from "@workspace/ui/components/separator";

export default function OrganisationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  console.log("OrganisationDetailPage ID:", id);
  const { data, isLoading } = useOrganisation(id);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <p>Organisation not found</p>
      </div>
    );
  }

  const org = data.data;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{org.name}</h2>
            <p className="text-muted-foreground">
              {org.displayName || org.orgType}
            </p>
          </div>
        </div>
        <Badge variant={org.isActive ? "default" : "secondary"}>
          {org.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Organisation details and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{org.email}</p>
              </div>
            </div>
            {org.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{org.phone}</p>
                </div>
              </div>
            )}
            {org.alternatePhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Alternate Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {org.alternatePhone}
                  </p>
                </div>
              </div>
            )}
            {org.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {org.website}
                  </a>
                </div>
              </div>
            )}
            <Separator />
            {org.industry && (
              <div>
                <p className="text-sm font-medium">Industry</p>
                <p className="text-sm text-muted-foreground">{org.industry}</p>
              </div>
            )}
            {org.size && (
              <div>
                <p className="text-sm font-medium">Company Size</p>
                <p className="text-sm text-muted-foreground">{org.size}</p>
              </div>
            )}
            {org.taxId && (
              <div>
                <p className="text-sm font-medium">Tax ID</p>
                <p className="text-sm text-muted-foreground">{org.taxId}</p>
              </div>
            )}
            {org.registrationNumber && (
              <div>
                <p className="text-sm font-medium">Registration Number</p>
                <p className="text-sm text-muted-foreground">
                  {org.registrationNumber}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>Physical and billing addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {org.address && (
              <div>
                <p className="text-sm font-medium mb-2">Physical Address</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  {org.address.street && <p>{org.address.street}</p>}
                  <p>
                    {[
                      org.address.city,
                      org.address.state,
                      org.address.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {org.address.country && <p>{org.address.country}</p>}
                </div>
              </div>
            )}
            {org.billingAddress && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Billing Address</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {org.billingAddress.street && (
                      <p>{org.billingAddress.street}</p>
                    )}
                    <p>
                      {[
                        org.billingAddress.city,
                        org.billingAddress.state,
                        org.billingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {org.billingAddress.country && (
                      <p>{org.billingAddress.country}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Person
            </CardTitle>
            <CardDescription>Primary contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {org.contactPerson?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {org.contactPerson?.email}
              </p>
            </div>
            {org.contactPerson?.phone && (
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {org.contactPerson.phone}
                </p>
              </div>
            )}
            {org.contactPerson?.designation && (
              <div>
                <p className="text-sm font-medium">Designation</p>
                <p className="text-sm text-muted-foreground">
                  {org.contactPerson.designation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>Organisation preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Currency</p>
                <p className="text-sm text-muted-foreground">
                  {org.currency || "USD"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Timezone</p>
                <p className="text-sm text-muted-foreground">
                  {org.timezone || "UTC"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date Format</p>
                <p className="text-sm text-muted-foreground">
                  {org.dateFormat || "DD/MM/YYYY"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Time Format</p>
                <p className="text-sm text-muted-foreground">
                  {org.timeFormat || "24h"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Working Hours Per Day</p>
              <p className="text-sm text-muted-foreground">
                {org.workingHoursPerDay || 8} hours
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Created</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(org.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Last Updated</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(org.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
