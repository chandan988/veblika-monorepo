export default function KnowledgeBasePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                <p className="text-muted-foreground">
                    Create and manage help articles for your customers
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Total Articles</h3>
                    <p className="text-3xl font-bold mt-2">156</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Published</h3>
                    <p className="text-3xl font-bold mt-2">142</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Draft</h3>
                    <p className="text-3xl font-bold mt-2">14</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Views This Month</h3>
                    <p className="text-3xl font-bold mt-2">8.2k</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Categories</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {["Getting Started", "Account Management", "Billing", "Troubleshooting", "API Documentation", "Best Practices"].map((category) => (
                        <div key={category} className="rounded-lg border bg-card p-4">
                            <h3 className="font-medium">{category}</h3>
                            <p className="text-sm text-muted-foreground mt-1">12 articles</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
