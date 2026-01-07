import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Check if account is soft-deleted
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_deleted')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.is_deleted !== true) {
      // Account is not deleted, just login normally
      return NextResponse.json({
        message: 'Account is already active',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      });
    }

    // Reactivate account - clear is_deleted and deleted_at
    const { error: reactivateError } = await supabase
      .from('profiles')
      .update({ 
        is_deleted: null,
        deleted_at: null 
      })
      .eq('id', userId);

    if (reactivateError) {
      console.error('Error reactivating profile:', reactivateError);
      return NextResponse.json(
        { error: 'Failed to reactivate account' },
        { status: 500 }
      );
    }

    // Reactivate all user's links (expired ones already deleted by cron)
    const { error: linksError } = await supabase
      .from('links')
      .update({ is_active: true })
      .eq('user_id', userId);

    if (linksError) {
      console.error('Error reactivating links:', linksError);
      return NextResponse.json(
        { error: 'Failed to reactivate links' },
        { status: 500 }
      );
    }

    // User is already signed in from the password verification above
    return NextResponse.json({
      message: 'Account reactivated successfully',
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