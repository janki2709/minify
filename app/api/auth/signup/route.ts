import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const { name, email, password, turnstileToken } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Please complete the CAPTCHA verification' },
        { status: 400 }
      );
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Validate name (no digits)
    if (/\d/.test(name)) {
      return NextResponse.json(
        { error: 'Name cannot contain numbers' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character' },
        { status: 400 }
      );
    }

    // Attempt to create user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    });

    if (signUpError) {
      // Check if it's a duplicate user error
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please login instead.' },
          { status: 409 }
        );
      }
      
      console.error('Signup error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}