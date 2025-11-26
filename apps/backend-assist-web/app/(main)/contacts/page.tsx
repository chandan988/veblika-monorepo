export default function ContactsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
                <p className="text-muted-foreground">
                    Manage your customer contacts and relationships
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Total Contacts</h3>
                    <p className="text-3xl font-bold mt-2">2,456</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Active</h3>
                    <p className="text-3xl font-bold mt-2">1,890</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">New This Month</h3>
                    <p className="text-3xl font-bold mt-2">124</p>
                </div>
            </div>
        </div>
    )
}
