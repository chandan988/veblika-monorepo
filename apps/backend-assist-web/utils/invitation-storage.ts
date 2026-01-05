/**
 * Invitation storage utilities for handling pending invitations during signup/verification flows
 * Stores invitation tokens in localStorage with 10-minute expiry
 * Using localStorage instead of sessionStorage to persist across multiple browser tabs
 * (e.g., when user opens email verification link in a new tab)
 */

const STORAGE_KEY = 'pending_invitation';
const EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export interface PendingInvitation {
  inviteToken: string;
  email: string;
  role?: 'admin' | 'user';
  userExists?: boolean;
  expiresAt: number;
}

/**
 * Save invitation token to localStorage with expiry time
 * Uses localStorage to persist across browser tabs (important for email verification flow)
 */
export function saveInvitation(inviteToken: string, email: string, role?: 'admin' | 'user', userExists?: boolean): void {
  try {
    const invitation: PendingInvitation = {
      inviteToken,
      email,
      role: role || 'user',
      userExists: userExists ?? false,
      expiresAt: Date.now() + EXPIRY_DURATION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation));
  } catch (error) {
    console.error('Failed to save invitation to localStorage:', error);
  }
}

/**
 * Get invitation token from localStorage if not expired
 * Returns null if expired or not found
 */
export function getInvitation(): PendingInvitation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const invitation: PendingInvitation = JSON.parse(stored);
    
    if (isInvitationExpired(invitation)) {
      clearInvitation();
      return null;
    }

    return invitation;
  } catch (error) {
    console.error('Failed to get invitation from localStorage:', error);
    return null;
  }
}

/**
 * Clear invitation from localStorage
 */
export function clearInvitation(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear invitation from localStorage:', error);
  }
}

/**
 * Check if invitation has expired
 */
export function isInvitationExpired(invitation: PendingInvitation): boolean {
  return Date.now() > invitation.expiresAt;
}

/**
 * Refresh invitation expiry time (call this to extend the expiry when user is actively interacting)
 */
export function refreshInvitationExpiry(): void {
  try {
    const invitation = getInvitation();
    if (invitation) {
      invitation.expiresAt = Date.now() + EXPIRY_DURATION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation));
    }
  } catch (error) {
    console.error('Failed to refresh invitation expiry:', error);
  }
}
