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
import { useCreateSalary, useUpdateSalary } from "@/hooks/ats/use-salaries";
import { toast } from "sonner";
import { X } from "lucide-react";

interface SalaryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salary?: any;
    organisationId: string;
}

interface SalaryFormData {
    salary: number;
    organisationId: string;
}

export function SalaryDrawer({
    open,
    onOpenChange,
    salary,
    organisationId,
}: SalaryDrawerProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SalaryFormData>({
        defaultValues: {
            salary: 0,
            organisationId: organisationId,
        },
    });

    const createMutation = useCreateSalary();
    const updateMutation = useUpdateSalary();

    useEffect(() => {
        if (salary) {
            reset({
                salary: salary.salary || 0,
                organisationId: salary.organisationId || organisationId,
            });
        } else {
            reset({
                salary: 0,
                organisationId: organisationId,
            });
        }
    }, [salary, reset, organisationId]);

    const onSubmit = async (data: SalaryFormData) => {
        try {
            if (salary) {
                await updateMutation.mutateAsync({
                    id: salary._id,
                    data,
                });
                toast.success("Salary updated successfully");
            } else {
                await createMutation.mutateAsync(data);
                toast.success("Salary created successfully");
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
                        {salary ? "Edit Salary" : "Add Salary"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {salary
                            ? "Update the salary details below"
                            : "Fill in the details to create a new salary"}
                    </DrawerDescription>
                    <DrawerClose className="absolute right-4 top-4">
                        <X className="h-4 w-4" />
                    </DrawerClose>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="salary">Salary Amount *</Label>
                        <Input
                            id="salary"
                            type="number"
                            {...register("salary", {
                                required: "Salary is required",
                                valueAsNumber: true,
                                min: { value: 0, message: "Salary must be positive" },
                            })}
                            placeholder="e.g., 50000"
                        />
                        {errors.salary && (
                            <p className="text-sm text-red-500">{errors.salary.message}</p>
                        )}
                    </div>

                    <DrawerFooter className="px-0">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? "Saving..."
                                : salary
                                ? "Update Salary"
                                : "Create Salary"}
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
