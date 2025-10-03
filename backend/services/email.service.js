import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email,
  userName,
  verificationToken
) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "🎨 Verify Your Email - Art Auction",
      html: getVerificationEmailTemplate(userName, verificationUrl),
    });

    if (error) {
      console.error("Resend Error:", error);
      throw new Error("Failed to send verification email");
    }

    console.log("✅ Verification email sent:", data);
    return data;
  } catch (error) {
    console.error("Email Service Error:", error);
    throw error;
  }
};

/**
 * Email template for verification
 */
const getVerificationEmailTemplate = (userName, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎨 Art Auction</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                      Hello ${userName}!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Thank you for registering at Art Auction. Please verify your email address to activate your account.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Click the button below to verify your email address:
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${verificationUrl}" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      Or copy this link to your browser:<br>
                      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">
                        ${verificationUrl}
                      </a>
                    </p>
                    
                    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      <strong>Important:</strong> This link is valid for 24 hours only.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 14px;">
                      If you didn't sign up, please ignore this email.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Art Auction. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
