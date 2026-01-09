"use client";

import { useEffect, useState } from "react";
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
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { Switch } from "@workspace/ui/components/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { useCreateJobOpening, useUpdateJobOpening } from "@/hooks/use-job-openings";
import { useIndustries } from "@/hooks/ats/use-industries";
import { useJobOpeningStatuses } from "@/hooks/ats/use-job-opening-statuses";
import { useJobTypes } from "@/hooks/ats/use-job-types";
import { useSalaries } from "@/hooks/ats/use-salaries";
import { useWorkExperiences } from "@/hooks/ats/use-work-experiences";
import { useFileUpload } from "@/hooks/use-file-upload";
import { RichTextEditor } from "./rich-text-editor";
import { TagInput } from "./tag-input";
import { toast } from "sonner";
import { Upload, X, FileText, FileIcon } from "lucide-react";

interface JobOpeningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobOpening?: any;
}

export function JobOpeningDialog({
    open,
    onOpenChange,
    jobOpening,
}: JobOpeningDialogProps) {
    const [skills, setSkills] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [requirements, setRequirements] = useState("");
    const [benefits, setBenefits] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useState<HTMLInputElement | null>(null)[0];

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            title: "",
            organisationId: "695131b8c139647c5a9931af",
            organisation: "Default Organisation",
            targetDate: "",
            openedDate: "",
            jobOpeningStatus: "",
            jobType: "",
            industry: "",
            workExperience: "",
            salary: "",
            country: "",
            state: "",
            city: "",
            zipCode: "",
            isRemote: false,
            noOfPositions: 1,
        },
    });

    const createMutation = useCreateJobOpening();
    const updateMutation = useUpdateJobOpening();
    const { uploadFiles, isUploading } = useFileUpload();

    // Fetch dropdown data
    const { industries } = useIndustries({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { jobOpeningStatuses } = useJobOpeningStatuses({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { jobTypes } = useJobTypes({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { salaries } = useSalaries({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { workExperiences } = useWorkExperiences({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const isRemote = watch("isRemote");

    // Watch isRemote and clear location fields when it changes to true
    useEffect(() => {
        if (isRemote) {
            setValue("country", "");
            setValue("state", "");
            setValue("city", "");
            setValue("zipCode", "");
        }
    }, [isRemote, setValue]);

    useEffect(() => {
        if (jobOpening) {
            // Populate form with existing job opening data
            Object.keys(jobOpening).forEach((key) => {
                if (key === "requiredSkills" && Array.isArray(jobOpening[key])) {
                    setSkills(jobOpening[key]);
                } else if (key === "description") {
                    setDescription(jobOpening[key] || "");
                } else if (key === "requirements") {
                    setRequirements(jobOpening[key] || "");
                } else if (key === "benefits") {
                    setBenefits(jobOpening[key] || "");
                } else if (key === "targetDate" || key === "openedDate") {
                    // Convert date to YYYY-MM-DD format
                    const date = new Date(jobOpening[key]);
                    setValue(key as any, date.toISOString().split('T')[0]);
                } else {
                    setValue(key as any, jobOpening[key]);
                }
            });
        } else {
            // Set default opened date to today
            const today = new Date().toISOString().split('T')[0] || "";
            setValue("openedDate", today);
            setSkills([]);
            setDescription("");
            setRequirements("");
            setBenefits("");
            setAttachments([]);
        }
    }, [jobOpening, setValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                requiredSkills: skills,
                description: description,
                requirements: requirements,
                benefits: benefits,
            };

            let createdJobOpening;
            
            if (jobOpening) {
                await updateMutation.mutateAsync({
                    id: jobOpening._id,
                    data: payload,
                });
                createdJobOpening = { _id: jobOpening._id };
                toast.success("Job opening updated successfully");
            } else {
                const result = await createMutation.mutateAsync(payload);
                createdJobOpening = result.data;
                toast.success("Job opening created successfully");
            }

            // Upload attachments if any
            if (attachments.length > 0 && createdJobOpening?._id) {
                try {
                    await uploadFiles({
                        endpoint: `/api/ats/job-opening/${createdJobOpening._id}/upload`,
                        files: attachments,
                        organisationId: data.organisationId,
                        // bucketName: "your-custom-bucket", // Optional: specify custom bucket
                        onSuccess: (uploadData) => {
                            toast.success(`${uploadData.data.attachments.length} file(s) uploaded successfully`);
                        },
                    });
                } catch (uploadError) {
                    // Job opening is created, but file upload failed
                    console.error("File upload failed:", uploadError);
                    toast.error("Job opening created but file upload failed. You can upload files later.");
                }
            }

            reset();
            setSkills([]);
            setDescription("");
            setRequirements("");
            setBenefits("");
            setAttachments([]);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col w-[95vw] sm:max-w-5xl">
                <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                    <DialogTitle className="text-2xl font-bold">
                        {jobOpening ? "Edit Job Opening" : "Create New Job Opening"}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {jobOpening
                            ? "Update job opening details"
                            : "Add a new job opening with complete details"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 px-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                        <div className="space-y-8 pb-6 pt-2">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <div>
                                        <h3 className="text-lg font-semibold">Basic Information</h3>
                                        <p className="text-sm text-muted-foreground">Essential job opening details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="title" className="text-sm font-medium">
                                            Job Title <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., Senior Software Engineer"
                                            className="h-10"
                                            {...register("title", { required: true })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="industry" className="text-sm font-medium">
                                            Industry <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={watch("industry")}
                                            onValueChange={(value) => setValue("industry", value)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industries?.data?.map((industry: any) => (
                                                    <SelectItem key={industry._id} value={industry._id}>
                                                        {industry.industry}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="jobType" className="text-sm font-medium">
                                            Job Type <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={watch("jobType")}
                                            onValueChange={(value) => setValue("jobType", value)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select job type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {jobTypes?.data?.map((type: any) => (
                                                    <SelectItem key={type._id} value={type._id}>
                                                        {type.type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="jobOpeningStatus" className="text-sm font-medium">
                                            Status <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={watch("jobOpeningStatus")}
                                            onValueChange={(value) => setValue("jobOpeningStatus", value)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {jobOpeningStatuses?.data?.map((status: any) => (
                                                    <SelectItem key={status._id} value={status._id}>
                                                        {status.status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="workExperience" className="text-sm font-medium">
                                            Work Experience <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={watch("workExperience")}
                                            onValueChange={(value) => setValue("workExperience", value)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select experience" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workExperiences?.data?.map((exp: any) => (
                                                    <SelectItem key={exp._id} value={exp._id}>
                                                        {exp.experience}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="salary" className="text-sm font-medium">
                                            Salary <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={watch("salary")}
                                            onValueChange={(value) => setValue("salary", value)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select salary range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {salaries?.data?.map((salary: any) => (
                                                    <SelectItem key={salary._id} value={salary._id}>
                                                        {salary.salary}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="noOfPositions" className="text-sm font-medium">
                                            Number of Positions <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="noOfPositions"
                                            type="number"
                                            min="1"
                                            placeholder="e.g., 5"
                                            className="h-10"
                                            {...register("noOfPositions", { required: true, valueAsNumber: true })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="openedDate" className="text-sm font-medium">
                                            Opened Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="openedDate"
                                            type="date"
                                            className="h-10"
                                            {...register("openedDate", { required: true })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="targetDate" className="text-sm font-medium">
                                            Target Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="targetDate"
                                            type="date"
                                            className="h-10"
                                            {...register("targetDate", { required: true })}
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="requiredSkills" className="text-sm font-medium">
                                            Required Skills
                                        </Label>
                                        <TagInput
                                            value={skills}
                                            onChange={setSkills}
                                            placeholder="Type a skill and press Enter or comma"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Type a skill and press Enter or comma to add. Click X to remove.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Location Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <div>
                                        <h3 className="text-lg font-semibold">Location Information</h3>
                                        <p className="text-sm text-muted-foreground">Job location details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center justify-between p-4 border rounded-lg md:col-span-2 bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="isRemote" className="text-sm font-medium cursor-pointer">Remote Work</Label>
                                            <p className="text-xs text-muted-foreground">This is a remote position</p>
                                        </div>
                                        <Switch
                                            id="isRemote"
                                            checked={isRemote}
                                            onCheckedChange={(checked) => setValue("isRemote", checked)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                                        <Input
                                            id="country"
                                            placeholder="e.g., India"
                                            className="h-10"
                                            disabled={isRemote}
                                            {...register("country")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state" className="text-sm font-medium">State</Label>
                                        <Input
                                            id="state"
                                            placeholder="e.g., Maharashtra"
                                            className="h-10"
                                            disabled={isRemote}
                                            {...register("state")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="e.g., Mumbai"
                                            className="h-10"
                                            disabled={isRemote}
                                            {...register("city")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode" className="text-sm font-medium">Zip Code</Label>
                                        <Input
                                            id="zipCode"
                                            placeholder="e.g., 400001"
                                            className="h-10"
                                            disabled={isRemote}
                                            {...register("zipCode")}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Job Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1 bg-primary rounded-full" />
                                    <div>
                                        <h3 className="text-lg font-semibold">Job Details</h3>
                                        <p className="text-sm text-muted-foreground">Description, requirements, and benefits</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium">
                                            Job Description <span className="text-destructive">*</span>
                                        </Label>
                                        <RichTextEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Provide a detailed description of the role and what the candidate will be doing..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requirements" className="text-sm font-medium">
                                            Requirements <span className="text-destructive">*</span>
                                        </Label>
                                        <RichTextEditor
                                            value={requirements}
                                            onChange={setRequirements}
                                            placeholder="Specify the requirements, qualifications, and experience needed..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="benefits" className="text-sm font-medium">
                                            Benefits <span className="text-destructive">*</span>
                                        </Label>
                                        <RichTextEditor
                                            value={benefits}
                                            onChange={setBenefits}
                                            placeholder="Describe the benefits and perks offered with this position..."
                                        />
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            Attachments
                                        </Label>
                                        <div className="space-y-3">
                                            {/* Upload Area */}
                                            <div 
                                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors cursor-pointer"
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                    <div className="text-sm">
                                                        <span className="font-medium text-primary cursor-pointer">
                                                            Click to upload
                                                        </span>
                                                        {" "}or drag and drop
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        PDF, DOC, DOCX, TXT up to 10MB
                                                    </p>
                                                </div>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    className="hidden"
                                                    multiple
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    onChange={handleFileChange}
                                                />
                                            </div>

                                            {/* Uploaded Files List */}
                                            {attachments.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium">Uploaded Files ({attachments.length})</p>
                                                    <div className="space-y-2">
                                                        {attachments.map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                                                            >
                                                                <div className="shrink-0">
                                                                    {file.type === 'application/pdf' ? (
                                                                        <FileText className="h-5 w-5 text-red-500" />
                                                                    ) : (
                                                                        <FileIcon className="h-5 w-5 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">
                                                                        {file.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatFileSize(file.size)}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 shrink-0"
                                                                    onClick={() => removeAttachment(index)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 pt-4 border-t shrink-0 gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="h-10" 
                            disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                        >
                            {isUploading 
                                ? "Uploading files..." 
                                : jobOpening 
                                ? "Update Job Opening" 
                                : "Create Job Opening"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
