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
import { Switch } from "@workspace/ui/components/switch";
import { useCreateDesignation, useUpdateDesignation } from "@/hooks/use-designations";
import { toast } from "sonner";
import { X } from "lucide-react";

interface DesignationDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    designation?: any;
}

interface DesignationFormData {
    name: string;
    level: number;
    organisationId: string;
    isActive: boolean;
}

export function DesignationDrawer({
    open,
    onOpenChange,
    designation,
}: DesignationDrawerProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<DesignationFormData>({
        defaultValues: {
            name: "",
            level: 1,
            organisationId: "676cbe94c5f16f08e14f81cd", // Replace with actual org ID from context
            isActive: true,
        },
    });

    const createMutation = useCreateDesignation();
    const updateMutation = useUpdateDesignation();

    const isActive = watch("isActive");

    useEffect(() => {
        if (designation) {
            reset({
                name: designation.name || "",
                level: designation.level || 1,
                organisationId: designation.organisationId || "676cbe94c5f16f08e14f81cd",
                isActive: designation.isActive ?? true,
            });
        } else {
            reset({
                name: "",
                level: 1,
                organisationId: "676cbe94c5f16f08e14f81cd",
                isActive: true,
            });
        }
    }, [designation, reset]);

    useEffect(() => {
        if (!open) {
            reset({
                name: "",
                level: 1,
                organisationId: "676cbe94c5f16f08e14f81cd",
                isActive: true,
            });
        }
    }, [open, reset]);

    const onSubmit = async (data: DesignationFormData) => {
        try {
            if (designation) {
                await updateMutation.mutateAsync({
                    id: designation._id,
                    data,
                });
                toast.success("Designation updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Designation created successfully");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-[500px] rounded-none">
                <DrawerHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle>
                                {designation ? "Edit Designation" : "Create Designation"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {designation
                                    ? "Update designation details"
                                    : "Add a new designation to your organization"}
                            </DrawerDescription>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon">
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Designation Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Designation Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter designation name"
                                {...register("name", { required: true })}
                            />
                        </div>

                        {/* Level */}
                        <div className="space-y-2">
                            <Label htmlFor="level">
                                Level <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="level"
                                type="number"
                                min="1"
                                placeholder="Enter level (1 is highest)"
                                {...register("level", { 
                                    required: true,
                                    valueAsNumber: true,
                                    min: 1
                                })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Lower numbers indicate higher positions (e.g., 1 = CEO, 2 = VP)
                            </p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Active</Label>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setValue("isActive", checked)}
                            />
                        </div>
                    </div>

                    <DrawerFooter className="border-t">
                        <Button type="submit" className="w-full">
                            {designation ? "Update Designation" : "Create Designation"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
