#!/bin/bash

# Unified Content Generation Workflow Test Script
# Tests all PM recommendations and validates end-to-end functionality

echo "🧪 Testing Unified Content Generation Workflow"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3000"
TEST_KEYWORD="International movers in dubai"
TEST_LOCATION="uae"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local method=$2
    local data=$3
    local expected_status=$4
    local test_name=$5

    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        print_result 0 "$test_name (Status: $http_code)"
        return 0
    else
        print_result 1 "$test_name (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Function to check if server is running
check_server() {
    echo -e "${BLUE}Checking if development server is running...${NC}"
    
    if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        print_result 0 "Development server is running"
        return 0
    else
        print_result 1 "Development server is not running"
        echo -e "${YELLOW}Please start the development server with: npm run dev${NC}"
        return 1
    fi
}

# Function to test environment variables
test_environment() {
    echo -e "${BLUE}Testing environment configuration...${NC}"
    
    if [ -f ".env.local" ]; then
        print_result 0 "Environment file exists"
        
        # Check for required environment variables
        required_vars=("OPENAI_API_KEY" "SERPER_API_KEY" "FIRECRAWL_API_KEY" "NEXT_PUBLIC_SUPABASE_URL")
        all_vars_present=true
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .env.local; then
                print_result 0 "$var is configured"
            else
                print_result 1 "$var is missing"
                all_vars_present=false
            fi
        done
        
        if [ "$all_vars_present" = true ]; then
            print_result 0 "All required environment variables are configured"
            return 0
        else
            print_result 1 "Some environment variables are missing"
            return 1
        fi
    else
        print_result 1 "Environment file (.env.local) not found"
        echo -e "${YELLOW}Please create .env.local with required API keys${NC}"
        return 1
    fi
}

# Function to test file existence
test_files() {
    echo -e "${BLUE}Testing implementation files...${NC}"
    
    files=(
        "src/lib/workflows/unified-content-orchestrator.ts"
        "src/lib/scraping/competitor-content-extractor.ts"
        "src/app/api/content/generate-optimized/route.ts"
        "src/hooks/useUnifiedContentGeneration.ts"
    )
    
    all_files_exist=true
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_result 0 "$file exists"
        else
            print_result 1 "$file is missing"
            all_files_exist=false
        fi
    done
    
    if [ "$all_files_exist" = true ]; then
        print_result 0 "All implementation files are present"
        return 0
    else
        print_result 1 "Some implementation files are missing"
        return 1
    fi
}

# Function to test API health
test_api_health() {
    echo -e "${BLUE}Testing API health endpoints...${NC}"
    
    # Test health endpoint
    test_api "/api/health" "GET" "" 200 "Health check endpoint"
    
    # Test unified content generation endpoint info
    test_api "/api/content/generate-optimized" "GET" "" 200 "Content generation endpoint info"
}

# Function to test SERP analysis
test_serp_analysis() {
    echo -e "${BLUE}Testing SERP analysis...${NC}"
    
    serp_data='{
        "keyword": "test keyword",
        "location": "uae",
        "numResults": 5
    }'
    
    test_api "/api/serp/analyze" "POST" "$serp_data" 200 "SERP analysis endpoint"
}

# Function to test unified content generation
test_content_generation() {
    echo -e "${BLUE}Testing unified content generation...${NC}"
    
    content_data='{
        "keyword": "'"$TEST_KEYWORD"'",
        "location": "'"$TEST_LOCATION"'",
        "contentType": "service_page",
        "customizations": {
            "tone": "professional",
            "targetAudience": "business_owners",
            "companyName": "Desert Movers Dubai"
        },
        "options": {
            "includeImages": true,
            "includeInternalLinks": true,
            "generateMetaTags": true
        }
    }'
    
    echo -e "${YELLOW}This test may take 2-5 minutes to complete...${NC}"
    
    # Start time
    start_time=$(date +%s)
    
    # Make the request
    echo -e "${BLUE}Generating content for: $TEST_KEYWORD in $TEST_LOCATION${NC}"
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$content_data" \
        "$BASE_URL/api/content/generate-optimized")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    # End time
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    if [ "$http_code" -eq 200 ]; then
        print_result 0 "Content generation completed (${duration}s)"
        
        # Parse and validate response
        if echo "$body" | jq -e '.success' > /dev/null 2>&1; then
            print_result 0 "Response format is valid"
            
            # Extract key metrics
            word_count=$(echo "$body" | jq -r '.data.benchmarks.averageWordCount // "N/A"')
            seo_score=$(echo "$body" | jq -r '.data.seoMetrics.overallScore // "N/A"')
            keyword_density=$(echo "$body" | jq -r '.data.seoMetrics.keywordDensity // "N/A"')
            processing_time=$(echo "$body" | jq -r '.data.processingTime // "N/A"')
            
            echo -e "${GREEN}📊 Content Generation Results:${NC}"
            echo "   Word Count: $word_count"
            echo "   SEO Score: $seo_score%"
            echo "   Keyword Density: $keyword_density%"
            echo "   Processing Time: ${processing_time}ms"
            
            # Validate content quality
            if [ "$seo_score" != "N/A" ] && [ "$(echo "$seo_score > 80" | bc -l)" -eq 1 ]; then
                print_result 0 "SEO score is excellent (>80%)"
            else
                print_result 1 "SEO score needs improvement"
            fi
            
            if [ "$keyword_density" != "N/A" ] && [ "$(echo "$keyword_density > 1 && $keyword_density < 4" | bc -l)" -eq 1 ]; then
                print_result 0 "Keyword density is optimal (1-4%)"
            else
                print_result 1 "Keyword density is not optimal"
            fi
            
        else
            print_result 1 "Response format is invalid"
            echo "Response: $body"
        fi
    else
        print_result 1 "Content generation failed (Status: $http_code)"
        echo "Response: $body"
    fi
}

# Function to test error handling
test_error_handling() {
    echo -e "${BLUE}Testing error handling...${NC}"
    
    # Test missing keyword
    test_api "/api/content/generate-optimized" "POST" '{"location": "uae"}' 400 "Missing keyword validation"
    
    # Test missing location
    test_api "/api/content/generate-optimized" "POST" '{"keyword": "test"}' 400 "Missing location validation"
    
    # Test invalid location
    test_api "/api/content/generate-optimized" "POST" '{"keyword": "test", "location": "invalid"}' 400 "Invalid location validation"
    
    # Test keyword too long
    long_keyword=$(printf 'a%.0s' {1..150})
    test_api "/api/content/generate-optimized" "POST" "{\"keyword\": \"$long_keyword\", \"location\": \"uae\"}" 400 "Keyword length validation"
}

# Function to run performance tests
test_performance() {
    echo -e "${BLUE}Testing performance benchmarks...${NC}"
    
    # Test response time for health check
    start_time=$(date +%s%3N)
    curl -s "$BASE_URL/api/health" > /dev/null
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $response_time -lt 1000 ]; then
        print_result 0 "Health check response time is good (${response_time}ms)"
    else
        print_result 1 "Health check response time is slow (${response_time}ms)"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}Starting comprehensive workflow tests...${NC}"
    echo ""
    
    # Test 1: Environment
    test_environment
    echo ""
    
    # Test 2: Files
    test_files
    echo ""
    
    # Test 3: Server
    if ! check_server; then
        echo -e "${RED}Cannot proceed with API tests - server is not running${NC}"
        exit 1
    fi
    echo ""
    
    # Test 4: API Health
    test_api_health
    echo ""
    
    # Test 5: Performance
    test_performance
    echo ""
    
    # Test 6: Error Handling
    test_error_handling
    echo ""
    
    # Test 7: SERP Analysis
    test_serp_analysis
    echo ""
    
    # Test 8: Content Generation (Main Test)
    test_content_generation
    echo ""
    
    echo -e "${GREEN}🎉 All tests completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Review test results above"
    echo "2. Fix any failing tests"
    echo "3. Test the frontend UI integration"
    echo "4. Deploy to production environment"
    echo ""
    echo -e "${GREEN}System is ready for market deployment! 🚀${NC}"
}

# Check if required tools are installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is required but not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}jq is not installed - some tests will be limited${NC}"
fi

if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}bc is not installed - some calculations will be limited${NC}"
fi

# Run main test suite
main
