import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface LoginCodeEmailProps {
  loginCode: string;
  siteName?: string;
}

const LoginCodeEmail = ({
  loginCode,
  siteName = "Quranic Complex",
}: LoginCodeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Login Code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Your Login Code</Heading>
        <Section style={section}>
          <Text style={text}>
            Enter the following code on the login page to sign in to your{" "}
            {siteName} account:
          </Text>
          <Text style={codeStyle}>{loginCode}</Text>
          <Text style={text}>
            This code will expire in 10 minutes.
          </Text>
          <Text style={text}>
            If you didn't request this code, you can safely ignore this email.
            Someone else might have typed your email address by mistake.
          </Text>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default LoginCodeEmail;

// Styles (similar to VerifyEmail, adjust as needed)
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

const codeStyle = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
  letterSpacing: "4px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
