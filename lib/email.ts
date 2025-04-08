import { Resend } from "resend";
import { render } from "@react-email/render";
import VerifyEmail from "@/emails/verify-email"; // Assuming emails dir is at root
import LoginCodeEmail from "@/emails/login-code"; // Assuming emails dir is at root

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: Replace with your verified sending domain email
const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
const siteName = process.env.NEXT_PUBLIC_APP_NAME || "Quranic Complex";

/**
 * Sends an email verification link to the user.
 * @param email - Recipient's email address.
 * @param verificationLink - The unique verification link.
 */
export const sendVerificationEmail = async (
  email: string,
  verificationLink: string
) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Skipping email sending.");
    // In development, you might want to log the link instead:
    if (process.env.NODE_ENV === "development") {
      console.log(`Verification Link for ${email}: ${verificationLink}`);
    }
    return; // Or throw an error in production if preferred
  }

  const emailHtml = await render(VerifyEmail({ verificationLink, siteName }));

  try {
    const { data, error } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [email],
      subject: `Verify your email for ${siteName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email.");
    }

    console.log("Verification email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Exception sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};

/**
 * Sends a login code to the user.
 * @param email - Recipient's email address.
 * @param loginCode - The temporary login code.
 */
export const sendLoginCodeEmail = async (email: string, loginCode: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Skipping email sending.");
    // In development, you might want to log the code instead:
    if (process.env.NODE_ENV === "development") {
      console.log(`Login Code for ${email}: ${loginCode}`);
    }
    return; // Or throw an error in production if preferred
  }

  const emailHtml = await render(LoginCodeEmail({ loginCode, siteName }));

  try {
    const { data, error } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [email],
      subject: `Your ${siteName} Login Code`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending login code email:", error);
      throw new Error("Failed to send login code email.");
    }

    console.log("Login code email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Exception sending login code email:", error);
    throw new Error("Failed to send login code email.");
  }
};
