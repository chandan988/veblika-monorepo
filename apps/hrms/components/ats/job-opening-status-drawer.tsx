"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useCreateJobOpeningStatus, useUpdateJobOpeningStatus } from "@/hooks/ats/use-job-opening-statuses";
import { toast } from "sonner";
import { X } from "lucide-react";

interface JobOpeningStatusDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobOpeningStatus?: any;
    organisationId: string;
}

interface JobOpeningStatusFormData {
    status: string;
    organisationId: string;
}

export function JobOpeningStatusDrawer({
    open,
    onOpenChange,
    jobOpeningStatus,
    organisationId,
}: JobOpeningStatusDrawerProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<JobOpeningStatusFormData>({
        defaultValues: {
            status: "",
            organisationId: organisationId,
        },
    });

    const createMutation = useCreateJobOpeningStatus();
    const updateMutation = useUpdateJobOpeningStatus();

    useEffect(() => {
        if (jobOpeningStatus) {
            reset({
                status: jobOpeningStatus.status || "",
                organisationId: jobOpeningStatus.organisationId || organisationId,
            });
        } else {
            reset({
                status: "",
                organisationId: organisationId,
            });
        }
    }, [jobOpeningStatus, reset, organisationId]);

    const onSubmit = async (data: JobOpeningStatusFormData) => {
        try {
            if (jobOpeningStatus) {
                await updateMutation.mutateAsync({
                    id: jobOpeningStatus._id,
                    data,
                });
                toast.success("Job Opening Status updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Job Opening Status created successfully");
            }
            onOpenChange(false);
            reset();
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>
                        {jobOpeningStatus ? "Edit Job Opening Status" : "Add Job Opening Status"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {jobOpeningStatus
                            ? "Update the job opening status details below"
                            : "Fill in the details to create a new job opening status"}
                    </DrawerDescription>
                    <DrawerClose className="absolute right-4 top-4">
                        <X className="h-4 w-4" />
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status Name *</Label>
                        <Input
                            id="status"
                            {...register("status", {
                                required: "Status name is required",
                            })}
                            placeholder="e.g., Open, Closed, On Hold"
                        />
                        {errors.status && (
                            <p className="text-sm text-red-500">{errors.status.message}</p>
                        )}
                    </div>

                    <DrawerFooter className="px-0">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : jobOpeningStatus
                                ? "Update Status"
                                : "Create Status"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
