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
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    // Fetch the link to verify ownership and get current expiration
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('*')
      .eq('id', linkId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !link) {
      return NextResponse.json(
        { error: 'Link not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate new expiration date (current expires_at + 7 days)
    const currentExpiration = new Date(link.expires_at);
    const newExpiration = new Date(currentExpiration);
    newExpiration.setDate(newExpiration.getDate() + 7);

    // Update the link with new expiration
    const { data: updatedLink, error: updateError } = await supabase
      .from('links')
      .update({ 
        expires_at: newExpiration.toISOString(),
        is_active: true // Reactivate if it was expired
      })
      .eq('id', linkId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error extending link:', updateError);
      return NextResponse.json(
        { error: 'Failed to extend link expiration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      link: updatedLink,
      message: 'Link expiration extended by 7 days'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}