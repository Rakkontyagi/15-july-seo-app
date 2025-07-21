/**
 * Content Validation API Route
 * Implements Story 3.6: Content Validation & Anti-Hallucination
 * Integrates RealTimeFactVerifier, AntiHallucinationEngine, and SourceValidator
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RealTimeFactVerifier } from '@/lib/ai/real-time-fact-verifier';
import { AntiHallucinationEngine } from '@/lib/ai/anti-hallucination-engine';
import { SourceValidator } from '@/lib/ai/source-validator';
import { sanitizeText } from '@/lib/validation/sanitizer';

// Request validation schema
const validationRequestSchema = z.object({
  content: z.string().min(50, 'Content must be at least 50 characters'),
  industry: z.string().optional(),
  strictMode: z.boolean().default(true),
  options: z.object({
    checkFacts: z.boolean().default(true),
    checkHallucinations: z.boolean().default(true),
    validateSources: z.boolean().default(true),
    requireCitations: z.boolean().default(true),
    compliance2025: z.boolean().default(true),
  }).optional(),
});

type ValidationRequest = z.infer<typeof validationRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = validationRequestSchema.parse(body);

    // Sanitize input content to prevent XSS and injection attacks
    const sanitizedData = {
      ...validatedData,
      content: sanitizeText(validatedData.content, { maxLength: 100000 }),
      industry: validatedData.industry ? sanitizeText(validatedData.industry, { maxLength: 100 }) : undefined
    };

    // Initialize validation services
    const factVerifier = new RealTimeFactVerifier();
    const hallucinationEngine = new AntiHallucinationEngine();
    const sourceValidator = new SourceValidator();

    const startTime = Date.now();

    // Step 1: Real-time fact verification (if enabled)
    let factVerificationResult = null;
    if (sanitizedData.options?.checkFacts !== false) {
      factVerificationResult = await factVerifier.verifyContentFacts(sanitizedData.content);
    }

    // Step 2: Anti-hallucination detection (if enabled)
    let hallucinationCheckResult = null;
    if (sanitizedData.options?.checkHallucinations !== false) {
      hallucinationCheckResult = await hallucinationEngine.preventHallucinations(sanitizedData.content);
    }

    // Step 3: Source validation (if enabled)
    let citationAnalysis = null;
    if (sanitizedData.options?.validateSources !== false) {
      citationAnalysis = await sourceValidator.analyzeCitations(sanitizedData.content);
    }

    // Step 4: Calculate overall validation score
    const overallValidation = calculateOverallValidation(
      factVerificationResult,
      hallucinationCheckResult,
      citationAnalysis,
      sanitizedData.options
    );

    // Step 5: Generate comprehensive recommendations
    const recommendations = generateComprehensiveRecommendations(
      factVerificationResult,
      hallucinationCheckResult,
      citationAnalysis,
      overallValidation
    );

    // Step 6: Determine approval status
    const approvalStatus = determineApprovalStatus(
      overallValidation,
      validatedData.strictMode
    );

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response = {
      success: true,
      data: {
        // Overall validation results
        overallValidation: {
          score: overallValidation.score,
          status: overallValidation.status,
          approvalStatus,
          compliance2025: overallValidation.compliance2025,
        },

        // Fact verification results
        factVerification: factVerificationResult ? {
          totalClaims: factVerificationResult.totalClaims,
          verifiedClaims: factVerificationResult.verifiedClaims,
          flaggedClaims: factVerificationResult.flaggedClaims.length,
          confidenceScore: factVerificationResult.confidenceScore,
          currentInformationCompliance: factVerificationResult.currentInformationCompliance,
          overallVerificationStatus: factVerificationResult.overallVerificationStatus,
        } : null,

        // Hallucination detection results
        hallucinationCheck: hallucinationCheckResult ? {
          hallucinationRisk: hallucinationCheckResult.hallucinationRisk,
          flaggedSections: hallucinationCheckResult.flaggedSections.length,
          approvalStatus: hallucinationCheckResult.approvalStatus,
          riskBreakdown: {
            factualAccuracy: hallucinationCheckResult.detectionResults.factualAccuracy.score,
            sourceValidation: hallucinationCheckResult.detectionResults.sourceValidation.score,
            consistencyCheck: hallucinationCheckResult.detectionResults.consistencyCheck.score,
          },
        } : null,

        // Source validation results
        sourceValidation: citationAnalysis ? {
          totalCitations: citationAnalysis.totalCitations,
          validCitations: citationAnalysis.validCitations,
          invalidCitations: citationAnalysis.invalidCitations,
          missingCitations: citationAnalysis.missingCitations.length,
          citationQuality: citationAnalysis.citationQuality,
          sourceDistribution: citationAnalysis.sourceDistribution,
        } : null,

        // Detailed recommendations
        recommendations: {
          immediate: recommendations.immediate,
          suggested: recommendations.suggested,
          optional: recommendations.optional,
        },

        // Flagged content sections
        flaggedContent: extractFlaggedContent(
          factVerificationResult,
          hallucinationCheckResult,
          citationAnalysis
        ),

        // Processing metadata
        metadata: {
          processedAt: new Date().toISOString(),
          processingTime,
          contentLength: validatedData.content.length,
          validationOptions: validatedData.options,
          strictMode: validatedData.strictMode,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Content validation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Content Validation API is operational',
    version: '1.0.0',
    capabilities: [
      'Real-time fact verification',
      'Anti-hallucination detection',
      'Source validation and citation analysis',
      '2025 compliance checking',
      'Multi-layer content validation',
    ],
    validationLayers: {
      factVerification: 'Verifies claims against authoritative sources',
      hallucinationDetection: 'Detects potential AI-generated inaccuracies',
      sourceValidation: 'Validates citations and source credibility',
      consistencyCheck: 'Checks internal logical consistency',
    },
  });
}

// Helper functions
function calculateOverallValidation(
  factVerification: any,
  hallucinationCheck: any,
  citationAnalysis: any,
  options: any
): {
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  compliance2025: boolean;
} {
  let totalScore = 0;
  let weightSum = 0;

  // Fact verification weight
  if (factVerification && options?.checkFacts !== false) {
    totalScore += factVerification.confidenceScore * 0.4;
    weightSum += 0.4;
  }

  // Hallucination detection weight
  if (hallucinationCheck && options?.checkHallucinations !== false) {
    const hallucinationScore = Math.max(0, 1 - hallucinationCheck.hallucinationRisk);
    totalScore += hallucinationScore * 0.35;
    weightSum += 0.35;
  }

  // Source validation weight
  if (citationAnalysis && options?.validateSources !== false) {
    totalScore += citationAnalysis.citationQuality * 0.25;
    weightSum += 0.25;
  }

  const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

  let status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  if (finalScore >= 0.9) status = 'EXCELLENT';
  else if (finalScore >= 0.75) status = 'GOOD';
  else if (finalScore >= 0.6) status = 'FAIR';
  else status = 'POOR';

  const compliance2025 = factVerification ? 
    factVerification.currentInformationCompliance > 80 : true;

  return {
    score: Number(finalScore.toFixed(3)),
    status,
    compliance2025,
  };
}

function generateComprehensiveRecommendations(
  factVerification: any,
  hallucinationCheck: any,
  citationAnalysis: any,
  overallValidation: any
): {
  immediate: string[];
  suggested: string[];
  optional: string[];
} {
  const immediate: string[] = [];
  const suggested: string[] = [];
  const optional: string[] = [];

  // Critical issues requiring immediate attention
  if (hallucinationCheck?.approvalStatus === 'REJECTED') {
    immediate.push('CRITICAL: Content rejected due to high hallucination risk');
  }

  if (factVerification?.overallVerificationStatus === 'FAILED') {
    immediate.push('CRITICAL: Multiple factual claims failed verification');
  }

  if (overallValidation.score < 0.5) {
    immediate.push('CRITICAL: Overall validation score below acceptable threshold');
  }

  // Suggested improvements
  if (factVerification?.flaggedClaims?.length > 0) {
    suggested.push(`Review ${factVerification.flaggedClaims.length} flagged factual claims`);
  }

  if (citationAnalysis?.missingCitations?.length > 0) {
    suggested.push(`Add citations for ${citationAnalysis.missingCitations.length} unsupported claims`);
  }

  if (hallucinationCheck?.flaggedSections?.length > 0) {
    suggested.push(`Address ${hallucinationCheck.flaggedSections.length} potentially problematic sections`);
  }

  // Optional enhancements
  if (citationAnalysis?.citationQuality < 0.8) {
    optional.push('Consider upgrading to higher-credibility sources');
  }

  if (!overallValidation.compliance2025) {
    optional.push('Update content with 2025-compliant information');
  }

  if (overallValidation.status === 'GOOD') {
    optional.push('Content quality is good - consider minor optimizations for excellence');
  }

  return { immediate, suggested, optional };
}

function determineApprovalStatus(
  overallValidation: any,
  strictMode: boolean
): 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' {
  const threshold = strictMode ? 0.8 : 0.6;

  if (overallValidation.score >= threshold && overallValidation.status !== 'POOR') {
    return 'APPROVED';
  }

  if (overallValidation.score >= 0.4) {
    return 'NEEDS_REVIEW';
  }

  return 'REJECTED';
}

function extractFlaggedContent(
  factVerification: any,
  hallucinationCheck: any,
  citationAnalysis: any
): Array<{
  text: string;
  type: 'FACT_ERROR' | 'HALLUCINATION' | 'MISSING_CITATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}> {
  const flaggedContent: Array<{
    text: string;
    type: 'FACT_ERROR' | 'HALLUCINATION' | 'MISSING_CITATION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
  }> = [];

  // Add flagged fact verification claims
  if (factVerification?.flaggedClaims) {
    for (const claim of factVerification.flaggedClaims) {
      flaggedContent.push({
        text: claim.claim,
        type: 'FACT_ERROR',
        severity: 'HIGH',
        recommendation: claim.reasoning,
      });
    }
  }

  // Add flagged hallucination sections
  if (hallucinationCheck?.flaggedSections) {
    for (const section of hallucinationCheck.flaggedSections) {
      flaggedContent.push({
        text: section.text,
        type: 'HALLUCINATION',
        severity: section.riskLevel,
        recommendation: section.suggestedFix,
      });
    }
  }

  // Add missing citations
  if (citationAnalysis?.missingCitations) {
    for (const claim of citationAnalysis.missingCitations) {
      flaggedContent.push({
        text: claim,
        type: 'MISSING_CITATION',
        severity: 'MEDIUM',
        recommendation: 'Add authoritative source citation for this claim',
      });
    }
  }

  return flaggedContent;
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
