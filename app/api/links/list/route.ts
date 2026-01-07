import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Fetch user's links with pagination
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)  // Only active links
      .gt('expires_at', new Date().toISOString())  // Only non-expired links
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (linksError) {
      console.error('Error fetching links:', linksError);
      return NextResponse.json(
        { error: 'Failed to fetch links' },
        { status: 500 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      links: links || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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