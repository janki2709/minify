import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate new password matches confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate new password requirements (same as signup)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one number' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one special character' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Note: Supabase automatically logs out OTHER sessions
    // Current session stays active (as per requirements)

    return NextResponse.json({
      message: 'Password updated successfully',
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}