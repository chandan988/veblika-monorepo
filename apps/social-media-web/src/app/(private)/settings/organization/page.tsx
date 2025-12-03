"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function OrganizationSettingsPage() {
  const [organizationName, setOrganizationName] = React.useState("Demo organization name")
  const [industry, setIndustry] = React.useState<string | undefined>(undefined)
  const [website, setWebsite] = React.useState("")

  function onSave(e: React.FormEvent) {
    e.preventDefault()
    // Replace with API call / persistence logic
    console.log({ organizationName, industry, website })
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Organization settings</h1>
        <p className="text-muted-foreground">Edit Organisation settings</p>
      </header>

      <Card className="rounded-lg">
        <CardContent>
          <form onSubmit={onSave} className="grid gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
              <div>
                <h3 className="font-medium">Organization Name</h3>
                <p className="text-sm text-muted-foreground">Set your organization name</p>
              </div>
              <div className="md:col-span-2">
                <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
              </div>
            </div>

            <div className="border-t" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
              <div>
                <h3 className="font-medium">Industry</h3>
                <p className="text-sm text-muted-foreground">Set Industry Type</p>
              </div>
              <div className="md:col-span-2">
                <Select value={industry} onValueChange={(v) => setIndustry(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Industry Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
              <div>
                <h3 className="font-medium">Website (Optional)</h3>
                <p className="text-sm text-muted-foreground">Set your website address</p>
              </div>
              <div className="md:col-span-2">
                <Input placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
            </div>

            <div className="border-t" />

            <div className="flex justify-end">
              <Button type="submit" className="bg-orange-500">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
