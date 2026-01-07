import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const { email, password , turnstileToken} = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Backend email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Attempt to sign in
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Check if account is soft-deleted
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_deleted, deleted_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify account status' },
        { status: 500 }
      );
    }

    // If account is soft-deleted, redirect to reactivation
    if (profile.is_deleted === true) {
      // Sign out immediately (they shouldn't be fully logged in)
      await supabase.auth.signOut();
      
      return NextResponse.json(
        {
          requiresReactivation: true,
          email: authData.user.email,
          deletedAt: profile.deleted_at,
        },
        { status: 403 }
      );
    }

    // Normal login - account is active
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
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