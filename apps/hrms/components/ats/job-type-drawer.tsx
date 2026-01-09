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
import { useCreateJobType, useUpdateJobType } from "@/hooks/ats/use-job-types";
import { toast } from "sonner";
import { X } from "lucide-react";

interface JobTypeDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobType?: any;
    organisationId: string;
}

interface JobTypeFormData {
    type: string;
    organisationId: string;
}

export function JobTypeDrawer({
    open,
    onOpenChange,
    jobType,
    organisationId,
}: JobTypeDrawerProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<JobTypeFormData>({
        defaultValues: {
            type: "",
            organisationId: organisationId,
        },
    });

    const createMutation = useCreateJobType();
    const updateMutation = useUpdateJobType();

    useEffect(() => {
        if (jobType) {
            reset({
                type: jobType.type || "",
                organisationId: jobType.organisationId || organisationId,
            });
        } else {
            reset({
                type: "",
                organisationId: organisationId,
            });
        }
    }, [jobType, reset, organisationId]);

    const onSubmit = async (data: JobTypeFormData) => {
        try {
            if (jobType) {
                await updateMutation.mutateAsync({
                    id: jobType._id,
                    data,
                });
                toast.success("Job Type updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Job Type created successfully");
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
                        {jobType ? "Edit Job Type" : "Add Job Type"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {jobType
                            ? "Update the job type details below"
                            : "Fill in the details to create a new job type"}
                    </DrawerDescription>
                    <DrawerClose className="absolute right-4 top-4">
                        <X className="h-4 w-4" />
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Job Type *</Label>
                        <Input
                            id="type"
                            {...register("type", {
                                required: "Job type is required",
                            })}
                            placeholder="e.g., Full-time, Part-time, Contract"
                        />
                        {errors.type && (
                            <p className="text-sm text-red-500">{errors.type.message}</p>
                        )}
                    </div>

                    <DrawerFooter className="px-0">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : jobType
                                ? "Update Job Type"
                                : "Create Job Type"}
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
