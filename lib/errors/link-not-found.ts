import { NextResponse } from 'next/server';

export function linkNotFoundResponse() {
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Link Not Found - Minify</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          a {
            display: inline-block;
            padding: 0.75rem 2rem;
            background: white;
            color: #667eea;
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
          <h1>404</h1>
          <h2>Link Not Found</h2>
          <p>The short link you're looking for doesn't exist or may have been removed.</p>
          <a href="/signup">Want to shorten a link? Use Minify</a>
        </div>
      </body>
    </html>
    `,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}