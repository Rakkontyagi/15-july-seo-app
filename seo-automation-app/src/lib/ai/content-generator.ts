
import OpenAI from 'openai';
import { fillExpertContentPrompt } from './prompts/expert-content-template';
import { ContentQualityChecker, ContentQualityAnalysisResult } from './quality-checker';
import { HumanWritingPatternAnalyzer, HumanWritingPatternAnalysis } from './human-writing-patterns';
import { EeatOptimizer, EeatOptimizationResult } from './eeat-optimizer';
import { CurrentInformationIntegrator } from './current-information-integrator';
import { UserValueOptimizer, UserValueAnalysisResult } from './user-value-optimizer';
import { AuthoritySignalIntegrator, AuthoritySignalAnalysisResult } from './authority-signal-integrator';
import { NLPOptimizer } from './nlp-optimizer';
import { KeywordIntegrator } from './keyword-integrator';
import { UniquenessVerifier, UniquenessVerificationResult } from './uniqueness-verifier';
import { TopicalClusterCompleter, TopicalClusterAnalysisResult } from './topical-cluster-completer';
import { FactVerifier, FactVerificationResult } from './fact-verifier';
import { SourceValidator, SourceValidationResult } from './source-validator';
import { ContentAccuracyScorer, ContentAccuracyResult } from './content-accuracy-scorer';
import { HallucinationDetector, HallucinationDetectionResult } from './hallucination-detector';
import { ExpertReviewTrigger, ExpertReviewTriggerResult } from './expert-review-trigger';
import { ContentVersioningSystem, ContentVersion } from './content-versioning-system';

export interface GeneratedContent {
  content: string;
  wordCount: number;
  qualityAnalysis: ContentQualityAnalysisResult; // Detailed quality analysis
  humanWritingAnalysis: HumanWritingPatternAnalysis; // Human-like writing analysis
  eeatOptimization: EeatOptimizationResult; // E-E-A-T optimization analysis
  userValueAnalysis: UserValueAnalysisResult; // User value analysis
  authoritySignalAnalysis: AuthoritySignalAnalysisResult; // Authority signal analysis
  nlpOptimizationIssues: string[]; // Issues from NLP optimization
  contentBalanceIssues: string[]; // Issues from content balance verification
  uniquenessVerification: UniquenessVerificationResult; // Uniqueness verification result
  topicalClusterCompletion: TopicalClusterAnalysisResult; // Topical cluster completion analysis
  factVerificationResults: FactVerificationResult[]; // Fact verification results
  sourceValidationResults: SourceValidationResult[]; // Source validation results
  contentAccuracyAnalysis: ContentAccuracyResult; // Content accuracy analysis
  hallucinationDetection: HallucinationDetectionResult; // Hallucination detection results
  expertReviewTrigger: ExpertReviewTriggerResult; // Expert review trigger results
  contentVersion: ContentVersion; // The final version of the content
  timestamp: string;
}

export interface ContentGenerationOptions {
  keyword: string;
  industry: string;
  targetAudience: string;
  tone: string;
  wordCount: number;
  competitorInsights?: string;
  targetKeywordDensity?: number; // New option for keyword density
  lsiKeywords?: string[]; // LSI keywords to distribute
  entities?: { name: string; type: string }[]; // Entities to integrate
  targetOptimizedHeadingsCount?: number; // Target for keyword optimized headings
  keywordVariations?: string[]; // Keyword variations to incorporate
  relatedKeywords?: string[]; // Related keywords to incorporate
  comparisonCorpus?: string[]; // Content to compare for uniqueness
  potentialSubtopics?: string[]; // Potential subtopics for topical cluster completion
  sensitiveTopics?: string[]; // Sensitive topics for expert review
  contentId?: string; // Optional ID for content versioning
}

export class AIContentGenerator {
  private openai: OpenAI;
  private qualityChecker: ContentQualityChecker;
  private humanWritingAnalyzer: HumanWritingPatternAnalyzer;
  private eeatOptimizer: EeatOptimizer;
  private currentInformationIntegrator: CurrentInformationIntegrator;
  private userValueOptimizer: UserValueOptimizer;
  private authoritySignalIntegrator: AuthoritySignalIntegrator;
  private nlpOptimizer: NLPOptimizer;
  private keywordIntegrator: KeywordIntegrator;
  private uniquenessVerifier: UniquenessVerifier;
  private topicalClusterCompleter: TopicalClusterCompleter;
  private factVerifier: FactVerifier;
  private sourceValidator: SourceValidator;
  private contentAccuracyScorer: ContentAccuracyScorer;
  private hallucinationDetector: HallucinationDetector;
  private expertReviewTrigger: ExpertReviewTrigger;
  private contentVersioningSystem: ContentVersioningSystem;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set.');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.qualityChecker = new ContentQualityChecker();
    this.humanWritingAnalyzer = new HumanWritingPatternAnalyzer();
    this.eeatOptimizer = new EeatOptimizer();
    this.currentInformationIntegrator = new CurrentInformationIntegrator();
    this.userValueOptimizer = new UserValueOptimizer();
    this.authoritySignalIntegrator = new AuthoritySignalIntegrator();
    this.nlpOptimizer = new NLPOptimizer();
    this.keywordIntegrator = new KeywordIntegrator();
    this.uniquenessVerifier = new UniquenessVerifier();
    this.topicalClusterCompleter = new TopicalClusterCompleter();
    this.factVerifier = new FactVerifier();
    this.sourceValidator = new SourceValidator();
    this.contentAccuracyScorer = new ContentAccuracyScorer();
    this.hallucinationDetector = new HallucinationDetector();
    this.expertReviewTrigger = new ExpertReviewTrigger();
    this.contentVersioningSystem = new ContentVersioningSystem();
  }

  private getExpertSystemPrompt(): string {
    return `You are an AI content generation expert with 20+ years of experience in SEO and content marketing. Your goal is to produce highly authoritative, human-like, and SEO-optimized content that ranks as the best answer across all search engines. Focus on E-E-A-T principles: Experience, Expertise, Authoritativeness, and Trustworthiness. Incorporate the latest facts and studies relevant to 2025.`;
  }

  async generate(options: ContentGenerationOptions): Promise<GeneratedContent> {
    const currentInfo = await this.currentInformationIntegrator.fetchCurrentInformation(options.keyword, options.industry);
    const formattedCurrentInfo = this.currentInformationIntegrator.formatForPrompt(currentInfo);

    const userPrompt = fillExpertContentPrompt({
      ...options,
      competitorInsights: (options.competitorInsights || '') + formattedCurrentInfo,
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Using gpt-4o as it's a capable model
        messages: [
          { role: "system", content: this.getExpertSystemPrompt() },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: Math.round(options.wordCount * 1.5), // Allow some buffer for tokens
      });

      let content = response.choices[0].message.content;

      if (!content) {
        throw new Error('AI did not return any content.');
      }

      // Initialize content versioning
      const contentId = options.contentId || `content-${Date.now()}`;
      let currentContentVersion: ContentVersion;

      // If contentId is provided and versions exist, add a new version, otherwise initialize
      if (options.contentId && this.contentVersioningSystem.getVersions(options.contentId).length > 0) {
        currentContentVersion = this.contentVersioningSystem.addVersion(contentId, content, 'AI Generator');
      } else {
        currentContentVersion = this.contentVersioningSystem.initializeVersioning(contentId, content, 'AI Generator');
      }

      // Apply keyword density adjustment if target is provided
      if (options.targetKeywordDensity) {
        content = this.keywordIntegrator.adjustKeywordDensity(content, options.keyword, options.targetKeywordDensity);
      }
      // Apply strategic keyword placement
      content = this.keywordIntegrator.strategicKeywordPlacement(content, options.keyword);

      // Distribute LSI keywords
      if (options.lsiKeywords && options.lsiKeywords.length > 0) {
        content = this.keywordIntegrator.distributeLsiKeywords(content, options.lsiKeywords);
      }

      // Integrate entities
      if (options.entities && options.entities.length > 0) {
        content = this.keywordIntegrator.integrateEntities(content, options.entities);
      }

      // Optimize headings
      if (options.targetOptimizedHeadingsCount !== undefined) {
        content = this.keywordIntegrator.optimizeHeadings(content, options.keyword, options.targetOptimizedHeadingsCount);
      }

      // Incorporate keyword variations
      if (options.keywordVariations && options.keywordVariations.length > 0) {
        content = this.keywordIntegrator.incorporateKeywordVariations(content, options.keywordVariations);
      }

      // Incorporate related keywords
      if (options.relatedKeywords && options.relatedKeywords.length > 0) {
        content = this.keywordIntegrator.incorporateRelatedKeywords(content, options.relatedKeywords);
      }

      const qualityAnalysis = await this.qualityChecker.analyze(content);
      const humanWritingAnalysis = this.humanWritingAnalyzer.analyze(content);
      const eeatOptimization = this.eeatOptimizer.optimize(content, { industry: options.industry, keyword: options.keyword });
      const userValueAnalysis = this.userValueOptimizer.optimize(content, { keyword: options.keyword, targetAudience: options.targetAudience });
      const authoritySignalAnalysis = this.authoritySignalIntegrator.integrate(content);

      // Apply NLP optimizations and collect issues
      const nlpOptimizationIssues: string[] = [];
      const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
      let optimizedSentences: string[] = [];

      sentences.forEach(sentence => {
        let processedSentence = sentence;
        // 1. Enforce SVO (simplified)
        processedSentence = this.nlpOptimizer.enforceSVO(processedSentence);
        
        // 2. Eliminate filler content
        processedSentence = this.nlpOptimizer.eliminateFillerContent(processedSentence);

        // 3. Apply language precision
        processedSentence = this.nlpOptimizer.applyLanguagePrecision(processedSentence);

        optimizedSentences.push(processedSentence);
      });
      content = optimizedSentences.join('. '); // Reconstruct content

      // 4. Prohibited phrase detection
      const prohibitedPhrases = ["meticulous", "navigating", "complexities", "realm", "bespoke", "tailored"];
      const detectedProhibited = this.nlpOptimizer.detectProhibitedPhrases(content, prohibitedPhrases);
      if (detectedProhibited.length > 0) {
        nlpOptimizationIssues.push(`Detected prohibited phrases: ${detectedProhibited.join(', ')}.`);
      }

      // 5. Grammar and syntax validation
      const grammarIssues = this.nlpOptimizer.validateGrammarAndSyntax(content);
      if (grammarIssues.length > 0) {
        nlpOptimizationIssues.push(`Grammar/Syntax issues: ${grammarIssues.join(', ')}.`);
      }

      // 6. Content flow optimization (simplified, as it's mostly handled by prompt and initial generation)
      content = this.nlpOptimizer.optimizeContentFlow(content);

      // 7. Content balance verification
      const contentBalanceIssues = this.keywordIntegrator.verifyContentBalance(content);

      // 8. Uniqueness verification
      const uniquenessVerification = this.uniquenessVerifier.verifyUniqueness(content, options.comparisonCorpus);

      // 9. Topical cluster completion
      const topicalClusterCompletion = this.topicalClusterCompleter.analyzeTopicalCluster(content, options.keyword, options.potentialSubtopics || []);

      // 10. Fact verification
      const factsToVerify = this.extractFactsForVerification(content); // Helper to extract verifiable facts
      const factVerificationResults: FactVerificationResult[] = [];
      for (const fact of factsToVerify) {
        factVerificationResults.push(await this.factVerifier.verifyFact(fact));
      }

      // 11. Source validation
      const sourceValidationResults = this.sourceValidator.validateSources(content);

      // 12. Content accuracy scoring
      const contentAccuracyAnalysis = this.contentAccuracyScorer.scoreAccuracy(content, options.industry);

      // 13. Hallucination detection
      const hallucinationDetection = this.hallucinationDetector.detectHallucinations(content, factVerificationResults);

      // 14. Expert review trigger
      const expertReviewTrigger = this.expertReviewTrigger.triggerReview(content, { industry: options.industry, keyword: options.keyword, sensitiveTopics: options.sensitiveTopics });

      return {
        content,
        wordCount: content.split(/\s+/).length,
        qualityAnalysis,
        humanWritingAnalysis,
        eeatOptimization,
        userValueAnalysis,
        authoritySignalAnalysis,
        nlpOptimizationIssues,
        contentBalanceIssues,
        uniquenessVerification,
        topicalClusterCompletion,
        factVerificationResults,
        sourceValidationResults,
        contentAccuracyAnalysis,
        hallucinationDetection,
        expertReviewTrigger,
        contentVersion: currentContentVersion, // Include the final content version
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating content with OpenAI:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  private extractFactsForVerification(content: string): string[] {
    // Simple regex to find sentences that might contain verifiable facts
    // This is a placeholder and would need to be much more sophisticated
    const factRegex = /[A-Z][^.!?]*\b(?:is|are|was|were|has|have|will be|can be|should be)\b[^.!?]*[.!?]/g;
    const matches = content.match(factRegex);
    return matches || [];
  }
}
