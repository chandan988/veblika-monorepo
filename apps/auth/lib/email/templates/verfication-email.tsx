import * as React from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  render,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

interface VerificationEmailProps {
  url: string
  name: string
}

const VerificationEmail = ({ url, name }: VerificationEmailProps) => {
  const previewText = `Verify your email address for Veblika`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-gray-200 rounded-lg my-10 mx-auto p-6 max-w-md bg-white shadow-sm">
            <Section className="mt-8 text-center">
              {/* Logo placeholder - replace with actual logo */}
              <Text className="text-3xl font-bold text-green-600">Veblika</Text>
            </Section>
            <Heading className="text-gray-900 text-2xl font-semibold text-center p-0 my-8 mx-0">
              Verify Your Email Address
            </Heading>
            <Text className="text-gray-700 text-sm leading-relaxed">
              Hello {name || "there"},
            </Text>
            <Text className="text-gray-700 text-sm leading-relaxed">
              Thanks for signing up for Veblika! We're thrilled to have you join us. To complete your registration, please verify your email by clicking the button below.
            </Text>
            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-semibold no-underline text-center px-6 py-3 transition-colors"
                href={url}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-gray-700 text-sm leading-relaxed">
              If the button doesn't work, copy and paste this link into your browser:{" "}
              <Link href={url} className="text-blue-600 no-underline break-all">
                {url}
              </Link>
            </Text>
            <Hr className="border-gray-200 my-6 w-full" />
            <Text className="text-gray-500 text-xs leading-relaxed">
              If you didn't request this email, you can safely ignore it. This verification link will expire in 24 hours.
            </Text>
            <Text className="text-gray-500 text-xs leading-relaxed">
              Best regards,<br />
              The Veblika Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const verificationEmailHtml = async (url: string, name: string) => {
  const html = await render(<VerificationEmail url={url} name={name} />)
  return html
}
