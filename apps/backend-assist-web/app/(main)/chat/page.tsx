export default function ChatPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
                <p className="text-muted-foreground">
                    Real-time customer conversations
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Active Chats</h3>
                    <p className="text-3xl font-bold mt-2">8</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Waiting</h3>
                    <p className="text-3xl font-bold mt-2">3</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Avg Response Time</h3>
                    <p className="text-3xl font-bold mt-2">2m</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Today's Chats</h3>
                    <p className="text-3xl font-bold mt-2">45</p>
                </div>
            </div>
        </div>
    )
}
