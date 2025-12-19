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
import * as React from "react"

interface ResetPasswordEmailProps {
  url: string
  name: string
}

const ResetPasswordEmail = ({ url, name }: ResetPasswordEmailProps) => {
  const previewText = `Reset your Veblika password`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px] text-center">
              <Text className="text-2xl font-bold text-[#25D366]">Veblika</Text>
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Reset Your Password
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {name || "User"},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We received a request to reset the password for your Veblika
              account. If you made this request, please click the button below
              to set a new password. This link will expire in 1 hour.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#25D366] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={url}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Or copy and paste this URL into your browser:{" "}
              <Link href={url} className="text-blue-600 no-underline">
                {url}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you did not request a password reset, please ignore this email
              or contact support if you have concerns.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Best,
              <br />
              The Veblika Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const resetPasswordHtml = async (url: string, name: string) => {
  const html = await render(<ResetPasswordEmail url={url} name={name} />)
  return html
}
