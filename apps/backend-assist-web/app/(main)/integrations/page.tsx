export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect your favorite tools and services
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Active Integrations</h3>
                    <p className="text-3xl font-bold mt-2">8</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Available</h3>
                    <p className="text-3xl font-bold mt-2">24</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Custom Webhooks</h3>
                    <p className="text-3xl font-bold mt-2">5</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Popular Integrations</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {["Slack", "WhatsApp", "Email", "Telegram", "Facebook", "Instagram"].map((integration) => (
                        <div key={integration} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                            <span className="font-medium">{integration}</span>
                            <button className="text-sm text-primary hover:underline">Connect</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
