
Project -> apps/backend-assist-api , apps/backend-assist-web
Flow 1: Inviting a New User (No Account)
1. Admin sends invite → 2. User receives email → 3. User clicks link → 
4. Redirect to signup → 5. User creates account → 6. Auto-add to org → 
7. User lands in dashboard


Flow 2: Inviting Existing User (Has Account)
1. Admin sends invite → 2. User receives email → 3. User clicks link → 
4. Auto-add to org → 5. User lands in dashboard with new org context



Step 1: Admin Sends Invitation
{
  email: "newuser@example.com",
  orgId: "org_id_here",
  roleId: "role_id_here"
}

Backend:
1. Validate permissions (member:add)
2. Check if member is already exist or not if exist return with message user already exits in this organisation
3. Check if email already in organisation -> use internal api from auth service to check if user exists or not create internal api in auth service apps/auth
4. Create invitation record in database
5. Send email with magic link
6. Return success response

// Email Template

write an email template for invitation
[Accept Invitation Button] → https://app.com/accept-invite?id={invitationId}

Step 2: User Clicks Invitation Link

1. Validate invitation (not expired, status=pending) public api for getting invitation by id in invitation collection have in invitation data has info about user exists or not
2. 
   
   IF USER DOES NOT HAVE ACCOUNT:
     a. Redirect to /signup?inviteToken=xxx
     b. Pre-fill email from invitation
     c. User completes signup
     d. After signup → auto-accept invitation
   
   IF USER HAS ACCOUNT:
     a. Check if logged-in email matches invitation email
     b. If match → accept invitation
     c. If no match → show error or allow accept with current account


After User successfully logged In
Step 3: Accept Invitation (Backend)
Backend:
1. Get invitation details
2. Create Member record
3. Update invitation status to 'accepted'
4. Return success with redirect URL


(If you think something extra should be implemented, you can — just make sure it’s actually worth it.)