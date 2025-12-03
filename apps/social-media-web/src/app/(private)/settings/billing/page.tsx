"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "@/components/ui/icons"

const plans = [
  {
    id: "crm",
    title: "CRM (Lead Management)",
    priceYearly: "₹9,999",
    bullets: ["Inbox", "Manage", "Integrations"],
  },
  {
    id: "wa",
    title: "Whatsapp Automation",
    badge: "POPULAR",
    priceYearly: "₹24,999",
    bullets: ["Inbox", "Campaign", "Integrations", "Social Media", "Gallery", "Automations"],
  },
  {
    id: "workflow",
    title: "Workflow Automation",
    priceYearly: "₹49,999",
    bullets: ["Inbox", "Campaign", "Integrations", "Social Media", "Gallery", "Automations"],
  },
]

export default function BillingPage() {
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">("yearly")

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-muted-foreground mt-1">Choose a right plan for you</p>
      </header>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">Monthly</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="relative inline-flex h-6 w-12 items-center rounded-full bg-muted p-1"
            aria-label="Toggle billing period"
          >
            <span className={`h-4 w-4 rounded-full bg-orange-500 transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-muted-foreground">Yearly <span className="ml-2 text-xs text-green-600">(Save More)</span></span>
        </div>

        <div>
          <Button variant="secondary">View International Plans</Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="p-6 h-full">
            <CardHeader className="flex items-start justify-between p-0">
              <div>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">{billingPeriod === 'yearly' ? `${p.priceYearly} /Yearly` : 'Contact us'}</CardDescription>
              </div>
              {p.badge && <Badge className="ml-2 bg-orange-100 text-orange-700">{p.badge}</Badge>}
            </CardHeader>

            <CardContent className="p-0 mt-6 flex flex-col justify-between h-full">
              <div className="mb-6">
                <div className="text-2xl font-semibold">{p.priceYearly}</div>
                <div className="text-xs text-muted-foreground">Incl. 0% GST</div>
                <p className="text-sm text-muted-foreground mt-2">{p.title} — Built for teams that want clarity, speed, and results.</p>
              </div>

              <div className="divide-y divide-border rounded-md overflow-hidden bg-background flex-1">
                {p.bullets.map((b) => (
                  <div key={b} className="flex items-center justify-between gap-2 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-green-100 p-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </span>
                      <span>{b}</span>
                    </div>
                    <div className="text-muted-foreground">{/* chevron or toggle icon */}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button className="w-full bg-orange-500">Buy now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}