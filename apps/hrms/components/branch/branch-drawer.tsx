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
import { useCreateBranch, useUpdateBranch } from "@/hooks/use-branches";
import { toast } from "sonner";
import { X } from "lucide-react";

interface BranchDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branch?: any;
}

interface BranchFormData {
    name: string;
    code: string;
    organisationId: string;
    isActive: boolean;
}

export function BranchDrawer({
    open,
    onOpenChange,
    branch,
}: BranchDrawerProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm<BranchFormData>({
        defaultValues: {
            name: "",
            code: "",
            organisationId: "676cbe94c5f16f08e14f81cd", // Replace with actual org ID from context
            isActive: true,
        },
    });

    const createMutation = useCreateBranch();
    const updateMutation = useUpdateBranch();

    const isActive = watch("isActive");

    useEffect(() => {
        if (branch) {
            reset({
                name: branch.name || "",
                code: branch.code || "",
                organisationId: branch.organisationId || "676cbe94c5f16f08e14f81cd",
                isActive: branch.isActive ?? true,
            });
        } else {
            reset({
                name: "",
                code: "",
                organisationId: "676cbe94c5f16f08e14f81cd",
                isActive: true,
            });
        }
    }, [branch, reset]);

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

    const onSubmit = async (data: BranchFormData) => {
        try {
            if (branch) {
                await updateMutation.mutateAsync({
                    id: branch._id,
                    data,
                });
                toast.success("Branch updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Branch created successfully");
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
                                {branch ? "Edit Branch" : "Create Branch"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {branch
                                    ? "Update branch details"
                                    : "Add a new branch to your organization"}
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
                        {/* Branch Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Branch Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter branch name"
                                {...register("name", { required: true })}
                            />
                        </div>

                        {/* Branch Code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Branch Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                placeholder="Enter branch code (e.g., BR001)"
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
                            {branch ? "Update Branch" : "Create Branch"}
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
