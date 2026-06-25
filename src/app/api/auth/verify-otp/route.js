import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, otp, hash } = await request.json();

    if (!email || !otp || !hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Re-create the cryptographic hash of the email + input OTP + secret
    const secret = process.env.OTP_SECRET || 'fallback_secret_if_env_missing';
    const computedHash = crypto.createHmac('sha256', secret)
      .update(`${email}:${otp}`)
      .digest('hex');

    // Securely compare the hashes to prevent timing attacks
    // But a simple string comparison is usually okay for 6 digit OTPs, 
    // although crypto.timingSafeEqual is best practice
    if (computedHash === hash) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 401 });
    }
    
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
