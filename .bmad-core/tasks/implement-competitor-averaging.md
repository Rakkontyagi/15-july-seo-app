# Implement Competitor Data Averaging Task

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

When this task is invoked, execute ALL steps in sequence. This implements the CORE methodology of the SEO automation system.

## TASK OVERVIEW

**Objective**: Implement statistical averaging across exactly 5 competitors with 0.1% precision
**Priority**: CRITICAL - Core Value Proposition
**Estimated Time**: 16 hours
**Gap**: 60% missing functionality

## BUSINESS CONTEXT

This is the **CORE METHODOLOGY** that differentiates this SEO tool:
- Analyze exactly 5 top competitors for any keyword
- Calculate precise statistical averages (0.1% precision for keyword density)
- Generate exact targets for content optimization
- Provide LSI keyword frequency analysis
- Map entity usage patterns

## IMPLEMENTATION REQUIREMENTS

### Core Class: CompetitorDataAverager

**File**: `src/lib/content/competitor-data-averager.ts`

```typescript
export interface CompetitorData {
  url: string;
  title: string;
  wordCount: number;
  keywordDensity: number; // Precise to 3 decimal places
  optimizedHeadings: number;
  lsiKeywords: Array<{keyword: string; frequency: number}>;
  entities: Array<{entity: string; count: number; type: string}>;
  metaDescription: string;
  headingStructure: Array<{level: number; text: string; optimized: boolean}>;
}

export interface PreciseBenchmarks {
  averageWordCount: number;
  averageKeywordDensity: number; // 0.1% precision (3 decimal places)
  averageOptimizedHeadings: number;
  lsiKeywordFrequencies: Map<string, number>;
  entityUsagePatterns: Map<string, {count: number; type: string}>;
  standardDeviations: {
    wordCount: number;
    keywordDensity: number;
    optimizedHeadings: number;
  };
  confidenceIntervals: {
    wordCount: [number, number];
    keywordDensity: [number, number];
    optimizedHeadings: [number, number];
  };
}

export interface ExactTargets {
  targetKeywordDensity: number; // Rounded to 0.1% precision
  targetOptimizedHeadings: number;
  targetWordCount: number;
  lsiKeywordTargets: Array<{keyword: string; targetFrequency: number}>;
  entityIntegrationTargets: Array<{entity: string; targetCount: number; type: string}>;
}

export class CompetitorDataAverager {
  /**
   * Calculate precise statistical averages across all 5 competitors
   * This is the CORE of the user's methodology - must be 100% accurate
   */
  async calculateStatisticalAverages(competitors: CompetitorData[]): Promise<PreciseBenchmarks> {
    // Validate we have exactly 5 competitors
    if (competitors.length !== 5) {
      throw new Error(`Expected 5 competitors, got ${competitors.length}`);
    }

    const wordCounts = competitors.map(c => c.wordCount);
    const keywordDensities = competitors.map(c => c.keywordDensity);
    const optimizedHeadings = competitors.map(c => c.optimizedHeadings);

    return {
      averageWordCount: this.calculateMean(wordCounts),
      averageKeywordDensity: this.calculateMeanWithPrecision(keywordDensities, 3), // 0.001 precision
      averageOptimizedHeadings: Math.round(this.calculateMean(optimizedHeadings)),
      lsiKeywordFrequencies: await this.analyzeLSIFrequencies(competitors),
      entityUsagePatterns: await this.analyzeEntityPatterns(competitors),
      standardDeviations: this.calculateStandardDeviations(competitors),
      confidenceIntervals: this.calculateConfidenceIntervals(competitors)
    };
  }

  /**
   * Generate exact targets with 0.1% accuracy as specified in PRD
   */
  generateBenchmarkTargets(averages: PreciseBenchmarks): ExactTargets {
    return {
      targetKeywordDensity: Math.round(averages.averageKeywordDensity * 1000) / 1000, // 0.1% precision
      targetOptimizedHeadings: averages.averageOptimizedHeadings,
      targetWordCount: Math.round(averages.averageWordCount),
      lsiKeywordTargets: this.generateLSITargets(averages.lsiKeywordFrequencies),
      entityIntegrationTargets: this.generateEntityTargets(averages.entityUsagePatterns)
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMeanWithPrecision(values: number[], decimalPlaces: number): number {
    const mean = this.calculateMean(values);
    return Math.round(mean * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  private calculateStandardDeviations(competitors: CompetitorData[]) {
    // Implementation for standard deviation calculations
  }

  private calculateConfidenceIntervals(competitors: CompetitorData[]) {
    // Implementation for confidence interval calculations
  }

  private async analyzeLSIFrequencies(competitors: CompetitorData[]): Promise<Map<string, number>> {
    // Implementation for LSI keyword frequency analysis
  }

  private async analyzeEntityPatterns(competitors: CompetitorData[]): Promise<Map<string, {count: number; type: string}>> {
    // Implementation for entity usage pattern analysis
  }
}
```

## EXECUTION STEPS

### Step 1: Create Core Implementation Files

**Files to Create**:
1. `src/lib/content/competitor-data-averager.ts` - Main averaging logic
2. `src/lib/analysis/statistical-analyzer.ts` - Statistical calculations
3. `src/lib/analysis/benchmark-generator.ts` - Target generation
4. `src/app/api/analysis/competitor-averages/route.ts` - API endpoint

### Step 2: Implement Statistical Analysis

**File**: `src/lib/analysis/statistical-analyzer.ts`
- Standard deviation calculations
- Confidence interval calculations
- Outlier detection and handling
- Data validation and sanitization

### Step 3: Create API Endpoint

**File**: `src/app/api/analysis/competitor-averages/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const { competitors } = await request.json();
  
  const averager = new CompetitorDataAverager();
  const averages = await averager.calculateStatisticalAverages(competitors);
  const targets = averager.generateBenchmarkTargets(averages);
  
  return NextResponse.json({
    averages,
    targets,
    timestamp: new Date().toISOString()
  });
}
```

### Step 4: Comprehensive Testing

**File**: `src/lib/content/__tests__/competitor-data-averager.test.ts`
- Test with exactly 5 competitors
- Test precision requirements (0.1% accuracy)
- Test error handling for invalid input
- Test statistical calculations accuracy
- Test LSI and entity analysis
- Performance testing with large datasets

## ACCEPTANCE CRITERIA

- [ ] Statistical averaging across exactly 5 competitors
- [ ] Keyword density calculation with 0.1% precision (3 decimal places)
- [ ] Heading optimization count averages
- [ ] LSI keyword frequency analysis with usage patterns
- [ ] Entity usage pattern mapping
- [ ] Benchmark validation system with accuracy scoring
- [ ] Competitor insights report with actionable targets
- [ ] 95%+ test coverage
- [ ] API endpoint integration
- [ ] Error handling for edge cases
- [ ] Performance optimization for large datasets

## VALIDATION TESTS

```bash
# Run specific tests
npm run test -- --testPathPattern=competitor-data-averager

# Test API endpoint
curl -X POST http://localhost:3000/api/analysis/competitor-averages \
  -H "Content-Type: application/json" \
  -d '{"competitors": [/* 5 competitor objects */]}'
```

## INTEGRATION POINTS

- Connects to existing SERP analysis system
- Feeds into content generation pipeline
- Provides data for UI dashboard
- Integrates with reporting system

## SUCCESS METRICS

- ✅ Processes exactly 5 competitors with validation
- ✅ Achieves 0.1% precision in keyword density calculations
- ✅ Generates actionable optimization targets
- ✅ Completes analysis in under 10 seconds
- ✅ Handles edge cases gracefully
- ✅ Provides comprehensive insights report
