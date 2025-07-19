/**
 * Type definitions for the Internal AI Humanization Engine
 * Story 7.1: Internal AI Humanization Engine and Pattern Detection
 */

// Core Analysis Interfaces
export interface AIPatternAnalysis {
  repetitivePhrases: RepetitivePhrase[];
  sentenceStructurePatterns: SentenceStructurePattern[];
  predictableWritingPatterns: PredictablePattern[];
  aiTypicalPhraseCount: number;
  patternFrequencyScore: number;
  overallRiskScore: number;
}

export interface RepetitivePhrase {
  phrase: string;
  count: number;
  positions: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface SentenceStructurePattern {
  pattern: string;
  frequency: number;
  examples: string[];
  riskLevel: number;
}

export interface PredictablePattern {
  type: 'intro' | 'transition' | 'conclusion' | 'filler';
  pattern: string;
  confidence: number;
  suggestions: string[];
}

// Sentence Structure Analysis
export interface SentenceStructureAnalysis {
  lengthDistribution: LengthDistribution;
  structuralVariation: StructuralVariation;
  flowDiversity: FlowDiversity;
  predictabilityScore: number;
}

export interface LengthDistribution {
  averageLength: number;
  variance: number;
  distribution: { [range: string]: number };
  diversityScore: number;
}

export interface StructuralVariation {
  sentenceTypes: { [type: string]: number };
  startingWords: { [word: string]: number };
  variationScore: number;
}

export interface FlowDiversity {
  transitionVariety: number;
  rhythmScore: number;
  naturalness: number;
}

// Vocabulary Analysis
export interface VocabularyAnalysis {
  complexity: VocabularyComplexity;
  range: VocabularyRange;
  diversity: LexicalDiversity;
  enhancement: VocabularyEnhancement;
}

export interface VocabularyComplexity {
  averageWordLength: number;
  syllableComplexity: number;
  readabilityScore: number;
  sophisticationLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface VocabularyRange {
  uniqueWords: number;
  totalWords: number;
  vocabularyRichness: number;
  domainSpecificTerms: string[];
}

export interface LexicalDiversity {
  typeTokenRatio: number;
  movingAverageTypeTokenRatio: number;
  lexicalDensity: number;
  synonymVariation: SynonymVariation[];
}

export interface SynonymVariation {
  word: string;
  synonyms: string[];
  usageFrequency: { [synonym: string]: number };
  variationScore: number;
}

export interface VocabularyEnhancement {
  suggestions: EnhancementSuggestion[];
  replacements: WordReplacement[];
  additionOpportunities: string[];
}

export interface EnhancementSuggestion {
  type: 'synonym' | 'complexity' | 'specificity';
  original: string;
  suggested: string[];
  reason: string;
}

export interface WordReplacement {
  position: number;
  original: string;
  replacement: string;
  improvement: string;
}

// Human Writing Markers
export interface HumanWritingMarkers {
  personalInsights: PersonalInsight[];
  opinions: Opinion[];
  experiences: Experience[];
  subjectiveCommentary: SubjectiveComment[];
  authenticVoice: VoiceCharacteristics;
}

export interface PersonalInsight {
  content: string;
  position: number;
  authenticity: number;
  type: 'experience' | 'observation' | 'reflection';
}

export interface Opinion {
  statement: string;
  strength: 'mild' | 'moderate' | 'strong';
  position: number;
  supportingEvidence: string[];
}

export interface Experience {
  narrative: string;
  relevance: number;
  authenticity: number;
  emotionalResonance: number;
}

export interface SubjectiveComment {
  comment: string;
  subjectivity: number;
  position: number;
  impact: number;
}

export interface VoiceCharacteristics {
  tone: string;
  personality: string[];
  consistency: number;
  authenticity: number;
}

// Natural Imperfections
export interface NaturalImperfections {
  inconsistencies: Inconsistency[];
  styleVariations: StyleVariation[];
  humanQuirks: HumanQuirk[];
  hesitationMarkers: HesitationMarker[];
  flowInterruptions: FlowInterruption[];
}

export interface Inconsistency {
  type: 'spelling' | 'grammar' | 'style' | 'formatting';
  original: string;
  position: number;
  severity: 'subtle' | 'noticeable';
}

export interface StyleVariation {
  aspect: 'formality' | 'complexity' | 'structure';
  variation: string;
  naturalness: number;
}

export interface HumanQuirk {
  type: 'repetition' | 'preference' | 'habit';
  manifestation: string;
  frequency: number;
}

export interface HesitationMarker {
  marker: string;
  position: number;
  naturalness: number;
}

export interface FlowInterruption {
  type: 'parenthetical' | 'aside' | 'clarification';
  content: string;
  position: number;
  effectiveness: number;
}

// Conversational Elements
export interface ConversationalElements {
  speechPatterns: SpeechPattern[];
  colloquialisms: Colloquialism[];
  informalExpressions: InformalExpression[];
  transitions: ConversationalTransition[];
  dialogueElements: DialogueElement[];
}

export interface SpeechPattern {
  pattern: string;
  naturalness: number;
  frequency: number;
  context: string;
}

export interface Colloquialism {
  expression: string;
  meaning: string;
  appropriateness: number;
  region?: string;
}

export interface InformalExpression {
  expression: string;
  formalEquivalent: string;
  casualness: number;
}

export interface ConversationalTransition {
  phrase: string;
  function: string;
  naturalness: number;
}

export interface DialogueElement {
  element: string;
  type: 'question' | 'exclamation' | 'address';
  engagement: number;
}

// Pattern Breaking
export interface PatternBreaking {
  structureRandomization: StructureRandomization;
  predictabilityElimination: PredictabilityElimination;
  styleVariation: PatternStyleVariation;
  diversityEnhancement: DiversityEnhancement;
  authenticityValidation: AuthenticityValidation;
}

export interface StructureRandomization {
  sentenceStructures: string[];
  randomizationScore: number;
  effectiveness: number;
}

export interface PredictabilityElimination {
  eliminatedPatterns: string[];
  replacements: { [pattern: string]: string[] };
  improvementScore: number;
}

export interface PatternStyleVariation {
  variations: StyleVariationOption[];
  consistency: number;
  naturalness: number;
}

export interface StyleVariationOption {
  aspect: string;
  options: string[];
  selected: string;
  reasoning: string;
}

export interface DiversityEnhancement {
  enhancements: Enhancement[];
  diversityScore: number;
  impact: number;
}

export interface Enhancement {
  type: string;
  description: string;
  implementation: string;
  effectiveness: number;
}

export interface AuthenticityValidation {
  score: number;
  factors: AuthenticityFactor[];
  recommendations: string[];
  confidence: number;
}

export interface AuthenticityFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
}

// Main Humanization Result
export interface HumanizationResult {
  originalContent: string;
  humanizedContent: string;
  analysis: {
    aiPatterns: AIPatternAnalysis;
    sentenceStructure: SentenceStructureAnalysis;
    vocabulary: VocabularyAnalysis;
    humanMarkers: HumanWritingMarkers;
    imperfections: NaturalImperfections;
    conversational: ConversationalElements;
    patternBreaking: PatternBreaking;
  };
  metrics: {
    humanizationScore: number;
    authenticityScore: number;
    naturalness: number;
    aiDetectionRisk: number;
  };
  processingTime: number;
  recommendations: string[];
}

// Configuration Interfaces
export interface HumanizationConfig {
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  preserveStyle: boolean;
  targetAudience: 'general' | 'academic' | 'professional' | 'casual';
  qualityThreshold: number;
  enabledFeatures: {
    patternDetection: boolean;
    structureVariation: boolean;
    vocabularyEnhancement: boolean;
    humanMarkers: boolean;
    imperfections: boolean;
    conversationalElements: boolean;
    patternBreaking: boolean;
  };
}

export interface ProcessingOptions {
  maxProcessingTime: number;
  enableCaching: boolean;
  parallelProcessing: boolean;
  detailedAnalysis: boolean;
}
