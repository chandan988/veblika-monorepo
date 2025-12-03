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

  /**
   * Verify the transporter connection. Returns a safe, serializable result.
   */
  async verify() {
    try {
      const ok = await this.transporter.verify()
      return { ok: !!ok }
    } catch (err: any) {
      const safeErr: any = {
        message: err?.message,
        code: err?.code,
        response: err?.response,
        responseCode: err?.responseCode,
      }
      return { ok: false, error: safeErr }
    }
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
      // Log a concise, non-sensitive error message for debugging
      try {
        const safeErr: any = {
          message: (error as any)?.message,
          code: (error as any)?.code,
          response: (error as any)?.response,
          responseCode: (error as any)?.responseCode,
        }
        console.error("Email send error:", safeErr)
        return {
          success: false,
          error: safeErr,
        }
      } catch (e) {
        console.error("Email send unknown error", error)
        return {
          success: false,
          error: { message: 'Unknown send error' },
        }
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
