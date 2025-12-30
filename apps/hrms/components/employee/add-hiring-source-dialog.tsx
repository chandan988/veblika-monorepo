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
import { useCreateHiringSource } from "@/hooks/use-hiring-source";
import { toast } from "sonner";

interface AddHiringSourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddHiringSourceDialog({
    open,
    onOpenChange,
}: AddHiringSourceDialogProps) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            source: "",
            organisationId: "695131b8c139647c5a9931af",
        },
    });

    const createMutation = useCreateHiringSource();

    const onSubmit = async (data: any) => {
        try {
            await createMutation.mutateAsync({
                source: data.source,
                organisationId: "695131b8c139647c5a9931af",
            });
            toast.success("Hiring source created successfully");
            reset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to create hiring source");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Hiring Source</DialogTitle>
                    <DialogDescription>
                        Create a new hiring source for your organization
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="source">
                            Source <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="source"
                            placeholder="e.g., LinkedIn, Referral, Job Board"
                            {...register("source", { required: true })}
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
