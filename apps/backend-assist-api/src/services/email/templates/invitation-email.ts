export const invitationEmailHtml = (
  invitationUrl: string,
  organizationName: string,
  inviterName: string,
  role: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation - ${organizationName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 28px;
            font-weight: bold;
        }
        .title {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
            margin: 0;
        }
        .invitation-details {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
        }
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #d1d5db;
        }
        .detail-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 14px;
        }
        .detail-value {
            color: #8b5cf6;
            font-weight: 600;
            font-size: 14px;
        }
        .role-badge {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .content {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.7;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 30px 0;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .cta-container {
            text-align: center;
        }
        .link-backup {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-top: 25px;
            font-size: 13px;
        }
        .link-backup a {
            color: #8b5cf6;
            word-break: break-all;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 13px;
        }
        .expiry {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            color: #92400e;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">V</div>
            <h1 class="title">🎉 You've been invited!</h1>
            <p class="subtitle">${inviterName} invited you to join ${organizationName}</p>
        </div>

        <div class="invitation-details">
            <div class="detail-item">
                <span class="detail-label">Organization:</span>
                <span class="detail-value">${organizationName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Invited by:</span>
                <span class="detail-value">${inviterName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Your role:</span>
                <span class="role-badge">${role}</span>
            </div>
        </div>

        <div class="content">
            <p>We're excited to have you join the team at <strong>${organizationName}</strong>! Click the button below to accept your invitation and get started:</p>
        </div>

        <div class="cta-container">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="link-backup">
            <p style="margin: 0 0 8px 0;"><strong>Can't click the button?</strong></p>
            <p style="margin: 0;">Copy and paste this link into your browser:</p>
            <p style="margin: 8px 0 0 0;"><a href="${invitationUrl}">${invitationUrl}</a></p>
        </div>

        <div class="expiry">
            <strong>⏰ This invitation expires in 7 days.</strong> Make sure to accept it before it expires!
        </div>

        <div class="footer">
            <p>If you have any questions, feel free to reach out to ${inviterName} or our support team.</p>
            <p style="margin-top: 15px;">Best regards,<br><strong>The Veblika Team</strong></p>
        </div>
    </div>
</body>
</html>
`
}
