"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link,
    Image,
    Paperclip,
    Send,
    Loader2,
    ChevronDown,
    ChevronUp,
    X,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Quote,
    Code,
    Undo,
    Redo, 
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

interface TicketEmailComposerProps {
    defaultTo?: string
    defaultSubject?: string
    defaultCc?: string
    defaultBcc?: string
    isReply?: boolean
    onSend: (data: {
        to: string
        subject: string
        body: string
        htmlBody: string
        cc?: string
        bcc?: string
    }) => void
    onCancel: () => void
    isSending?: boolean
}

export function TicketEmailComposer({
    defaultTo = "",
    defaultSubject = "",
    defaultCc = "",
    defaultBcc = "",
    isReply = false,
    onSend,
    onCancel,
    isSending = false,
}: TicketEmailComposerProps) {
    const [to, setTo] = useState(defaultTo)
    const [subject, setSubject] = useState(isReply ? `Re: ${defaultSubject}` : defaultSubject)
    const [cc, setCc] = useState(defaultCc)
    const [bcc, setBcc] = useState(defaultBcc)
    const [showCcBcc, setShowCcBcc] = useState(false)

    const editorRef = useRef<HTMLDivElement>(null)

    // Execute formatting command
    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
    }, [])

    // Get HTML content from editor
    const getHtmlContent = useCallback(() => {
        return editorRef.current?.innerHTML || ""
    }, [])

    // Get plain text content
    const getPlainText = useCallback(() => {
        return editorRef.current?.innerText || ""
    }, [])

    // Handle send
    const handleSend = () => {
        if (!to.trim() || !subject.trim()) return

        const htmlBody = getHtmlContent()
        const body = getPlainText()

        if (!body.trim()) return

        onSend({
            to: to.trim(),
            subject: subject.trim(),
            body,
            htmlBody,
            cc: cc.trim() || undefined,
            bcc: bcc.trim() || undefined,
        })
    }

    // Insert link
    const insertLink = () => {
        const url = prompt("Enter URL:")
        if (url) {
            execCommand("createLink", url)
        }
    }

    // Format buttons config
    const formatButtons = [
        { icon: Bold, command: "bold", label: "Bold (⌘B)" },
        { icon: Italic, command: "italic", label: "Italic (⌘I)" },
        { icon: Underline, command: "underline", label: "Underline (⌘U)" },
    ]

    const alignButtons = [
        { icon: AlignLeft, command: "justifyLeft", label: "Align Left" },
        { icon: AlignCenter, command: "justifyCenter", label: "Align Center" },
        { icon: AlignRight, command: "justifyRight", label: "Align Right" },
    ]

    const listButtons = [
        { icon: List, command: "insertUnorderedList", label: "Bullet List" },
        { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
    ]

    return (
        <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
            {/* Header Fields */}
            <div className="p-4 space-y-3 border-b border-border bg-muted/30">
                {/* To Field */}
                <div className="flex items-center gap-3">
                    <Label className="w-12 text-sm text-muted-foreground shrink-0">To:</Label>
                    <Input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1"
                        disabled={isSending || isReply}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCcBcc(!showCcBcc)}
                        className="text-xs text-muted-foreground"
                    >
                        {showCcBcc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Cc/Bcc
                    </Button>
                </div>

                {/* Cc/Bcc Fields */}
                {showCcBcc && (
                    <>
                        <div className="flex items-center gap-3">
                            <Label className="w-12 text-sm text-muted-foreground shrink-0">Cc:</Label>
                            <Input
                                type="email"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                placeholder="cc@example.com"
                                className="flex-1"
                                disabled={isSending}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label className="w-12 text-sm text-muted-foreground shrink-0">Bcc:</Label>
                            <Input
                                type="email"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                placeholder="bcc@example.com"
                                className="flex-1"
                                disabled={isSending}
                            />
                        </div>
                    </>
                )}

                {/* Subject Field */}
                <div className="flex items-center gap-3">
                    <Label className="w-12 text-sm text-muted-foreground shrink-0">Subject:</Label>
                    <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject"
                        className="flex-1"
                        disabled={isSending}
                    />
                </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-background flex-wrap">
                <TooltipProvider delayDuration={200}>
                    {/* Font Size Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                                <Type className="h-4 w-4" />
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => execCommand("fontSize", "1")}>
                                <span className="text-xs">Small</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => execCommand("fontSize", "3")}>
                                <span className="text-sm">Normal</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => execCommand("fontSize", "5")}>
                                <span className="text-lg">Large</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => execCommand("fontSize", "7")}>
                                <span className="text-xl">Extra Large</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Text Formatting */}
                    {formatButtons.map(({ icon: Icon, command, label }) => (
                        <Tooltip key={command}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => execCommand(command)}
                                    disabled={isSending}
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
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => execCommand(command)}
                                    disabled={isSending}
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
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => execCommand(command)}
                                    disabled={isSending}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{label}</TooltipContent>
                        </Tooltip>
                    ))}

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Quote & Code */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => execCommand("formatBlock", "blockquote")}
                                disabled={isSending}
                            >
                                <Quote className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quote</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => execCommand("formatBlock", "pre")}
                                disabled={isSending}
                            >
                                <Code className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Code Block</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Link */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={insertLink}
                                disabled={isSending}
                            >
                                <Link className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Link</TooltipContent>
                    </Tooltip>

                    {/* Attachments (placeholder) */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isSending}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach File</TooltipContent>
                    </Tooltip>

                    <div className="flex-1" />

                    {/* Undo/Redo */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => execCommand("undo")}
                                disabled={isSending}
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => execCommand("redo")}
                                disabled={isSending}
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto">
                <div
                    ref={editorRef}
                    contentEditable={!isSending}
                    className={cn(
                        "min-h-[200px] p-4 outline-none",
                        "prose prose-sm dark:prose-invert max-w-none",
                        "focus:ring-0 focus:outline-none",
                        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic",
                        "[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:text-sm",
                        "[&_a]:text-primary [&_a]:underline",
                        isSending && "opacity-50 cursor-not-allowed"
                    )}
                    onKeyDown={(e) => {
                        // Cmd/Ctrl + Enter to send
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                    data-placeholder="Compose your email..."
                    suppressContentEditableWarning
                />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Press ⌘+Enter to send</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSending}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!to.trim() || !subject.trim() || isSending}
                        className="bg-primary"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Email
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Placeholder styling */}
            <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
        </div>
    )
}
