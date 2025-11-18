export const invitationEmailHtml = async (
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
            background-color: #007bff;
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .title {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .invitation-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-item:last-child {
            margin-bottom: 0;
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        .detail-value {
            color: #007bff;
            font-weight: 500;
        }
        .role-badge {
            background-color: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        .cta-button:hover {
            background-color: #0056b3;
        }
        .cta-container {
            text-align: center;
            margin: 30px 0;
        }
        .link-backup {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #007bff;
        }
        .link-backup p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .link-backup a {
            color: #007bff;
            word-break: break-all;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
            font-size: 14px;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">V</div>
            <h1 class="title">You've been invited to join our team!</h1>
            <p class="subtitle">${inviterName} has invited you to join ${organizationName}</p>
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

        <p>We're excited to have you join our team! Click the button below to accept your invitation and get started:</p>

        <div class="cta-container">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="link-backup">
            <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
            <p><a href="${invitationUrl}">${invitationUrl}</a></p>
        </div>

        <div class="expiry-notice">
            <strong>⏰ This invitation expires in 7 days.</strong> Make sure to accept it before it expires!
        </div>

        <div class="footer">
            <p>If you have any questions, feel free to reach out to ${inviterName} or our support team.</p>
            <p>Best regards,<br>The Veblika Team</p>
        </div>
    </div>
</body>
</html>
`
}
