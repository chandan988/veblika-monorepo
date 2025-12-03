"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  DotsVertical,
  Filter as FilterIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Plus as PlusIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ComboboxCountry from "@/components/ui/combobox-country";
import * as React from "react";
import { Ban, CircleCheck, Delete, PauseCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
  status: "active" | "suspended" | "blocked";
};

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Liam Johnson",
    email: "liam@example.com",
    phone: "4774927927942",
    role: "ADMIN",
    status: "active",
  },
  {
    id: "2",
    name: "Olivia Smith",
    email: "olivia@example.com",
    phone: "34273647236",
    role: "MANAGER",
    status: "active",
  },
  {
    id: "3",
    name: "Noah Williams",
    email: "noah@example.com",
    phone: "34723479",
    role: "AGENT",
    status: "active",
  },
  {
    id: "4",
    name: "Emma Brown",
    email: "emma@example.com",
    phone: "3423946869",
    role: "ADMIN",
    status: "active",
  },
  {
    id: "5",
    name: "Liam Johnson",
    email: "liam@example.com",
    phone: "42387462793649",
    role: "ADMIN",
    status: "active",
  },
  {
    id: "6",
    name: "Liam Johnson",
    email: "liam@example.com",
    phone: "2384928364",
    role: "ADMIN",
    status: "active",
  },
  {
    id: "7",
    name: "Olivia Smith",
    email: "olivia@example.com",
    phone: "2739487234982",
    role: "ADMIN",
    status: "active",
  },
];

export default function TeamSettingsPage() {
  const [countryCode, setCountryCode] = React.useState("+91");
  const [members, setMembers] = React.useState<Member[]>(initialMembers);
  const [memberToDelete, setMemberToDelete] = React.useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  function openDeleteDialog(m: Member) {
    setMemberToDelete(m);
    setIsDialogOpen(true);
  }

  function confirmDelete() {
    if (!memberToDelete) return;
    setMembers((prev) => prev.filter((x) => x.id !== memberToDelete.id));
    setMemberToDelete(null);
    setIsDialogOpen(false);
  }

  function cancelDelete() {
    setMemberToDelete(null);
    setIsDialogOpen(false);
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-pretty text-2xl font-semibold">Team Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage, invite and view team members
        </p>
      </header>

      {/* Invite new members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invite new members</CardTitle>
          <CardDescription>
            Send an invite to add teammates to your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                placeholder="Enter member's email"
                type="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="flex items-center gap-2">
                <ComboboxCountry
                  onChange={setCountryCode}
                  value={countryCode}
                />
                <Input placeholder="Enter number" type="tel" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select defaultValue="member">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="gap-2 bg-transparent"
              >
                <PlusIcon /> Add multiple members
              </Button>
              <Button type="submit" color="primary" className="gap-2">
                <SendIcon /> Send Invite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Team Members</CardTitle>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search..."
                aria-label="Search team members"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <FilterIcon /> Filter
            </Button>
            <Button variant="ghost" aria-label="More actions">
              <DotsVertical />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-medium uppercase text-muted-foreground">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase text-muted-foreground">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={
                      idx !== members.length - 1
                        ? "border-b border-border/70"
                        : undefined
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {m.name}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {m.email}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      {/* <Badge
                        variant={m.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="px-3 py-1 text-[10px] rounded-md"
                      >
                        {m.role}
                      </Badge> */}
                      <Badge
                        className={`${
                          m.role === "ADMIN"
                            ? "bg-red-100 text-red-600"
                            : m.role === "MANAGER"
                            ? "bg-orange-100 text-orange-500"
                            : "bg-violet-100 text-violet-600"
                        } rounded-sm px-3 py-1`}
                      >
                        {m.role.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 align-middle">{m.phone}</td>

                    <td className="px-6 py-4 align-middle">
                      <Select
                        defaultValue={m.status}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <CircleCheck className="h-4 w-4 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2">
                              <PauseCircle className="h-4 w-4 text-yellow-500" />
                              Suspended
                            </div>
                          </SelectItem>
                          <SelectItem value="blocked">
                            <div className="flex items-center gap-2">
                              <Ban className="h-4 w-4 text-red-500" />
                              Blocked
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${m.name}`}
                          className="h-8 w-8 p-0"
                          onClick={() => openDeleteDialog(m)}
                        >
                          <Trash2 color="red" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelDelete}>No</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Yes, delete</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </main>
  );
}
