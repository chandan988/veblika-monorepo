"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Country, State, City } from "country-state-city";
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
import { Switch } from "@workspace/ui/components/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import { useBranches } from "@/hooks/use-branches";
import { useDepartments } from "@/hooks/use-departments";
import { useDesignations } from "@/hooks/use-designations";
import { useHiringSources } from "@/hooks/use-hiring-source";
import { useEmploymentStatuses } from "@/hooks/use-employment-status";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@workspace/ui/components/textarea";
import { AddHiringSourceDialog } from "./add-hiring-source-dialog";
import { AddEmploymentStatusDialog } from "./add-employment-status-dialog";

interface EmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee?: any;
}

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"];
const GENDER_OPTIONS = [
    {
        label: "Male",
        value: "male",
    },
    {
        label: "Female",
        value: "female"
    },
    {
        label: "Other",
        value: "other"
    }
];
const MARITAL_STATUS = [
    {
        label: "Single",
        value: "single",
    },
    {
        label: "Married",
        value: "married",
    },
    {
        label: "Divorced",
        value: "divorced",
    },
    {
        label: "Widowed",
        value: "widowed",
    },

];

export function EmployeeDialog({
    open,
    onOpenChange,
    employee,
}: EmployeeDialogProps) {
    const [hiringSourceDialogOpen, setHiringSourceDialogOpen] = useState(false);
    const [employmentStatusDialogOpen, setEmploymentStatusDialogOpen] = useState(false);
    const [sameAsPresentAddress, setSameAsPresentAddress] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            basicInformation: {
                EmployeeId: "",
                firstName: "",
                lastName: "",
                preferredName: "",
                email: "",
            },
            workInformation: {
                organisationId: "695131b8c139647c5a9931af",
                organisation: "",
                branchId: "",
                branch: "",
                departmentId: "",
                department: "",
                designationId: "",
                designation: "",
                sourceOfHiring: "",
                employmentType: "",
                employeeStatus: "",
                dateOfJoining: "",
                currentExp: "",
                totalExp: "",
            },
            personalInformation: {
                dateOfBirth: "",
                gender: "",
                contactNumber: "",
                askMeAbout: "",
                maritalStatus: "",
                aboutMe: "",
            },
            identityInformation: {
                panNumber: "",
                aadharNumber: "",
                UAN: "",
            },
            contactInformation: {
                workPhoneNo: "",
                personalPhoneNo: "",
                emergencyContactNo: "",
                presentAddress: {
                    addressLine1: "",
                    addressLine2: "",
                    country: "",
                    state: "",
                    city: "",
                    zipCode: "",
                },
                permanentAddress: {
                    addressLine1: "",
                    addressLine2: "",
                    country: "",
                    state: "",
                    city: "",
                    zipCode: "",
                },
            },
            workExperience: [],
            educationDetails: [],
            dependentDetails: [],
            isActive: true,
        },
    });

    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const { branches } = useBranches({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { departments } = useDepartments({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { designations } = useDesignations({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { hiringSources } = useHiringSources({ organisationId: "695131b8c139647c5a9931af", limit: 100 });
    const { employmentStatuses } = useEmploymentStatuses({ organisationId: "695131b8c139647c5a9931af", limit: 100 });

    const isActive = watch("isActive");
    const workExperience = watch("workExperience") || [];
    const educationDetails = watch("educationDetails") || [];
    const dependentDetails = watch("dependentDetails") || [];

    // Present Address watchers
    const presentCountry = watch("contactInformation.presentAddress.country");
    const presentState = watch("contactInformation.presentAddress.state");
    const presentCity = watch("contactInformation.presentAddress.city");
    const presentAddressLine1 = watch("contactInformation.presentAddress.addressLine1");
    const presentAddressLine2 = watch("contactInformation.presentAddress.addressLine2");
    const presentZipCode = watch("contactInformation.presentAddress.zipCode");

    // Permanent Address watchers
    const permanentCountry = watch("contactInformation.permanentAddress.country");
    const permanentState = watch("contactInformation.permanentAddress.state");

    // Memoize countries list (static data)
    const countries = useMemo(() => Country.getAllCountries(), []);

    // Get states for present address
    const presentStates = useMemo(() => {
        if (!presentCountry) return [];
        return State.getStatesOfCountry(presentCountry);
    }, [presentCountry]);

    // Get cities for present address
    const presentCities = useMemo(() => {
        if (!presentCountry || !presentState) return [];
        return City.getCitiesOfState(presentCountry, presentState);
    }, [presentCountry, presentState]);

    // Get states for permanent address
    const permanentStates = useMemo(() => {
        if (!permanentCountry) return [];
        return State.getStatesOfCountry(permanentCountry);
    }, [permanentCountry]);

    // Get cities for permanent address
    const permanentCities = useMemo(() => {
        if (!permanentCountry || !permanentState) return [];
        return City.getCitiesOfState(permanentCountry, permanentState);
    }, [permanentCountry, permanentState]);

    // Handle checkbox change with proper state/city loading
    const handleSameAddressChange = useCallback((checked: boolean) => {
        setSameAsPresentAddress(checked);

        if (checked) {
            // Copy all present address fields to permanent address
            setValue("contactInformation.permanentAddress.addressLine1", presentAddressLine1 || "");
            setValue("contactInformation.permanentAddress.addressLine2", presentAddressLine2 || "");
            setValue("contactInformation.permanentAddress.country", presentCountry || "");
            setValue("contactInformation.permanentAddress.zipCode", presentZipCode || "");

            // Use setTimeout to ensure states and cities are loaded
            setTimeout(() => {
                setValue("contactInformation.permanentAddress.state", presentState || "");
                setTimeout(() => {
                    setValue("contactInformation.permanentAddress.city", presentCity || "");
                }, 50);
            }, 50);
        } else {
            // Clear permanent address
            setValue("contactInformation.permanentAddress.addressLine1", "");
            setValue("contactInformation.permanentAddress.addressLine2", "");
            setValue("contactInformation.permanentAddress.country", "");
            setValue("contactInformation.permanentAddress.state", "");
            setValue("contactInformation.permanentAddress.city", "");
            setValue("contactInformation.permanentAddress.zipCode", "");
        }
    }, [presentAddressLine1, presentAddressLine2, presentCountry, presentState, presentCity, presentZipCode, setValue]);

    // Reset present address state and city when country changes
    useEffect(() => {
        if (presentCountry) {
            setValue("contactInformation.presentAddress.state", "");
            setValue("contactInformation.presentAddress.city", "");
        }
    }, [presentCountry, setValue]);

    // Reset present address city when state changes
    useEffect(() => {
        if (presentState) {
            setValue("contactInformation.presentAddress.city", "");
        }
    }, [presentState, setValue]);

    // Reset permanent address state and city when country changes (only if not synced)
    useEffect(() => {
        if (permanentCountry && !sameAsPresentAddress) {
            setValue("contactInformation.permanentAddress.state", "");
            setValue("contactInformation.permanentAddress.city", "");
        }
    }, [permanentCountry, setValue, sameAsPresentAddress]);

    // Reset permanent address city when state changes (only if not synced)
    useEffect(() => {
        if (permanentState && !sameAsPresentAddress) {
            setValue("contactInformation.permanentAddress.city", "");
        }
    }, [permanentState, setValue, sameAsPresentAddress]);

    useEffect(() => {
        if (employee) {
            reset({
                ...employee,
                workInformation: {
                    ...employee.workInformation,
                    dateOfJoining: employee.workInformation?.dateOfJoining
                        ? new Date(employee.workInformation.dateOfJoining).toISOString().split('T')[0]
                        : "",
                },
                personalInformation: {
                    ...employee.personalInformation,
                    dateOfBirth: employee.personalInformation?.dateOfBirth
                        ? new Date(employee.personalInformation.dateOfBirth).toISOString().split('T')[0]
                        : "",
                },
            });
        }
    }, [employee, reset]);

    useEffect(() => {
        if (!open) {
            reset();
            setSameAsPresentAddress(false);
        }
    }, [open, reset]);

    const addWorkExperience = useCallback(() => {
        setValue("workExperience", [
            ...workExperience,
            { companyName: "", jobTitle: "", from: "", to: "", jobDescription: "", relevent: "" }
        ] as any);
    }, [workExperience, setValue]);

    const removeWorkExperience = useCallback((index: number) => {
        setValue("workExperience", workExperience.filter((_: any, i: number) => i !== index) as any);
    }, [workExperience, setValue]);

    const addEducation = useCallback(() => {
        setValue("educationDetails", [
            ...educationDetails,
            { instituteName: "", degree: "", fieldOfStudy: "", from: "", to: "", grade: "" }
        ] as any);
    }, [educationDetails, setValue]);

    const removeEducation = useCallback((index: number) => {
        setValue("educationDetails", educationDetails.filter((_: any, i: number) => i !== index) as any);
    }, [educationDetails, setValue]);

    const addDependent = useCallback(() => {
        setValue("dependentDetails", [
            ...dependentDetails,
            { name: "", relationship: "", dateOfBirth: "" }
        ] as any);
    }, [dependentDetails, setValue]);

    const removeDependent = useCallback((index: number) => {
        setValue("dependentDetails", dependentDetails.filter((_: any, i: number) => i !== index) as any);
    }, [dependentDetails, setValue]);

    const onSubmit = async (data: any) => {
        try {
            const branch = branches?.data?.find((b: any) => b._id === data.workInformation.branchId);
            const department = departments?.data?.find((d: any) => d._id === data.workInformation.departmentId);
            const designation = designations?.data?.find((d: any) => d._id === data.workInformation.designationId);

            const payload = {
                ...data,
                workInformation: {
                    ...data.workInformation,
                    branch: branch?.name || "",
                    department: department?.name || "",
                    designation: designation?.name || "",
                },
            };

            if (employee) {
                await updateMutation.mutateAsync({
                    id: employee._id,
                    data: payload,
                });
                toast.success("Employee updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Employee created successfully");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col w-[95vw] sm:max-w-5xl">
                    <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
                        <DialogTitle className="text-2xl font-bold">
                            {employee ? "Edit Employee" : "Create New Employee"}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            {employee
                                ? "Update employee information and details"
                                : "Add a new employee with complete information"}
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
                                            <p className="text-sm text-muted-foreground">Essential employee details</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="EmployeeId" className="text-sm font-medium">
                                                Employee ID <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="EmployeeId"
                                                placeholder="e.g., EMP001"
                                                className="h-10"
                                                {...register("basicInformation.EmployeeId", { required: true })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">
                                                Email Address <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john.doe@company.com"
                                                className="h-10"
                                                {...register("basicInformation.email", { required: true })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-medium">
                                                First Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                className="h-10"
                                                {...register("basicInformation.firstName", { required: true })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-medium">
                                                Last Name 
                                            </Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                className="h-10"
                                                {...register("basicInformation.lastName", { required: false })}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="preferredName" className="text-sm font-medium">Preferred Name</Label>
                                            <Input
                                                id="preferredName"
                                                placeholder="Johnny (optional)"
                                                className="h-10"
                                                {...register("basicInformation.preferredName")}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-lg md:col-span-2 bg-muted/30">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active Status</Label>
                                                <p className="text-xs text-muted-foreground">Employee is currently active in the organization</p>
                                            </div>
                                            <Switch
                                                id="isActive"
                                                checked={isActive}
                                                onCheckedChange={(checked) => setValue("isActive", checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Work Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-primary rounded-full" />
                                        <div>
                                            <h3 className="text-lg font-semibold">Work Information</h3>
                                            <p className="text-sm text-muted-foreground">Employment and organizational details</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="branchId" className="text-sm font-medium">
                                                Branch <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="flex gap-2">

                                                <Select
                                                    value={watch("workInformation.branchId")}
                                                    onValueChange={(value) => setValue("workInformation.branchId", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select branch" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches?.data?.map((branch: any) => (
                                                            <SelectItem key={branch._id} value={branch._id}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="departmentId" className="text-sm font-medium">
                                                Department <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="flex gap-2">

                                                <Select
                                                    value={watch("workInformation.departmentId")}
                                                    onValueChange={(value) => setValue("workInformation.departmentId", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departments?.data?.map((dept: any) => (
                                                            <SelectItem key={dept._id} value={dept._id}>
                                                                {dept.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="designationId" className="text-sm font-medium">
                                                Designation <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="flex gap-2">

                                                <Select
                                                    value={watch("workInformation.designationId")}
                                                    onValueChange={(value) => setValue("workInformation.designationId", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select designation" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {designations?.data?.map((desig: any) => (
                                                            <SelectItem key={desig._id} value={desig._id}>
                                                                {desig.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="employmentType" className="text-sm font-medium">Employment Type</Label>
                                            <div className="flex gap-2">

                                                <Select
                                                    value={watch("workInformation.employmentType")}
                                                    onValueChange={(value) => setValue("workInformation.employmentType", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EMPLOYMENT_TYPES.map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                {type.replace("_", " ")}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="employeeStatus" className="text-sm font-medium">Employee Status</Label>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={watch("workInformation.employeeStatus")}
                                                    onValueChange={(value) => setValue("workInformation.employeeStatus", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {employmentStatuses?.data?.map((status: any) => (
                                                            <SelectItem key={status._id} value={status.status}>
                                                                {status.status}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0"
                                                    onClick={() => setEmploymentStatusDialogOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sourceOfHiring" className="text-sm font-medium">Source of Hiring</Label>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={watch("workInformation.sourceOfHiring")}
                                                    onValueChange={(value) => setValue("workInformation.sourceOfHiring", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select source" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {hiringSources?.data?.map((source: any) => (
                                                            <SelectItem key={source._id} value={source.source}>
                                                                {source.source}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0"
                                                    onClick={() => setHiringSourceDialogOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfJoining" className="text-sm font-medium">Date of Joining</Label>
                                            <Input
                                                id="dateOfJoining"
                                                type="date"
                                                className="h-10"
                                                {...register("workInformation.dateOfJoining")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currentExp" className="text-sm font-medium">Current Experience</Label>
                                            <Input
                                                id="currentExp"
                                                placeholder="e.g., 2 years"
                                                className="h-10"
                                                {...register("workInformation.currentExp")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="totalExp" className="text-sm font-medium">Total Experience</Label>
                                            <Input
                                                id="totalExp"
                                                placeholder="e.g., 5 years"
                                                className="h-10"
                                                {...register("workInformation.totalExp")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-primary rounded-full" />
                                        <div>
                                            <h3 className="text-lg font-semibold">Personal Information</h3>
                                            <p className="text-sm text-muted-foreground">Personal details and identity</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                className="h-9"
                                                {...register("personalInformation.dateOfBirth")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={watch("personalInformation.gender")}
                                                    onValueChange={(value) => setValue("personalInformation.gender", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {GENDER_OPTIONS.map((gender) => (
                                                            <SelectItem key={gender?.value} value={gender?.value}>
                                                                {gender?.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="contactNumber" className="text-sm font-medium">Contact Number</Label>
                                            <Input
                                                id="contactNumber"
                                                placeholder="+91 9876543210"
                                                className="h-9"
                                                {...register("personalInformation.contactNumber")

                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maritalStatus" className="text-sm font-medium">Marital Status</Label>
                                            <div className="flex gap-2">
                                                <Select

                                                    value={watch("personalInformation.maritalStatus")}
                                                    onValueChange={(value) => setValue("personalInformation.maritalStatus", value)}
                                                >
                                                    <SelectTrigger className="h-10 flex-1">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                    >
                                                        {MARITAL_STATUS.map((status) => (
                                                            <SelectItem key={status?.value} value={status?.value}>
                                                                {status?.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="askMeAbout" className="text-sm font-medium">Ask Me About</Label>
                                            <Input
                                                id="askMeAbout"
                                                placeholder="e.g., Cricket, Cooking, Technology"
                                                className="h-10"
                                                {...register("personalInformation.askMeAbout")}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="aboutMe" className="text-sm font-medium">About Me</Label>
                                            <Textarea
                                                id="aboutMe"
                                                placeholder="Tell us about yourself..."
                                                {...register("personalInformation.aboutMe")}
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <div className="h-1 w-12 bg-primary/30 rounded-full" />
                                            Identity Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="panNumber" className="text-sm font-medium">PAN Number</Label>
                                                <Input
                                                    id="panNumber"
                                                    placeholder="ABCDE1234F"
                                                    className="h-10"
                                                    {...register("identityInformation.panNumber")}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="aadharNumber" className="text-sm font-medium">Aadhar Number</Label>
                                                <Input
                                                    id="aadharNumber"
                                                    placeholder="1234 5678 9012"
                                                    className="h-10"
                                                    {...register("identityInformation.aadharNumber")}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="UAN" className="text-sm font-medium">UAN</Label>
                                                <Input
                                                    id="UAN"
                                                    placeholder="123456789012"
                                                    className="h-10"
                                                    {...register("identityInformation.UAN")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-primary rounded-full" />
                                        <div>
                                            <h3 className="text-lg font-semibold">Contact Information</h3>
                                            <p className="text-sm text-muted-foreground">Phone numbers and addresses</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="workPhoneNo" className="text-sm font-medium">Work Phone</Label>
                                            <Input
                                                id="workPhoneNo"
                                                placeholder="+91 1234567890"
                                                className="h-10"
                                                {...register("contactInformation.workPhoneNo")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="personalPhoneNo" className="text-sm font-medium">Personal Phone</Label>
                                            <Input
                                                id="personalPhoneNo"
                                                placeholder="+91 9876543210"
                                                className="h-10"
                                                {...register("contactInformation.personalPhoneNo")}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="emergencyContactNo" className="text-sm font-medium">Emergency Contact</Label>
                                            <Input
                                                id="emergencyContactNo"
                                                placeholder="+91 9999999999"
                                                className="h-10"
                                                {...register("contactInformation.emergencyContactNo")}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <div className="h-1 w-12 bg-primary/30 rounded-full" />
                                            Present Address
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="presentAddressLine1" className="text-sm font-medium">Address Line 1</Label>
                                                <Input
                                                    id="presentAddressLine1"
                                                    placeholder="Street address, building name"
                                                    className="h-10"
                                                    {...register("contactInformation.presentAddress.addressLine1")}
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="presentAddressLine2" className="text-sm font-medium">Address Line 2</Label>
                                                <Input
                                                    id="presentAddressLine2"
                                                    placeholder="Apartment, suite, floor (optional)"
                                                    className="h-10"
                                                    {...register("contactInformation.presentAddress.addressLine2")}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="presentCountry" className="text-sm font-medium">Country</Label>
                                                <div
                                                    className="flex gap-2"
                                                >

                                                    <Select
                                                        value={presentCountry}
                                                        onValueChange={(value) => setValue("contactInformation.presentAddress.country", value)}
                                                    >
                                                        <SelectTrigger className="flex-1 h-10">
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((country) => (
                                                                <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                    {country.flag} {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="presentState" className="text-sm font-medium">State / Province</Label>
                                                <div className="flex gap-2">

                                                    <Select
                                                        value={presentState}
                                                        onValueChange={(value) => setValue("contactInformation.presentAddress.state", value)}
                                                        disabled={!presentCountry}
                                                    >
                                                        <SelectTrigger className=" flex-1 h-10">
                                                            <SelectValue placeholder={presentCountry ? "Select state" : "Select country first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {presentStates.length > 0 ? (
                                                                presentStates.map((state) => (
                                                                    <SelectItem key={state.isoCode} value={state.isoCode}>
                                                                        {state.name}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="no-states" disabled>
                                                                    No states available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="presentCity" className="text-sm font-medium">City</Label>
                                                <div className="flex gap-2">

                                                    <Select
                                                        value={presentCity}
                                                        onValueChange={(value) => setValue("contactInformation.presentAddress.city", value)}
                                                        disabled={!presentCountry || !presentState}
                                                    >
                                                        <SelectTrigger className="flex-1 h-10">
                                                            <SelectValue placeholder={presentState ? "Select city" : "Select state first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {presentCities.length > 0 ? (
                                                                presentCities.map((city) => (
                                                                    <SelectItem key={city.name} value={city.name}>
                                                                        {city.name}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="no-cities" disabled>
                                                                    No cities available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="presentZipCode" className="text-sm font-medium">Zip / Postal Code</Label>
                                                <Input
                                                    id="presentZipCode"
                                                    placeholder="Enter zip code"
                                                    className="h-10"
                                                    {...register("contactInformation.presentAddress.zipCode")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <div className="h-1 w-12 bg-primary/30 rounded-full" />
                                                Permanent Address
                                            </h4>
                                            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                                                <input
                                                    type="checkbox"
                                                    id="sameAsPresentAddress"
                                                    checked={sameAsPresentAddress}
                                                    onChange={(e) => handleSameAddressChange(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                                                />
                                                <Label htmlFor="sameAsPresentAddress" className="text-sm font-normal cursor-pointer">
                                                    Same as Present Address
                                                </Label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="permanentAddressLine1" className="text-sm font-medium">Address Line 1</Label>
                                                <Input
                                                    id="permanentAddressLine1"
                                                    placeholder="Street address, building name"
                                                    className="h-10"
                                                    {...register("contactInformation.permanentAddress.addressLine1")}
                                                    disabled={sameAsPresentAddress}
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="permanentAddressLine2" className="text-sm font-medium">Address Line 2</Label>
                                                <Input
                                                    id="permanentAddressLine2"
                                                    placeholder="Apartment, suite, floor (optional)"
                                                    className="h-10"
                                                    {...register("contactInformation.permanentAddress.addressLine2")}
                                                    disabled={sameAsPresentAddress}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="permanentCountry" className="text-sm font-medium">Country</Label>
                                                <div className="flex gap-2">

                                                    <Select
                                                        value={permanentCountry}
                                                        onValueChange={(value) => setValue("contactInformation.permanentAddress.country", value)}
                                                        disabled={sameAsPresentAddress}
                                                    >
                                                        <SelectTrigger className="flex-1 h-10">
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((country) => (
                                                                <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                    {country.flag} {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="permanentState" className="text-sm font-medium">State / Province</Label>
                                                <div className="flex gap-2">

                                                    <Select
                                                        value={permanentState}
                                                        onValueChange={(value) => setValue("contactInformation.permanentAddress.state", value)}
                                                        disabled={!permanentCountry || sameAsPresentAddress}
                                                    >
                                                        <SelectTrigger className="flex-1 h-10">
                                                            <SelectValue placeholder={permanentCountry ? "Select state" : "Select country first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {permanentStates.length > 0 ? (
                                                                permanentStates.map((state) => (
                                                                    <SelectItem key={state.isoCode} value={state.isoCode}>
                                                                        {state.name}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="no-states" disabled>
                                                                    No states available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="permanentCity" className="text-sm font-medium">City</Label>
                                                <div className="flex gap-2">

                                                    <Select
                                                        value={watch("contactInformation.permanentAddress.city")}
                                                        onValueChange={(value) => setValue("contactInformation.permanentAddress.city", value)}
                                                        disabled={!permanentCountry || !permanentState || sameAsPresentAddress}
                                                    >
                                                        <SelectTrigger className="flex-1 h-10">
                                                            <SelectValue placeholder={permanentState ? "Select city" : "Select state first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {permanentCities.length > 0 ? (
                                                                permanentCities.map((city) => (
                                                                    <SelectItem key={city.name} value={city.name}>
                                                                        {city.name}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="no-cities" disabled>
                                                                    No cities available
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="permanentZipCode" className="text-sm font-medium">Zip / Postal Code</Label>
                                                <Input
                                                    id="permanentZipCode"
                                                    placeholder="Enter zip code"
                                                    className="h-9"
                                                    {...register("contactInformation.permanentAddress.zipCode")}
                                                    disabled={sameAsPresentAddress}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Work Experience */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-1 bg-primary rounded-full" />
                                            <div>
                                                <h3 className="text-lg font-semibold">Work Experience</h3>
                                                <p className="text-sm text-muted-foreground">Previous employment history</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addWorkExperience} className="h-9">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Experience
                                        </Button>
                                    </div>

                                    {workExperience.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                                            <p className="text-sm text-muted-foreground">No work experience added yet</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click "Add Experience" to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {workExperience.map((_, index) => (
                                                <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium text-sm">Experience #{index + 1}</h4>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeWorkExperience(index)}
                                                            className="h-8"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Company Name</Label>
                                                            <Input className="h-10" placeholder="Company name..." {...register(`workExperience.${index}.companyName` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Job Title</Label>
                                                            <Input className="h-10" placeholder="Job title..." {...register(`workExperience.${index}.jobTitle` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">From</Label>
                                                            <Input type="date" className="h-10" placeholder="From date..." {...register(`workExperience.${index}.from` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">To</Label>
                                                            <Input type="date" className="h-10" placeholder="To date..." {...register(`workExperience.${index}.to` as any)} />
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-sm font-medium">Job Description</Label>
                                                            <Textarea className="resize-none" placeholder="Job description..." {...register(`workExperience.${index}.jobDescription` as any)} rows={2} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Education Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-1 bg-primary rounded-full" />
                                            <div>
                                                <h3 className="text-lg font-semibold">Education Details</h3>
                                                <p className="text-sm text-muted-foreground">Academic qualifications</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addEducation} className="h-9">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Education
                                        </Button>
                                    </div>

                                    {educationDetails.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                                            <p className="text-sm text-muted-foreground">No education details added yet</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click "Add Education" to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {educationDetails.map((_, index) => (
                                                <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium text-sm">Education #{index + 1}</h4>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEducation(index)}
                                                            className="h-8"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Institute Name</Label>
                                                            <Input className="h-10" placeholder="Institute name..." {...register(`educationDetails.${index}.instituteName` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Degree</Label>
                                                            <Input className="h-10" placeholder="Degree..." {...register(`educationDetails.${index}.degree` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Field of Study</Label>
                                                            <Input className="h-10" placeholder="Field of study..." {...register(`educationDetails.${index}.fieldOfStudy` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Grade</Label>
                                                            <Input className="h-10" placeholder="Grade..." {...register(`educationDetails.${index}.grade` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">From</Label>
                                                            <Input type="date" className="h-10" placeholder="From date..." {...register(`educationDetails.${index}.from` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">To</Label>
                                                            <Input type="date" className="h-10" placeholder="To date..." {...register(`educationDetails.${index}.to` as any)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Dependent Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-1 bg-primary rounded-full" />
                                            <div>
                                                <h3 className="text-lg font-semibold">Dependent Details</h3>
                                                <p className="text-sm text-muted-foreground">Family members and dependents</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addDependent} className="h-9">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Dependent
                                        </Button>
                                    </div>

                                    {dependentDetails.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                                            <p className="text-sm text-muted-foreground">No dependent details added yet</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click "Add Dependent" to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {dependentDetails.map((_, index) => (
                                                <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium text-sm">Dependent #{index + 1}</h4>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeDependent(index)}
                                                            className="h-8"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Name</Label>
                                                            <Input className="h-10" placeholder="Name..." {...register(`dependentDetails.${index}.name` as any)} />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Relationship</Label>
                                                            <Input className="h-10" placeholder="Relationship..." {...register(`dependentDetails.${index}.relationship` as any)} />
                                                        </div>

                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-sm font-medium">Date of Birth</Label>
                                                            <Input type="date" className="h-10" placeholder="Date of Birth..." {...register(`dependentDetails.${index}.dateOfBirth` as any)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10">
                                Cancel
                            </Button>
                            <Button type="submit" className="h-10">
                                {employee ? "Update Employee" : "Create Employee"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AddHiringSourceDialog
                open={hiringSourceDialogOpen}
                onOpenChange={setHiringSourceDialogOpen}
            />

            <AddEmploymentStatusDialog
                open={employmentStatusDialogOpen}
                onOpenChange={setEmploymentStatusDialogOpen}
            />
        </>
    );
}