import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Debug: Log API Key Status beim Start
console.log("📧 Email Service Initialized");
console.log(
  "   API Key:",
  process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log("   From:", process.env.EMAIL_FROM || "onboarding@resend.dev");
console.log(
  "   Client URL:",
  process.env.CLIENT_URL || "http://localhost:5173"
);

// ==========================================
// VERIFICATION EMAILS
// ==========================================

/**
 * Send email verification link to new users
 */
export const sendVerificationEmail = async (
  email,
  userName,
  verificationToken
) => {
  console.log("📧 Sending verification email to:", email);

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  console.log("🔗 Verification URL:", verificationUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "🎨 Verify Your Email - Art Auction",
      html: getVerificationEmailTemplate(userName, verificationUrl),
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log("✅ Email sent successfully! ID:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Email service error:", error);
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
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🎨 Welcome to Art Auction
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 500;">
                      Hi ${userName}!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Thank you for registering with Art Auction. To complete your registration and start bidding on amazing artworks, please verify your email address.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${verificationUrl}" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px; color: #667eea; font-size: 12px; word-break: break-all;">
                      ${verificationUrl}
                    </p>
                    
                    <!-- Important Notice -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                      Need help? Contact us at support@artauction.com
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
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

// ==========================================
// AUCTION EMAILS
// ==========================================

/**
 * 1. Bid Placed - Bestätigung für Bieter
 */
export const sendBidPlacedEmail = async (user, auction, bidAmount) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `🎨 Bid Placed - ${auction.title}`,
      html: getBidPlacedTemplate(user.userName, auction, bidAmount),
    });

    if (error) throw new Error("Failed to send bid placed email");
    console.log("✅ Bid placed email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Bid placed email error:", error);
    throw error;
  }
};

/**
 * 2. Outbid - User wurde überboten
 */
export const sendOutbidEmail = async (user, auction, oldBid, newBid) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `⚠️ You've been outbid - ${auction.title}`,
      html: getOutbidTemplate(user.userName, auction, oldBid, newBid),
    });

    if (error) throw new Error("Failed to send outbid email");
    console.log("✅ Outbid email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Outbid email error:", error);
    throw error;
  }
};

/**
 * 3. Leading Bid - User hat Höchstgebot
 */
export const sendLeadingBidEmail = async (user, auction, bidAmount) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `🏆 You're the highest bidder - ${auction.title}`,
      html: getLeadingBidTemplate(user.userName, auction, bidAmount),
    });

    if (error) throw new Error("Failed to send leading bid email");
    console.log("✅ Leading bid email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Leading bid email error:", error);
    throw error;
  }
};

/**
 * 4. Auction Won - User hat gewonnen
 */
export const sendAuctionWonEmail = async (user, auction, winningBid) => {
  const shippingUrl = `${process.env.CLIENT_URL}/shipping/${auction._id}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `🎉 Congratulations! You won - ${auction.title}`,
      html: getAuctionWonTemplate(
        user.userName,
        auction,
        winningBid,
        shippingUrl
      ),
    });

    if (error) throw new Error("Failed to send auction won email");
    console.log("✅ Auction won email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Auction won email error:", error);
    throw error;
  }
};

/**
 * 5. Auction Lost - User hat verloren
 */
export const sendAuctionLostEmail = async (
  user,
  auction,
  userBid,
  winningBid
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `😔 Auction ended - ${auction.title}`,
      html: getAuctionLostTemplate(user.userName, auction, userBid, winningBid),
    });

    if (error) throw new Error("Failed to send auction lost email");
    console.log("✅ Auction lost email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Auction lost email error:", error);
    throw error;
  }
};

/**
 * 6. Auction Ending Soon - 24h Warnung
 */
export const sendAuctionEndingSoonEmail = async (user, auction, userBid) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: user.email,
      subject: `⏰ Auction ends in 24h - ${auction.title}`,
      html: getAuctionEndingSoonTemplate(user.userName, auction, userBid),
    });

    if (error) throw new Error("Failed to send auction ending email");
    console.log("✅ Auction ending email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Auction ending email error:", error);
    throw error;
  }
};

// ==========================================
// EMAIL TEMPLATES
// ==========================================

const getBidPlacedTemplate = (userName, auction, bidAmount) => {
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
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎨 Bid Placed</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                      Hi ${userName}!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Your bid has been successfully placed on:
                    </p>
                    
                    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">
                        ${auction.title}
                      </h3>
                      <p style="margin: 5px 0; color: #666666; font-size: 16px;">
                        <strong>Your Bid:</strong> €${bidAmount.toFixed(2)}
                      </p>
                      <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                        <strong>Auction ends:</strong> ${new Date(
                          auction.endDate
                        ).toLocaleString("en-US", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      We'll notify you if someone outbids you or when the auction ends.
                    </p>
                    
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${process.env.CLIENT_URL}/auctions/${
    auction._id
  }" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            View Auction
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 14px;">
                      Good luck! 🍀
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

const getOutbidTemplate = (userName, auction, oldBid, newBid) => {
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
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⚠️ You've Been Outbid!</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                      Hi ${userName},
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Someone has placed a higher bid on:
                    </p>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">
                        ${auction.title}
                      </h3>
                      <p style="margin: 5px 0; color: #666666; font-size: 16px;">
                        <strong>Your Bid:</strong> <span style="text-decoration: line-through;">€${oldBid.toFixed(
                          2
                        )}</span>
                      </p>
                      <p style="margin: 5px 0; color: #dc2626; font-size: 18px; font-weight: bold;">
                        <strong>New Highest Bid:</strong> €${newBid.toFixed(2)}
                      </p>
                      <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                        <strong>Auction ends:</strong> ${new Date(
                          auction.endDate
                        ).toLocaleString("en-US", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Don't miss out! Place a higher bid to stay in the game.
                    </p>
                    
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);">
                          <a href="${process.env.CLIENT_URL}/auctions/${
    auction._id
  }" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            Place Higher Bid
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
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

const getLeadingBidTemplate = (userName, auction, bidAmount) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏆 You're Leading!</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333;">Hi ${userName}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      Great news! You currently have the highest bid on:
                    </p>
                    
                    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333;">${
                        auction.title
                      }</h3>
                      <p style="margin: 5px 0; color: #059669; font-size: 18px; font-weight: bold;">
                        Your Bid: €${bidAmount.toFixed(2)}
                      </p>
                      <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                        Ends: ${new Date(auction.endDate).toLocaleString(
                          "en-US",
                          { dateStyle: "full", timeStyle: "short" }
                        )}
                      </p>
                    </div>
                    
                    <p style="color: #666666;">
                      Keep an eye on this auction. We'll notify you if someone outbids you!
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

const getAuctionWonTemplate = (userName, auction, winningBid, shippingUrl) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎉 Congratulations!</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333;">You Won, ${userName}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      You are the winner of the auction:
                    </p>
                    
                    <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333;">${
                        auction.title
                      }</h3>
                      <p style="margin: 5px 0; color: #8b5cf6; font-size: 20px; font-weight: bold;">
                        Winning Bid: €${winningBid.toFixed(2)}
                      </p>
                    </div>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      <strong>Next Steps:</strong>
                    </p>
                    <ol style="color: #666666; line-height: 1.8;">
                      <li>Provide your shipping address</li>
                      <li>Complete payment</li>
                      <li>Receive your artwork</li>
                    </ol>
                    
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">
                          <a href="${shippingUrl}" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            Enter Shipping Address
                          </a>
                        </td>
                      </tr>
                    </table>
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

const getAuctionLostTemplate = (userName, auction, userBid, winningBid) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: #6b7280; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Auction Ended</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333;">Hi ${userName},</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      Unfortunately, you didn't win this auction:
                    </p>
                    
                    <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333;">${
                        auction.title
                      }</h3>
                      <p style="margin: 5px 0; color: #666666;">Your Bid: €${userBid.toFixed(
                        2
                      )}</p>
                      <p style="margin: 5px 0; color: #374151; font-weight: bold;">Winning Bid: €${winningBid.toFixed(
                        2
                      )}</p>
                    </div>
                    
                    <p style="color: #666666;">
                      Don't worry! There are many more auctions waiting for you.
                    </p>
                    
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: #6b7280;">
                          <a href="${process.env.CLIENT_URL}/auctions" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            Browse Auctions
                          </a>
                        </td>
                      </tr>
                    </table>
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

const getAuctionEndingSoonTemplate = (userName, auction, userBid) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px;">
                
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: #f59e0b; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⏰ Auction Ending Soon!</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333;">Hi ${userName}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      This auction ends in less than 24 hours:
                    </p>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #333333;">${
                        auction.title
                      }</h3>
                      <p style="margin: 5px 0; color: #666666;">Your Current Bid: €${userBid.toFixed(
                        2
                      )}</p>
                      <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">
                        Ends: ${new Date(auction.endDate).toLocaleString(
                          "en-US",
                          { dateStyle: "full", timeStyle: "short" }
                        )}
                      </p>
                    </div>
                    
                    <p style="color: #666666;">
                      Last chance to increase your bid or secure your win!
                    </p>
                    
                    <table role="presentation" style="margin: 30px auto;">
                      <tr>
                        <td style="border-radius: 6px; background: #f59e0b;">
                          <a href="${process.env.CLIENT_URL}/auctions/${
    auction._id
  }" 
                             style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                            View Auction
                          </a>
                        </td>
                      </tr>
                    </table>
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
