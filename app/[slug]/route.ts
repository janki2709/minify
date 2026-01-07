import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { linkNotFoundResponse } from '@/lib/errors/link-not-found';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const { slug } = params;

    console.log('Attempting to redirect slug:', slug);

    // Fetch the link (without RLS - we'll check manually)
    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(); // Use maybeSingle to avoid error on no results

    console.log('Link found:', link);
    console.log('Error:', error);

    // Link not found
    if (!link) {
      console.log('Link not found in database');
      return linkNotFoundResponse();
    }

  // Check 2: Is the link owner's account soft-deleted?
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_deleted')
      .eq('id', link.user_id)
      .single();

    if (profileError) {
      console.error('Error checking profile status:', profileError);
      return linkNotFoundResponse();
    }

    if (profile?.is_deleted === true) {
      console.log('Link owner account is deleted');
      return linkNotFoundResponse();
    }

    console.log('Redirecting to:', link.original_url);

    // All checks passed - redirect to original URL
    return NextResponse.redirect(link.original_url, {
      status: 307, // Temporary redirect
    });

  } catch (error) {
    console.error('Redirect error:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Minify</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              color: #fff;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 500px;
            }
            h1 {
              font-size: 4rem;
              margin: 0;
            }
            h2 {
              font-size: 1.5rem;
              margin: 1rem 0;
            }
            p {
              font-size: 1rem;
              opacity: 0.9;
              margin-bottom: 2rem;
            }
            .debug {
              background: rgba(255,255,255,0.1);
              padding: 1rem;
              border-radius: 8px;
              margin-top: 2rem;
              font-size: 0.875rem;
              text-align: left;
            }
            a {
              display: inline-block;
              padding: 0.75rem 2rem;
              background: white;
              color: #fa709a;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: transform 0.2s;
            }
            a:hover {
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>500</h1>
            <h2>Something Went Wrong</h2>
            <p>An unexpected error occurred while processing your request.</p>
            <div class="debug">
              <strong>Error:</strong><br>
              ${error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <a href="/dashboard">Go to Dashboard</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}