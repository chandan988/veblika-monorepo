const nodemailer = require('nodemailer')

const host = process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com'
const port = Number(process.env.SMTP_PORT || 587)
const secure = (process.env.SMTP_SECURE === 'true') || false
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''

console.log('SMTP verify using:', { host, port, secure, user: user ? user.replace(/(.).+@/, '$1***@') : '' })

const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })

transporter.verify(function (err, success) {
  if (err) {
    console.error('SMTP verify failed:', err)
    process.exitCode = 2
  } else {
    console.log('SMTP verified successfully')
  }
})
