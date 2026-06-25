import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Eco Expenses <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Eco Expenses Login Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Eco Expenses</h2>
          <p>Your one-time login code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #10b981; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">${otp}</h1>
          <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Create a cryptographic hash of the email + OTP + secret
    const secret = process.env.OTP_SECRET || 'fallback_secret_if_env_missing';
    const hash = crypto.createHmac('sha256', secret)
      .update(`${email}:${otp}`)
      .digest('hex');

    // Return the hash (but NOT the OTP) so the client can submit it later for verification
    return NextResponse.json({ success: true, hash });
    
  } catch (err) {
    console.error('Send OTP Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
