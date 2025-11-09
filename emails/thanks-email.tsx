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

interface ThanksEmailProps {
  name: string;
  siteName?: string;
}

const ThanksEmail = ({
  name,
  siteName = "Quranic Complex",
}: ThanksEmailProps) => (
  <Html>
    <Head />
    <Preview>Thank You for Your Donation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Thank You for Your Donation</Heading>
        <Section style={section}>
          <Text style={text}>Dear {name},</Text>
          <Text style={text}>
            Thank you for your generous donation to {siteName}. Your
            support helps us continue our mission.
          </Text>
          <Text style={text}>
            We have received your donation and will be processing it shortly.
            You will receive a confirmation once your donation has been
            processed.
          </Text>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ThanksEmail;

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

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
