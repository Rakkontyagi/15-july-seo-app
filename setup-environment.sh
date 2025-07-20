#!/bin/bash

echo "🔧 Setting up SEO Automation App Environment"
echo "============================================"

# Step 1: Create environment file
echo "📝 Creating environment configuration..."
cat > .env.local << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=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

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xpcbyzcaidfukddqniny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwY2J5emNhaWRmdWtkZHFuaW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTA1MzYsImV4cCI6MjA2MjM2NjUzNn0.k6gsHXOoRFTc-lYTn3gvH-pB71tXwTVzQF5OFu5mV1A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwY2J5emNhaWRmdWtkZHFuaW55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc5MDUzNywiZXhwIjoyMDYyMzY2NTM3fQ.rcH_G_p6zeqz1LPhGvJIDDnKwu7bXjY7qqBFMw9ZTC4
SUPABASE_JWT_SECRET=unqhUt/zHacG7pikBxYBQSpoGqGrQe/sHNZwkqMhCr+0QlJALP7yiK2PZVREsGRL6RC4lSJXXZFnTeRNEImtDg==

# External API Keys
SERPER_API_KEY=4ce37b02808e4325e42068eb815b03490a5519e5
FIRECRAWL_API_KEY=fc-4ba88920f7414c93aadb7f6e8752e6c5

# Database Configuration
DATABASE_URL=postgresql://postgres:[Neerfit1@]@db.xpcbyzcaidfukddqniny.supabase.co:5432/postgres

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo "✅ Environment file created successfully"

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Verify existing implementations
echo "🔍 Verifying existing implementations..."

# Check if key files exist
echo "Checking existing implementations:"
echo "- Serper integration: $([ -f "src/lib/serp/serper-client.ts" ] && echo "✅ Found" || echo "❌ Missing")"
echo "- Content generator: $([ -f "src/lib/ai/content-generator.ts" ] && echo "✅ Found" || echo "❌ Missing")"
echo "- SEO optimizer: $([ -f "src/lib/content-analysis/precision-seo-optimizer.ts" ] && echo "✅ Found" || echo "❌ Missing")"
echo "- Firecrawl service: $([ -f "src/lib/integrations/firecrawl-service.ts" ] && echo "✅ Found" || echo "❌ Missing")"

# Step 4: Start development server
echo "🚀 Starting development server..."
npm run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Step 5: Test basic connectivity
echo "🧪 Testing basic connectivity..."
curl -s http://localhost:3000/api/health > /dev/null && echo "✅ Server is running" || echo "❌ Server not responding"

echo ""
echo "🎉 Environment setup complete!"
echo "Next steps:"
echo "1. Implement Unified Workflow Orchestrator (3 hours)"
echo "2. Create Competitor Content Extractor (2 hours)"
echo "3. Add Frontend API Integration (1 hour)"
echo ""
echo "Ready for development! 🚀"
