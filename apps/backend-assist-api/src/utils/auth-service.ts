import { config } from "../config"

export interface UserInfo {
  _id: string
  name: string
  email: string
  image?: string
}

/**
 * Fetches user information from the auth service for the given user IDs
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId to UserInfo for efficient lookups
 */
export async function fetchUsersFromAuthService(
  userIds: string[]
): Promise<Map<string, UserInfo>> {
  const userMap = new Map<string, UserInfo>()

  if (userIds.length === 0) {
    return userMap
  }

  try {
    const authServiceUrl = config.auth.authUrl
    const response = await fetch(`${authServiceUrl}/api/internal/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: userIds }),
    })

    if (!response.ok) {
      console.error(
        `Failed to fetch users from auth service: ${response.status} ${response.statusText}`
      )
      return userMap
    }

    const users = await response.json()

    if (Array.isArray(users)) {
      users.forEach((user) => {
        userMap.set(user._id.toString(), {
          ...user,
          _id: user._id.toString(),
          name: user.name || "Unknown User",
          email: user.email || "",
        })
      })
    }

    return userMap
  } catch (error) {
    console.error("Error fetching users from auth service:", error)
    return userMap
  }
}
