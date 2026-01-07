import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
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

    // First verify the link belongs to the user
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('id, user_id')
      .eq('id', linkId)
      .single();

    if (fetchError || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this link' },
        { status: 403 }
      );
    }


    // Hard delete: remove the row from database
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Link deleted successfully' 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}