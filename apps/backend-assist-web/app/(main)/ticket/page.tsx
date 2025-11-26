export default function TicketPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                <p className="text-muted-foreground">
                    Manage and track customer support tickets
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Open Tickets</h3>
                    <p className="text-3xl font-bold mt-2">24</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">In Progress</h3>
                    <p className="text-3xl font-bold mt-2">12</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Resolved</h3>
                    <p className="text-3xl font-bold mt-2">156</p>
                </div>
            </div>
        </div>
    )
}
