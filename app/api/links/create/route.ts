import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateSlug } from '@/lib/utils/validate-slug';
import { generateUniqueSlug } from '@/lib/utils/slug-generator';

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
    const { originalUrl, customSlug } = body;

    // Validate original URL
    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Original URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    let finalSlug: string;

    // If custom slug provided, validate it
    if (customSlug && customSlug.trim()) {
      const validation = validateSlug(customSlug);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      finalSlug = validation.normalizedSlug!;

      // Check if slug is reserved
      const { data: reserved } = await supabase
        .from('reserved_slugs')
        .select('slug')
        .eq('slug', finalSlug)
        .single();

      if (reserved) {
        return NextResponse.json(
          { error: 'This slug is reserved and cannot be used' },
          { status: 400 }
        );
      }

      // Check if slug already exists
      const { data: existing } = await supabase
        .from('links')
        .select('slug')
        .eq('slug', finalSlug)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        );
      }
    } else {
      // Generate random slug
      const checkSlugExists = async (slug: string): Promise<boolean> => {
        const { data } = await supabase
          .from('links')
          .select('slug')
          .eq('slug', slug)
          .single();
        return !!data;
      };

      const generatedSlug = await generateUniqueSlug(checkSlugExists);
      
      if (!generatedSlug) {
        return NextResponse.json(
          { error: 'Failed to generate unique slug. Please try again.' },
          { status: 500 }
        );
      }

      finalSlug = generatedSlug;
    }

    // Create the link
    const { data: link, error: insertError } = await supabase
      .from('links')
      .insert({
        slug: finalSlug,
        original_url: originalUrl,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating link:', insertError);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ link }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}