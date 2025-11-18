import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function OverviewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          High-level view of your workspace performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>Active and completed projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <div className="flex gap-2 mt-2">
              <span className="text-sm text-green-600">18 Active</span>
              <span className="text-sm text-muted-foreground">6 Completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Productivity</CardTitle>
            <CardDescription>Average tasks completed per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8.5</div>
            <p className="text-sm text-muted-foreground mt-2">
              +15% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Items awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-muted-foreground mt-2">
              3 high priority
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Your workspace at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">This Week</span>
              <span className="text-sm text-muted-foreground">42 tasks completed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">This Month</span>
              <span className="text-sm text-muted-foreground">187 tasks completed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-green-600">94.2%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
