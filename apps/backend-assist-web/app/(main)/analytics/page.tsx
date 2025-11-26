export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Insights and performance metrics
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Total Conversations</h3>
                    <p className="text-3xl font-bold mt-2">1,234</p>
                    <p className="text-sm text-green-600 mt-1">+12% from last month</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Avg Resolution Time</h3>
                    <p className="text-3xl font-bold mt-2">4.5h</p>
                    <p className="text-sm text-green-600 mt-1">-8% from last month</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Customer Satisfaction</h3>
                    <p className="text-3xl font-bold mt-2">94%</p>
                    <p className="text-sm text-green-600 mt-1">+3% from last month</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Active Users</h3>
                    <p className="text-3xl font-bold mt-2">567</p>
                    <p className="text-sm text-green-600 mt-1">+18% from last month</p>
                </div>
            </div>
        </div>
    )
}
