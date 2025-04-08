import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
  verificationLink: string;
  siteName?: string;
}

const VerifyEmail = ({
  verificationLink,
  siteName = "Quranic Complex",
}: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Verify Your Email Address</Heading>
        <Section style={section}>
          <Text style={text}>
            Welcome to {siteName}! Please click the button below to verify your
            email address and complete your registration.
          </Text>
          <Button style={button} href={verificationLink}>
            Verify Email
          </Button>
          <Text style={text}>
            If you cannot click the button, copy and paste this link into your
            browser:
          </Text>
          <Link href={verificationLink} style={link}>
            {verificationLink}
          </Link>
          <Text style={text}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerifyEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e6ebf1",
  borderRadius: "5px",
};

const heading = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const section = {
  padding: "0 48px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  margin: "20px 0",
};

const link = {
  color: "#5e6ad2",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
