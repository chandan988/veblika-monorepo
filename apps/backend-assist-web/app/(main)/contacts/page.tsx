"use client";

import { useState } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@workspace/ui/components/table";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Search, User, Mail, Phone, Globe, Calendar } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";

// TODO: Get from auth context
const MOCK_ORG_ID = "673eccb20c9f6b5ea8dac49f";

export default function ContactsPage() {
    const [search, setSearch] = useState("");
    const { data: contactsData, isLoading } = useContacts({
        orgId: MOCK_ORG_ID,
        search: search,
        limit: 50,
    });

    const contacts = contactsData?.data || [];
    const pagination = contactsData?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer contacts and relationships
                    </p>
                </div>
                <Button>Add Contact</Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search contacts..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                </TableRow>
                            ))
                        ) : contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No contacts found
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact: any) => (
                                <TableRow key={contact._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {contact.name || "Unknown"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {contact.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {contact.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {contact.phone}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {contact.source && (
                                            <Badge variant="secondary" className="capitalize">
                                                {contact.source}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(contact.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {pagination && (
                <div className="text-xs text-muted-foreground text-center">
                    Showing {contacts.length} of {pagination.total} contacts
                </div>
            )}
        </div>
    );
}
