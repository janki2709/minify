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
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // Soft delete the user by setting is_deleted and deleted_at in profiles
    const deletedAt = new Date().toISOString();
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_deleted: true,
        deleted_at: deletedAt 
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error marking profile as deleted:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    // Deactivate all user's links (soft delete)
    const { error: linksError } = await supabase
      .from('links')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (linksError) {
      console.error('Error deactivating links:', linksError);
      return NextResponse.json(
        { error: 'Failed to deactivate links' },
        { status: 500 }
      );
    }

    // Sign out the user from ALL sessions (global logout)
    await supabase.auth.signOut({ scope: 'global' });

    return NextResponse.json({
      message: 'Account deleted successfully',
      deleted_at: deletedAt,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}