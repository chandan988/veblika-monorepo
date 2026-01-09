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

/**
 * Fetches a single user by ID from the auth service
 * @param userId - User ID to fetch
 * @returns UserInfo or null if not found
 */
export async function fetchUserById(
  userId: string
): Promise<UserInfo | null> {
  try {
    const userMap = await fetchUsersFromAuthService([userId])
    return userMap.get(userId) || null
  } catch (error) {
    console.error("Error fetching user by ID from auth service:", error)
    return null
  }
}

export interface CheckUserByEmailResult {
  exists: boolean
  userId: string | null
  user?: UserInfo
}

/**
 * Checks if a user exists by email in the auth service
 * @param email - Email address to check
 * @returns Object with exists flag, userId, and optional user info
 */
export async function checkUserByEmail(
  email: string
): Promise<CheckUserByEmailResult> {
  try {
    const authServiceUrl = config.auth.authUrl
    const response = await fetch(
      `${authServiceUrl}/api/internal/users/check-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    )

    if (!response.ok) {
      console.error(
        `Failed to check user email: ${response.status} ${response.statusText}`
      )
      return { exists: false, userId: null }
    }

    const data = await response.json()
    const exists = data.exists || false
    const userId = data.userId || null

    // If user exists, fetch full user info
    let user: UserInfo | undefined
    if (userId) {
      const userInfo = await fetchUserById(userId)
      if (userInfo) {
        user = userInfo
      }
    }

    return { exists, userId, user }
  } catch (error) {
    console.error("Error checking user email:", error)
    return { exists: false, userId: null }
  }
}
