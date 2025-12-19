import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  render,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import * as React from "react"

interface OtpEmailProps {
  otp: string
  name: string
}

const OtpEmail = ({ otp, name }: OtpEmailProps) => {
  const previewText = `Your Veblika OTP Code`

  return (
    <Html>
      <Head />
      <Preview>Your Veblika OTP Code - Valid for 10 minutes</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 w-[465px]">
            <Section className="mt-8 text-center">
              <Text className="text-2xl font-bold text-[#25D366]">Veblika</Text>
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Your One-Time Password (OTP)
            </Heading>
            <Text className="text-black text-[14px] leading-6">
              Hello {name || "User"},
            </Text>
            <Text className="text-black text-[14px] leading-6">
              Use the following OTP to complete your action. This OTP is valid
              for 10 minutes.
            </Text>
            <Section className="bg-gray-100 rounded-md p-4 my-5 text-center">
              <Text className="text-black text-[28px] font-bold tracking-[8px] m-0">
                {otp}
              </Text>
            </Section>
            <Text className="text-black text-[14px] leading-6">
              {`If you didn't request this OTP, please ignore this email or
              contact support if you have concerns.`}
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-6">
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

export async function otpEmailHtml(otp: string, name: string) {
  return await render(<OtpEmail otp={otp} name={name} />)
}
