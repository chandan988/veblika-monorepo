export const verificationEmailHtml = (url: string, name: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Veblika</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            font-size: 15px;
            margin: 0;
        }
        .content {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.7;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            color: #10b981;
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
            <h1 class="title">Verify Your Email Address</h1>
            <p class="subtitle">Welcome to Veblika!</p>
        </div>

        <div class="content">
            <p>Hello <strong>${name || "there"}</strong>,</p>
            <p>Thanks for signing up for Veblika! We're thrilled to have you join us. To complete your registration and access all features, please verify your email address by clicking the button below.</p>
        </div>

        <div class="cta-container">
            <a href="${url}" class="cta-button">Verify Email Address</a>
        </div>

        <div class="link-backup">
            <p style="margin: 0 0 8px 0;"><strong>Can't click the button?</strong></p>
            <p style="margin: 0;">Copy and paste this link into your browser:</p>
            <p style="margin: 8px 0 0 0;"><a href="${url}">${url}</a></p>
        </div>

        <div class="expiry">
            <strong>⏰ This verification link expires in 24 hours.</strong>
        </div>

        <div class="footer">
            <p>If you didn't create an account with Veblika, you can safely ignore this email.</p>
            <p style="margin-top: 15px;">Best regards,<br><strong>The Veblika Team</strong></p>
        </div>
    </div>
</body>
</html>
`
}
