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
import { useCreateDepartment, useUpdateDepartment } from "@/hooks/use-departments";
import { toast } from "sonner";
import { X } from "lucide-react";

interface DepartmentDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department?: any;
}

interface DepartmentFormData {
    name: string;
    code: string;
    organisationId: string;
    isActive: boolean;
}

export function DepartmentDrawer({
    open,
    onOpenChange,
    department,
}: DepartmentDrawerProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<DepartmentFormData>({
        defaultValues: {
            name: "",
            code: "",
            organisationId: "676cbe94c5f16f08e14f81cd", // Replace with actual org ID from context
            isActive: true,
        },
    });

    const createMutation = useCreateDepartment();
    const updateMutation = useUpdateDepartment();

    const isActive = watch("isActive");

    useEffect(() => {
        if (department) {
            reset({
                name: department.name || "",
                code: department.code || "",
                organisationId: department.organisationId || "676cbe94c5f16f08e14f81cd",
                isActive: department.isActive ?? true,
            });
        } else {
            reset({
                name: "",
                code: "",
                organisationId: "676cbe94c5f16f08e14f81cd",
                isActive: true,
            });
        }
    }, [department, reset]);

    useEffect(() => {
        if (!open) {
            reset({
                name: "",
                code: "",
                organisationId: "676cbe94c5f16f08e14f81cd",
                isActive: true,
            });
        }
    }, [open, reset]);

    const onSubmit = async (data: DepartmentFormData) => {
        try {
            if (department) {
                await updateMutation.mutateAsync({
                    id: department._id,
                    data,
                });
                toast.success("Department updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Department created successfully");
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
                                {department ? "Edit Department" : "Create Department"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {department
                                    ? "Update department details"
                                    : "Add a new department to your organization"}
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
                        {/* Department Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Department Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter department name"
                                {...register("name", { required: true })}
                            />
                        </div>

                        {/* Department Code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Department Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                placeholder="Enter department code (e.g., DEPT001)"
                                {...register("code", { required: true })}
                            />
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
                            {department ? "Update Department" : "Create Department"}
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
