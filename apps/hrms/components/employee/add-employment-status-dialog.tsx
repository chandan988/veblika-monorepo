"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useCreateEmploymentStatus } from "@/hooks/use-employment-status";
import { toast } from "sonner";

interface AddEmploymentStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddEmploymentStatusDialog({
    open,
    onOpenChange,
}: AddEmploymentStatusDialogProps) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            status: "",
            organisationId: "676cbe94c5f16f08e14f81cd",
        },
    });

    const createMutation = useCreateEmploymentStatus();

    const onSubmit = async (data: any) => {
        try {
            await createMutation.mutateAsync(data);
            toast.success("Employment status created successfully");
            reset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to create employment status");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Employment Status</DialogTitle>
                    <DialogDescription>
                        Create a new employment status for your organization
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="status"
                            placeholder="e.g., Active, Onboarding, Exited"
                            {...register("status", { required: true })}
                        />
                    </div>
                   

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
