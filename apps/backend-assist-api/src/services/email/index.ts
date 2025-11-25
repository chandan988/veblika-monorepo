import nodemailer from "nodemailer"

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

interface EmailProvider {
  sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: unknown }>
  name: string
}

class NodemailerEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter
  public name = "nodemailer"

  constructor(config: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }) {
    this.transporter = nodemailer.createTransport(config)
  }

  async sendEmail(options: EmailOptions) {
    try {
      const { to, subject, html, text, from, replyTo, attachments } = options

      const result = await this.transporter.sendMail({
        from: from || process.env.DEFAULT_FROM_EMAIL || "noreply@veblika.com",
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text,
        replyTo,
        attachments,
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      console.error("Email send error:", error)
      return {
        success: false,
        error,
      }
    }
  }
}

export const emailService = new NodemailerEmailProvider({
  host: process.env.SMTP_HOST || "email-smtp.ap-south-1.amazonaws.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true" || false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
})
