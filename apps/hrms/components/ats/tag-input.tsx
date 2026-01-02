"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function TagInput({ value = [], onChange, placeholder = "Add tags...", className }: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            // Remove last tag on backspace if input is empty
            removeTag(value.length - 1);
        }
    };

    const addTag = () => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !value.includes(trimmedValue)) {
            onChange([...value, trimmedValue]);
            setInputValue("");
        }
    };

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleBlur = () => {
        // Add tag on blur if there's input
        if (inputValue.trim()) {
            addTag();
        }
    };

    return (
        <div className={cn("flex flex-wrap gap-2 p-2 border rounded-md min-h-10 bg-background", className)}>
            {value.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0"
            />
        </div>
    );
}
