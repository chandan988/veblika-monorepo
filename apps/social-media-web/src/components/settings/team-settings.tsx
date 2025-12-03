"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Member = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
}

export function TeamSettings() {
  const [members] = React.useState<Member[]>([
    { id: "1", name: "Liam Johnson", email: "liam@example.com", role: "Admin", phone: "4774927927942" },
    { id: "2", name: "Olivia Smith", email: "olivia@example.com", role: "Manager", phone: "34273647236" },
    { id: "3", name: "Noah Williams", email: "noah@example.com", role: "Agent", phone: "34723479" },
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Team Settings</h1>
      <p className="text-sm text-muted-foreground">Manage, invite and view team members</p>

      <Card className="mt-6 p-4">
        <h3 className="font-semibold">Invite new members</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input placeholder="Enter Member's email" />
          <Input placeholder="Phone number" />
          <div className="flex items-center gap-2">
            <select className="rounded-md border px-3 py-2">
              <option>Active</option>
            </select>
            <Button className="ml-auto">Send Invite</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Team Members</h3>
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." />
            <Button variant="outline">Filter</Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="divide-y">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-muted-foreground">{m.email}</div>
                </div>
                <div className="flex items-center gap-6">
                  <Badge>{m.role.toUpperCase()}</Badge>
                  <div className="text-sm text-muted-foreground">{m.phone}</div>
                  <div className="text-sm text-green-600">Active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TeamSettings
