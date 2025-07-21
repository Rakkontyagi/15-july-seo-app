#!/bin/bash

# Script to fix Next.js 15 API route parameter types
# This script updates all API routes to use Promise<{ param: string }> instead of { param: string }

echo "Fixing API route parameter types for Next.js 15..."

# List of files that need to be fixed
files=(
  "src/app/api/cms/wordpress/[contentId]/route.ts"
  "src/app/api/content/[id]/progress/route.ts"
  "src/app/api/subscription/invoices/[id]/download/route.ts"
  "src/app/api/intelligence/benchmarks/[id]/route.ts"
  "src/app/api/projects/[id]/route.ts"
  "src/app/api/seo/internal-links/recommendations/[id]/route.ts"
  "src/app/api/seo/internal-links/results/[id]/route.ts"
  "src/app/api/seo/metrics/[id]/route.ts"
  "src/app/api/serp/results/[id]/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Fix parameter type declarations
    sed -i 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }>/g' "$file"
    
    echo "Fixed parameter types in $file"
  else
    echo "File not found: $file"
  fi
done

echo "Done! Remember to manually add 'const resolvedParams = await params;' and update usages in each file."
