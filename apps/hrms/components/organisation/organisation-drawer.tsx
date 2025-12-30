"use client";
import { Country, State, City } from 'country-state-city';
import { useEffect, useMemo } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { useCreateOrganisation, useUpdateOrganisation } from "@/hooks/use-organisations";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

interface OrganisationDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organisation?: any;
}

interface OrganisationFormData {
    name: string;
    website: string;
    logo: string;
    industry: string;
    country: string;
    state: string;
    city: string;
    timeZone: string;
    location: string;
    settings: {
        weekStartDay: string;
        workingDays: string[];
        currency: string;
        dateFormat: string;
    };
    isActive: boolean;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CURRENCIES = [
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
];
const DATE_FORMATS = [
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
    { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export function OrganisationDrawer({
    open,
    onOpenChange,
    organisation,
}: OrganisationDrawerProps) {

    const { register, handleSubmit, reset, setValue, watch } = useForm<OrganisationFormData>({
        defaultValues: {
            name: "",
            website: "",
            logo: "",
            industry: "",
            country: "India",
            timeZone: "Asia/Kolkata",
            location: "",
            settings: {
                weekStartDay: "Monday",
                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                currency: "INR",
                dateFormat: "DD-MM-YYYY",
            },
            isActive: true,
        },
    });

    const createMutation = useCreateOrganisation();
    const updateMutation = useUpdateOrganisation();

    const workingDays = watch("settings.workingDays");
    const selectedCountry = watch("country");
    const selectedState = watch("state");
    // Get states based on selected country
    const states = useMemo(() => {
        if (!selectedCountry) return [];
        return State.getStatesOfCountry(selectedCountry);
    }, [selectedCountry]);
    // Get cities based on selected country and state
    const cities = useMemo(() => {
        if (!selectedCountry || !selectedState) return [];
        return City.getCitiesOfState(selectedCountry, selectedState);
    }, [selectedCountry, selectedState]);

    // Reset state and city when country changes
    useEffect(() => {
        if (selectedCountry && !organisation) {
            setValue("state", "");
            setValue("city", "");
        }
    }, [selectedCountry, setValue, organisation]);

    // Reset city when state changes
    useEffect(() => {
        if (selectedState && !organisation) {
            setValue("city", "");
        }
    }, [selectedState, setValue, organisation]);

useEffect(() => {
    console.log("Organisation data changed:", organisation);
    if (organisation) {
        // Find country isoCode from country name
        const countryData = Country.getAllCountries().find(
            c => c.name === organisation.country
        );
        const countryIsoCode = countryData?.isoCode || "IN";

        // Find state isoCode from state name
        const stateData = State.getStatesOfCountry(countryIsoCode).find(
            s => s.name === organisation.state
        );
        const stateIsoCode = stateData?.isoCode || "";

        reset({
            name: organisation.name || "",
            website: organisation.website || "",
            logo: organisation.logo || "",
            industry: organisation.industry || "",
            country: countryIsoCode,
            state: stateIsoCode,
            city: organisation.city || "",
            timeZone: organisation.timeZone || "Asia/Kolkata",
            location: organisation.location || "",
            settings: {
                weekStartDay: organisation.settings?.weekStartDay || "Monday",
                workingDays: organisation.settings?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                currency: organisation.settings?.currency || "INR",
                dateFormat: organisation.settings?.dateFormat || "DD-MM-YYYY",
            },
            isActive: organisation.isActive ?? true,
        });
    } else {
        // Reset to default values when creating new organisation
        reset({
            name: "",
            website: "",
            logo: "",
            industry: "",
            country: "IN",
            state: "",
            city: "",
            timeZone: "Asia/Kolkata",
            location: "",
            settings: {
                weekStartDay: "Monday",
                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                currency: "INR",
                dateFormat: "DD-MM-YYYY",
            },
            isActive: true,
        });
    }
}, [organisation, reset]);

// Reset form when drawer closes
useEffect(() => {
    if (!open) {
        reset({
            name: "",
            website: "",
            logo: "",
            industry: "",
            country: "IN",
            state: "",
            city: "",
            timeZone: "Asia/Kolkata",
            location: "",
            settings: {
                weekStartDay: "Monday",
                workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                currency: "INR",
                dateFormat: "DD-MM-YYYY",
            },
            isActive: true,
        });
    }
}, [open, reset]);

// ...existing code...

    const onSubmit = async (data: OrganisationFormData) => {
        try {
            // Get country name from isoCode
            const countryData = Country.getAllCountries().find(c => c.isoCode === data.country);
            const countryName = countryData?.name || data.country;

            // Get state name from isoCode
            const stateData = State.getStatesOfCountry(data.country).find(s => s.isoCode === data.state);
            const stateName = stateData?.name || data.state;

            const payload = {
                name: data.name,
                website: data.website,
                logo: data.logo,
                industry: data.industry,
                country: countryName,
                state: stateName,
                city: data.city,
                timeZone: data.timeZone,
                location: data.location,
                settings: {
                    weekStartDay: data.settings.weekStartDay,
                    workingDays: data.settings.workingDays,
                    currency: data.settings.currency,
                    dateFormat: data.settings.dateFormat,
                },
                isActive: data.isActive,
            };

            if (organisation) {
                await updateMutation.mutateAsync({
                    id: organisation._id,
                    data: payload,
                });
                toast.success("Organisation updated successfully");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Organisation created successfully");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    };


    const toggleWorkingDay = (day: string) => {
        const currentDays = workingDays;
        const newDays = currentDays.includes(day)
            ? currentDays.filter((d: string) => d !== day)
            : [...currentDays, day];
        setValue("settings.workingDays", newDays);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className="w-full sm:max-w-3xl h-screen">
                <DrawerHeader className="border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle>
                                {organisation ? "Edit Organisation" : "Create New Organisation"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {organisation
                                    ? "Update organisation details and settings"
                                    : "Fill in the information below to create a new organisation"}
                            </DrawerDescription>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon">
                                <X className="h-4 w-4" />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6">
                        <div className="space-y-6 py-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Basic Information</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Organisation Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter organisation name"
                                        {...register("name", { required: true })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        placeholder="https://example.com"
                                        {...register("website")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="logo">Logo URL</Label>
                                    <Input
                                        id="logo"
                                        type="url"
                                        placeholder="https://example.com/logo.png"
                                        {...register("logo")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Input
                                        id="industry"
                                        placeholder="e.g., Technology, Healthcare, Finance"
                                        {...register("industry")}
                                    />
                                </div>
                            </div>

                            {/* Location & Timezone */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Location & Timezone</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select
                                        value={selectedCountry}
                                        onValueChange={(value) => setValue("country", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Country.getAllCountries().map((country) => (
                                                <SelectItem key={country.name} value={country.isoCode}>
                                                    {country.flag} {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Select
                                        value={selectedState}
                                        onValueChange={(value) => setValue("state", value)}
                                        disabled={!selectedCountry}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedCountry ? "Select state" : "Select country first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.length > 0 ? (
                                                states.map((state) => (
                                                    <SelectItem key={state.name} value={state.isoCode}>
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

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Select
                                        value={watch("city")}
                                        onValueChange={(value) => setValue("city", value)}
                                        disabled={!selectedCountry || !selectedState}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.length > 0 ? (
                                                cities.map((city) => (
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

                                <div className="space-y-2">
                                    <Label htmlFor="timeZone">Timezone</Label>
                                    <Select
                                        value={watch("timeZone")}
                                        onValueChange={(value) => setValue("timeZone", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                            <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                            <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                                            <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                            <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                                            <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="Enter full address"
                                        {...register("location")}
                                    />
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Organisation Settings</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="settings.weekStartDay">Week Start Day</Label>
                                    <Select
                                        value={watch("settings.weekStartDay")}
                                        onValueChange={(value) => setValue("settings.weekStartDay", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select week start day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEEKDAYS.map((day) => (
                                                <SelectItem key={day} value={day}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Working Days</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {WEEKDAYS.map((day) => (
                                            <div key={day} className="flex items-center space-x-2">
                                                <Switch
                                                    id={`day-${day}`}
                                                    checked={workingDays.includes(day)}
                                                    onCheckedChange={() => toggleWorkingDay(day)}
                                                />
                                                <Label
                                                    htmlFor={`day-${day}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {day}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="settings.currency">Currency</Label>
                                    <Select
                                        value={watch("settings.currency")}
                                        onValueChange={(value) => setValue("settings.currency", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((currency) => (
                                                <SelectItem key={currency.value} value={currency.value}>
                                                    {currency.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="settings.dateFormat">Date Format</Label>
                                    <Select
                                        value={watch("settings.dateFormat")}
                                        onValueChange={(value) => setValue("settings.dateFormat", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select date format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DATE_FORMATS.map((format) => (
                                                <SelectItem key={format.value} value={format.value}>
                                                    {format.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={watch("isActive")}
                                        onCheckedChange={(value) => setValue("isActive", value)}
                                    />
                                    <Label htmlFor="isActive" className="cursor-pointer">
                                        Active Status
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className="border-t flex-shrink-0">
                        <div className="flex gap-2">
                            <DrawerClose asChild>
                                <Button type="button" variant="outline" className="flex-1">
                                    Cancel
                                </Button>
                            </DrawerClose>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending
                                    ? "Saving..."
                                    : organisation
                                        ? "Update Organisation"
                                        : "Create Organisation"}
                            </Button>
                        </div>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
