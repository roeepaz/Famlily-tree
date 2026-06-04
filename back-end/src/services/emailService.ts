import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'Kinship <noreply@example.com>';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create nodemailer transport if config is available
let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  console.log(`[SMTP init] Configuring SMTP transport to ${smtpHost}:${smtpPort} as ${smtpUser}`);
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
} else {
  console.warn(
    '⚠️ SMTP environment variables are not fully configured. Email service will run in MOCK mode (logging to console).'
  );
}

/**
 * Sends a relationship connection request email to an existing user
 */
export async function sendConnectionRequestEmail(
  targetEmail: string,
  senderName: string,
  senderEmail: string,
  relationshipType: string
): Promise<void> {
  const loginUrl = `${frontendUrl}/login`;
  const subject = `Kinship: Connection request from ${senderName}`;
  const htmlContent = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">❤️</span>
        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 12px 0 4px 0; tracking: -0.025em;">Kinship Connection Request</h2>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Stay close, archive history.</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">
          Hi there!
        </p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 12px 0 0 0;">
          <strong>${senderName}</strong> (${senderEmail}) has requested to connect with you as their <strong>${relationshipType.toLowerCase()}</strong> on Kinship.
        </p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 12px 0 0 0;">
          Accepting this connection request will fuse your family circles, letting you share life updates, keep in touch, and build your collective family history in a secure, private environment.
        </p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 14px; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.15), 0 4px 6px -4px rgba(234, 88, 12, 0.15); transition: all 0.2s;">
          View Request & Sign In
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
      
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          This invitation was sent by ${senderName} via Kinship. If you did not expect this request, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: targetEmail,
        subject,
        html: htmlContent,
        text: `Kinship Connection Request: ${senderName} (${senderEmail}) has requested to connect with you as their ${relationshipType.toLowerCase()} on Kinship. Visit ${loginUrl} to sign in and accept this request.`,
      });
      console.log(`[EMAIL SENT] Connection request sent successfully to ${targetEmail}`);
    } catch (error: any) {
      console.error(`[EMAIL ERROR] Failed to send connection request email to ${targetEmail}:`, error.message);
      throw error;
    }
  } else {
    console.log(`[MOCK EMAIL LOG]
-----------------------------------------
From: ${smtpFrom}
To: ${targetEmail}
Subject: ${subject}
Message: ${senderName} (${senderEmail}) wants to connect as your ${relationshipType.toLowerCase()}.
Action Link: ${loginUrl}
-----------------------------------------`);
  }
}

/**
 * Sends a family tree invitation email to a new user
 */
export async function sendInvitationEmail(
  targetEmail: string,
  senderName: string,
  senderEmail: string,
  relationshipType: string,
  inviteId?: string
): Promise<void> {
  const registerUrl = inviteId
    ? `${frontendUrl}/register?inviteId=${inviteId}&email=${encodeURIComponent(targetEmail)}`
    : `${frontendUrl}/register?email=${encodeURIComponent(targetEmail)}`;
  const subject = `Join ${senderName} on Kinship`;
  const htmlContent = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">🌱</span>
        <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 12px 0 4px 0; tracking: -0.025em;">You're Invited to Kinship</h2>
        <p style="font-size: 14px; color: #64748b; margin: 0;">A secure, private space for your family.</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">
          Hi there,
        </p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 12px 0 0 0;">
          <strong>${senderName}</strong> (${senderEmail}) has created a placeholder node for you as their <strong>${relationshipType.toLowerCase()}</strong> in their family tree on Kinship, and has invited you to join them.
        </p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 12px 0 0 0;">
          By registering, your profile will be securely linked to the family tree, letting you view historical milestones in the Heritage Vault, interact on the private family social feed, and build out connections with other relatives.
        </p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${registerUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 14px; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.15), 0 4px 6px -4px rgba(234, 88, 12, 0.15); transition: all 0.2s;">
          Accept Invitation & Join Tree
        </a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
      
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          This invitation was sent by ${senderName} via Kinship. If you did not expect this request, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: targetEmail,
        subject,
        html: htmlContent,
        text: `Join ${senderName} on Kinship: You have been invited to join their family tree as their ${relationshipType.toLowerCase()} on Kinship. Visit ${registerUrl} to sign up and activate your profile.`,
      });
      console.log(`[EMAIL SENT] Invitation sent successfully to ${targetEmail}`);
    } catch (error: any) {
      console.error(`[EMAIL ERROR] Failed to send invitation email to ${targetEmail}:`, error.message);
      throw error;
    }
  } else {
    console.log(`[MOCK EMAIL LOG]
-----------------------------------------
From: ${smtpFrom}
To: ${targetEmail}
Subject: ${subject}
Message: ${senderName} (${senderEmail}) invited you as their ${relationshipType.toLowerCase()}.
Action Link: ${registerUrl}
-----------------------------------------`);
  }
}
