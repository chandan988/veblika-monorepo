"use client";

import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link,
    Image as ImageIcon,
    Code,
    ChevronDown,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

interface RichTextEditorProps {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export interface RichTextEditorRef {
    getHtml: () => string;
    setHtml: (html: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
    ({ value = "", onChange, placeholder = "Start typing...", className }, ref) => {
        const editorRef = useRef<HTMLDivElement>(null);
        const [isInitialized, setIsInitialized] = useState(false);
        const [currentFormat, setCurrentFormat] = useState<string>("Normal");
        const [currentFontSize, setCurrentFontSize] = useState<string>("12pt");
        const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
        
        // Dialog states
        const [imageDialogOpen, setImageDialogOpen] = useState(false);
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [imageAlt, setImageAlt] = useState("");

        // Initialize editor content
        useEffect(() => {
            if (editorRef.current && !isInitialized) {
                editorRef.current.innerHTML = value;
                setIsInitialized(true);
            }
        }, [value, isInitialized]);

        // Update content when value changes externally
        useEffect(() => {
            if (editorRef.current && isInitialized && value !== editorRef.current.innerHTML) {
                const selection = window.getSelection();
                const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                
                editorRef.current.innerHTML = value;
                
                // Restore cursor position if possible
                if (range && editorRef.current.contains(range.startContainer)) {
                    try {
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                    } catch (e) {
                        // Ignore errors in restoring selection
                    }
                }
            }
        }, [value, isInitialized]);

        // Update formatting state based on current selection
        const updateFormattingState = useCallback(() => {
            const formats = new Set<string>();
            
            if (document.queryCommandState('bold')) formats.add('bold');
            if (document.queryCommandState('italic')) formats.add('italic');
            if (document.queryCommandState('underline')) formats.add('underline');
            if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
            if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
            if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');
            if (document.queryCommandState('justifyLeft')) formats.add('justifyLeft');
            if (document.queryCommandState('justifyCenter')) formats.add('justifyCenter');
            if (document.queryCommandState('justifyRight')) formats.add('justifyRight');
            if (document.queryCommandState('justifyFull')) formats.add('justifyFull');
            
            setActiveFormats(formats);

            // Get current format block
            const formatBlock = document.queryCommandValue('formatBlock');
            if (formatBlock.includes('h1')) setCurrentFormat('Heading 1');
            else if (formatBlock.includes('h2')) setCurrentFormat('Heading 2');
            else if (formatBlock.includes('h3')) setCurrentFormat('Heading 3');
            else if (formatBlock.includes('pre')) setCurrentFormat('Code Block');
            else setCurrentFormat('Normal');

            // Get current font size
            const fontSize = document.queryCommandValue('fontSize');
            const sizeMap: Record<string, string> = {
                '1': '8pt', '2': '10pt', '3': '12pt', '4': '14pt',
                '5': '18pt', '6': '24pt', '7': '32pt'
            };
            setCurrentFontSize(sizeMap[fontSize] || '12pt');
        }, []);

        // Execute formatting command
        const execCommand = useCallback((command: string, value?: string) => {
            if (!editorRef.current) return;
            
            editorRef.current.focus();
            document.execCommand(command, false, value);
            
            // Update formatting state
            updateFormattingState();
            
            // Trigger onChange after command
            if (onChange) {
                onChange(editorRef.current.innerHTML);
            }
        }, [onChange, updateFormattingState]);

        // Get HTML content from editor
        const getHtml = useCallback(() => {
            return editorRef.current?.innerHTML || "";
        }, []);

        // Set HTML content to editor
        const setHtml = useCallback((html: string) => {
            if (editorRef.current) {
                editorRef.current.innerHTML = html;
            }
        }, []);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            getHtml,
            setHtml,
        }), [getHtml, setHtml]);

        // Handle content change
        const handleInput = useCallback(() => {
            updateFormattingState();
            if (onChange && editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        }, [onChange, updateFormattingState]);

        // Handle selection change
        const handleSelectionChange = useCallback(() => {
            updateFormattingState();
        }, [updateFormattingState]);

        // Add selection change listener
        useEffect(() => {
            document.addEventListener('selectionchange', handleSelectionChange);
            return () => {
                document.removeEventListener('selectionchange', handleSelectionChange);
            };
        }, [handleSelectionChange]);

        // Handle paste to clean up formatting
        const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }, []);

        // Toolbar button configurations
        const formatButtons = [
            { icon: Bold, command: "bold", label: "Bold (Ctrl+B)" },
            { icon: Italic, command: "italic", label: "Italic (Ctrl+I)" },
            { icon: Underline, command: "underline", label: "Underline (Ctrl+U)" },
            { icon: Strikethrough, command: "strikeThrough", label: "Strikethrough" },
        ];

        const alignButtons = [
            { icon: AlignLeft, command: "justifyLeft", label: "Align Left" },
            { icon: AlignCenter, command: "justifyCenter", label: "Align Center" },
            { icon: AlignRight, command: "justifyRight", label: "Align Right" },
            { icon: AlignJustify, command: "justifyFull", label: "Justify" },
        ];

        const listButtons = [
            { icon: List, command: "insertUnorderedList", label: "Bullet List" },
            { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
        ];

        // Handle list toggle
        const handleListToggle = useCallback((command: string) => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            document.execCommand(command, false);
            updateFormattingState();
            if (onChange) {
                onChange(editorRef.current.innerHTML);
            }
        }, [onChange, updateFormattingState]);

        // Handle keyboard shortcuts
        const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        execCommand('underline');
                        break;
                }
            }
        }, [execCommand]);



        // Handle image insertion
        const handleInsertImage = useCallback(() => {
            if (!imageFile) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target?.result as string;
                const img = `<img src="${imgSrc}" alt="${imageAlt || imageFile.name}" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
                document.execCommand('insertHTML', false, img);
                
                if (onChange && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                }
            };
            reader.readAsDataURL(imageFile);
            
            setImageDialogOpen(false);
            setImageFile(null);
            setImageAlt("");
        }, [imageFile, imageAlt, onChange]);

        return (
            <>
                <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
                    {/* Toolbar */}
                    <TooltipProvider>
                    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
                        {/* Font Family */}
                        <Select onValueChange={(value) => execCommand("fontName", value)} defaultValue="Arial">
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue placeholder="Font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Courier New">Courier New</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Font Size */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2">
                                    <span className="text-xs">{currentFontSize}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {[
                                    { label: '8pt', value: '1' },
                                    { label: '10pt', value: '2' },
                                    { label: '12pt', value: '3' },
                                    { label: '14pt', value: '4' },
                                    { label: '18pt', value: '5' },
                                    { label: '24pt', value: '6' },
                                    { label: '32pt', value: '7' }
                                ].map(({ label, value }) => (
                                    <DropdownMenuItem key={value} onClick={() => execCommand("fontSize", value)}>
                                        <span className="text-xs">{label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Format Type */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 min-w-[90px] justify-between">
                                    <span className="text-xs truncate">{currentFormat}</span>
                                    <ChevronDown className="h-3 w-3 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => execCommand("formatBlock", "<p>")}>
                                    Normal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand("formatBlock", "<h1>")}>
                                    <span className="text-xl font-bold">Heading 1</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand("formatBlock", "<h2>")}>
                                    <span className="text-lg font-bold">Heading 2</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => execCommand("formatBlock", "<h3>")}>
                                    <span className="text-base font-bold">Heading 3</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Text Formatting */}
                        {formatButtons.map(({ icon: Icon, command, label }) => (
                            <Tooltip key={command}>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={activeFormats.has(command) ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => execCommand(command)}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        ))}

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Alignment */}
                        {alignButtons.map(({ icon: Icon, command, label }) => (
                            <Tooltip key={command}>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={activeFormats.has(command) ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => execCommand(command)}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        ))}

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Lists */}
                        {listButtons.map(({ icon: Icon, command, label }) => (
                            <Tooltip key={command}>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant={activeFormats.has(command) ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleListToggle(command)}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        ))}

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Link */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const url = prompt("Enter URL:");
                                        if (url) {
                                            const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${url}</a>&nbsp;`;
                                            document.execCommand('insertHTML', false, linkHtml);
                                            if (onChange && editorRef.current) {
                                                onChange(editorRef.current.innerHTML);
                                            }
                                        }
                                    }}
                                >
                                    <Link className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Insert Link</TooltipContent>
                        </Tooltip>

                        {/* Image */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setImageDialogOpen(true)}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Insert Image</TooltipContent>
                        </Tooltip>

                        {/* Code Block */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => execCommand("formatBlock", "pre")}
                                >
                                    <Code className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Code Block</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>

                {/* Editor Content */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "min-h-[120px] max-h-[300px] overflow-y-auto p-4 outline-none focus:ring-0",
                        "prose prose-sm max-w-none",
                        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:opacity-50",
                        "[&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a]:hover:text-blue-800",
                        "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2",
                        "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2",
                        "[&_li]:my-1"
                    )}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                    spellCheck
                />
                </div>

                {/* Image Dialog */}
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Insert Image</DialogTitle>
                        <DialogDescription>
                            Upload an image from your computer
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="image-file">Image File *</Label>
                            <Input
                                id="image-file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setImageFile(file);
                                }}
                            />
                            {imageFile && (
                                <p className="text-xs text-muted-foreground">
                                    Selected: {imageFile.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image-alt">Alt Text (optional)</Label>
                            <Input
                                id="image-alt"
                                placeholder="Description of the image"
                                value={imageAlt}
                                onChange={(e) => setImageAlt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && imageFile) {
                                        handleInsertImage();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {
                            setImageDialogOpen(false);
                            setImageFile(null);
                            setImageAlt("");
                        }}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleInsertImage} disabled={!imageFile}>
                            Insert Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </>
        );
    }
);

RichTextEditor.displayName = "RichTextEditor";
