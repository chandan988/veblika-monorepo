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
import { useCreateWorkExperience, useUpdateWorkExperience } from "@/hooks/ats/use-work-experiences";
import { toast } from "sonner";
import { X } from "lucide-react";

interface WorkExperienceDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workExperience?: any;
    organisationId: string;
}

interface WorkExperienceFormData {
    experience: string;
    organisationId: string;
}

export function WorkExperienceDrawer({
    open,
    onOpenChange,
    workExperience,
    organisationId,
}: WorkExperienceDrawerProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkExperienceFormData>({
        defaultValues: {
            experience: "",
            organisationId: organisationId,
        },
    });

    const createMutation = useCreateWorkExperience();
    const updateMutation = useUpdateWorkExperience();

    useEffect(() => {
        if (workExperience) {
            reset({
                experience: workExperience.experience || "",
                organisationId: workExperience.organisationId || organisationId,
            });
        } else {
            reset({
                experience: "",
                organisationId: organisationId,
            });
        }
    }, [workExperience, reset, organisationId]);

    const onSubmit = async (data: WorkExperienceFormData) => {
        try {
            if (workExperience) {
                await updateMutation.mutateAsync({
                    id: workExperience._id,
                    data,
                });
                toast.success("Work Experience updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Work Experience created successfully");
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
                        {workExperience ? "Edit Work Experience" : "Add Work Experience"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {workExperience
                            ? "Update the work experience details below"
                            : "Fill in the details to create a new work experience"}
                    </DrawerDescription>
                    <DrawerClose className="absolute right-4 top-4">
                        <X className="h-4 w-4" />
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="experience">Experience *</Label>
                        <Input
                            id="experience"
                            {...register("experience", {
                                required: "Experience is required",
                            })}
                            placeholder="e.g., 0-1 years, 2-5 years, 5+ years"
                        />
                        {errors.experience && (
                            <p className="text-sm text-red-500">{errors.experience.message}</p>
                        )}
                    </div>

                    <DrawerFooter className="px-0">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : workExperience
                                ? "Update Work Experience"
                                : "Create Work Experience"}
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
