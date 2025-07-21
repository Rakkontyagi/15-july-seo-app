import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Swagger UI HTML template
const getSwaggerUIHTML = (spec: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO Automation API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .topbar-wrapper img {
      content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMiAyMEM4LjEzIDIwIDUgMTYuODcgNSAxMlM4LjEzIDQgMTIgNFMxOSA3LjEzIDE5IDEyUzE1Ljg3IDIwIDEyIDIwWiIgZmlsbD0iIzAwODhGRiIvPgo8L3N2Zz4=');
    }
    .swagger-ui .topbar {
      background-color: #1a1f2e;
    }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
<script>
  window.onload = function() {
    window.ui = SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout",
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      persistAuthorization: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      onComplete: function() {
        console.log("Swagger UI loaded successfully");
      }
    });
  };
</script>
</body>
</html>
`;

export async function GET(request: NextRequest) {
  try {
    // Read the OpenAPI specification
    const specPath = path.join(process.cwd(), 'docs', 'api', 'openapi.yaml');
    
    if (!fs.existsSync(specPath)) {
      return NextResponse.json(
        { error: 'OpenAPI specification not found' },
        { status: 404 }
      );
    }

    const yamlContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(yamlContent);

    // Check if user wants JSON or HTML
    const acceptHeader = request.headers.get('accept') || '';
    
    if (acceptHeader.includes('application/json')) {
      // Return the OpenAPI spec as JSON
      return NextResponse.json(spec);
    } else {
      // Return Swagger UI HTML
      const html = getSwaggerUIHTML(spec);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    console.error('Error loading API documentation:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}

// Export the OpenAPI spec as a downloadable file
export async function POST(request: NextRequest) {
  try {
    const { format = 'yaml' } = await request.json();
    
    const specPath = path.join(process.cwd(), 'docs', 'api', 'openapi.yaml');
    
    if (!fs.existsSync(specPath)) {
      return NextResponse.json(
        { error: 'OpenAPI specification not found' },
        { status: 404 }
      );
    }

    const yamlContent = fs.readFileSync(specPath, 'utf8');
    
    if (format === 'json') {
      const spec = yaml.load(yamlContent);
      return new NextResponse(JSON.stringify(spec, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="openapi.json"',
        },
      });
    } else {
      return new NextResponse(yamlContent, {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Content-Disposition': 'attachment; filename="openapi.yaml"',
        },
      });
    }
  } catch (error) {
    console.error('Error exporting API documentation:', error);
    return NextResponse.json(
      { error: 'Failed to export API documentation' },
      { status: 500 }
    );
  }
}