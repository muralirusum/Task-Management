const nodemailer = require('nodemailer');

/**
 * Server-side email delivery utility using Nodemailer.
 * Supports real SMTP providers (Gmail App Passwords, SendGrid, Mailtrap, Brevo, AWS SES, etc.).
 * When SMTP credentials are empty in development, logs the notification to the server console smoothly.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || '';
    const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
    const user = process.env.SMTP_USER || process.env.EMAIL_USER || '';
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    console.log(`[Email Service] Processing email dispatch for recipient: (${to})...`);

    if (user && pass && host) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      const fromName = process.env.EMAIL_FROM_NAME || 'cGxP Tech Work Suite';
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_FROM || user;

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        text: text || '',
        html: html || '',
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service Success] SMTP email successfully delivered to (${to}). MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // Development fallback logger when SMTP environment credentials are not filled in server/.env
      console.log(`\n==================================================`);
      console.log(`✉️ [DEVELOPMENT MODE EMAIL NOTIFICATION LOG]`);
      console.log(`Recipient: ${to}`);
      console.log(`Subject: ${subject}`);
      if (text) console.log(`Body:\n${text}`);
      console.log(`==================================================\n`);
      
      return {
        success: true,
        isDevFallback: true,
        message: `Verification OTP dispatched to ${to}. (Set SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env for production inbox delivery)`,
      };
    }
  } catch (error) {
    console.error(`[Email Service Error] SMTP email delivery to (${to}) failed:`, error.message);
    return {
      success: false,
      error: error.code || 'DELIVERY_FAILED',
      message: `SMTP Email delivery failed (${error.message}). Please check server SMTP configuration.`,
    };
  }
};

module.exports = sendEmail;
