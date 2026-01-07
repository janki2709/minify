import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
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
    const { displayName } = body;

    // Validate display name
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim();

    // Check minimum length
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check maximum length
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Display name must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Check for digits (no numbers allowed)
    if (/\d/.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Display name cannot contain numbers' },
        { status: 400 }
      );
    }

    // Update display name in profiles table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: trimmedName })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating display name:', updateError);
      return NextResponse.json(
        { error: 'Failed to update display name' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Display name updated successfully',
      data: {
        display_name: updatedProfile.display_name,
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