import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

interface VerificationCode {
  email: string;
  code: string;
  expiresAt: Date;
}

// In-memory storage for verification codes
const verificationCodes = new Map<string, VerificationCode>();

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function createTransporter() {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  console.log('--- EMAIL CONFIG CHECK ---');
  console.log('Email:', user);
  console.log('Password length:', pass.length);
  console.log('--------------------------');

  if (pass.length === 17) {
    console.warn('WARNING: Your password has 17 characters. Gmail App Passwords should be 16 characters. Please check for extra characters at the end.');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass,
    },
    debug: true,
    logger: true,
  });

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log('SMTP Verification Error:', error.message);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });

  return transporter;
}

// Send verification email
export async function sendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store verification code
    verificationCodes.set(email, { email, code, expiresAt });

    // Clean expired codes
    cleanExpiredCodes();

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Geo-Conquer" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Geo-Conquer account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #E8952E, #C67A1A); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏃‍♂️ Geo-Conquer</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Claim your territory. One run at a time.</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thanks for signing up! Please use the verification code below to complete your registration:
            </p>
            
            <div style="background: white; border: 2px dashed #E8952E; padding: 20px; margin: 30px 0; text-align: center; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #E8952E; letter-spacing: 8px;">${code}</span>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2024 Geo-Conquer. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email} with code: ${code}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export function verifyCode(email: string, code: string): { success: boolean; error?: string } {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return { success: false, error: 'Verification code not found' };
  }

  if (stored.expiresAt < new Date()) {
    verificationCodes.delete(email);
    return { success: false, error: 'Verification code expired' };
  }

  if (stored.code !== code) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Remove used code
  verificationCodes.delete(email);
  return { success: true };
}

// Clean expired codes
function cleanExpiredCodes() {
  const now = new Date();
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
}

// For testing: get stored code (remove in production)
export function getStoredCode(email: string): string | undefined {
  const stored = verificationCodes.get(email);
  return stored?.code;
}
