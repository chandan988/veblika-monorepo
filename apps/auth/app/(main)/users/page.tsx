import { UserManagement } from "@/components/user-management/user-management"

export default function UsersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all users in your application
        </p>
      </div>
      <UserManagement />
    </div>
  )
}
