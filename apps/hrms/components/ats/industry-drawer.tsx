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
import { useCreateIndustry, useUpdateIndustry } from "@/hooks/ats/use-industries";
import { toast } from "sonner";
import { X } from "lucide-react";

interface IndustryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    industry?: any;
    organisationId: string;
}

interface IndustryFormData {
    industry: string;
    organisationId: string;
}

export function IndustryDrawer({
    open,
    onOpenChange,
    industry,
    organisationId,
}: IndustryDrawerProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<IndustryFormData>({
        defaultValues: {
            industry: "",
            organisationId: organisationId,
        },
    });

    const createMutation = useCreateIndustry();
    const updateMutation = useUpdateIndustry();

    useEffect(() => {
        if (industry) {
            reset({
                industry: industry.industry || "",
                organisationId: industry.organisationId || organisationId,
            });
        } else {
            reset({
                industry: "",
                organisationId: organisationId,
            });
        }
    }, [industry, reset, organisationId]);

    const onSubmit = async (data: IndustryFormData) => {
        try {
            if (industry) {
                await updateMutation.mutateAsync({
                    id: industry._id,
                    data,
                });
                toast.success("Industry updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Industry created successfully");
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
                        {industry ? "Edit Industry" : "Add Industry"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {industry
                            ? "Update the industry details below"
                            : "Fill in the details to create a new industry"}
                    </DrawerDescription>
                    <DrawerClose className="absolute right-4 top-4">
                        <X className="h-4 w-4" />
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="industry">Industry Name *</Label>
                        <Input
                            id="industry"
                            {...register("industry", {
                                required: "Industry name is required",
                            })}
                            placeholder="e.g., Technology, Healthcare"
                        />
                        {errors.industry && (
                            <p className="text-sm text-red-500">{errors.industry.message}</p>
                        )}
                    </div>

                    <DrawerFooter className="px-0">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : industry
                                ? "Update Industry"
                                : "Create Industry"}
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
