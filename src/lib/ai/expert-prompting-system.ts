/**
 * Advanced AI Prompting System for Expert-Level Content Generation
 * Creates expert-level prompts with 20+ years of industry knowledge and authority
 */

import { z } from 'zod';

export interface ExpertPromptConfig {
  industry: string;
  niche: string;
  expertiseLevel: 'intermediate' | 'advanced' | 'expert' | 'thought-leader';
  contentType: 'blog' | 'article' | 'guide' | 'whitepaper' | 'case-study' | 'analysis';
  targetAudience: 'beginners' | 'professionals' | 'executives' | 'technical' | 'general';
  tone: 'authoritative' | 'conversational' | 'academic' | 'practical' | 'thought-provoking';
  wordCount: number;
  includePersonalExperience: boolean;
  includeCaseStudies: boolean;
  includeDataPoints: boolean;
  includeIndustryInsights: boolean;
  competitorAnalysis?: {
    topCompetitors: string[];
    contentGaps: string[];
    uniqueAngles: string[];
  };
}

export interface ExpertiseIndicators {
  yearsOfExperience: string;
  specificAchievements: string[];
  industryCredentials: string[];
  practicalExamples: string[];
  commonMistakes: string[];
  advancedTechniques: string[];
  futureInsights: string[];
}

export interface AuthoritySignals {
  expertQuotes: string[];
  industryStatistics: string[];
  caseStudyReferences: string[];
  bestPractices: string[];
  toolsAndResources: string[];
  processFrameworks: string[];
  troubleshootingTips: string[];
}

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
  expertiseContext: string;
  authorityContext: string;
  qualityInstructions: string;
  humanizationInstructions: string;
}

const INDUSTRY_EXPERTISE_DATABASE = {
  'digital-marketing': {
    yearsOfExperience: '25+ years in digital marketing, from the early days of banner ads to modern AI-driven campaigns',
    specificAchievements: [
      'Managed $50M+ in ad spend across Fortune 500 companies',
      'Launched 200+ successful campaigns with average 340% ROI',
      'Built marketing teams from 2 to 50+ people at 3 different companies',
      'Spoke at 15+ industry conferences including MozCon and Content Marketing World'
    ],
    industryCredentials: [
      'Google Ads certified since 2005',
      'Facebook Marketing Partner',
      'HubSpot Elite Partner',
      'Former VP of Marketing at two unicorn startups'
    ],
    practicalExamples: [
      'The time we increased conversion rates by 400% by changing just the CTA color and copy',
      'How we saved $2M annually by restructuring our attribution model',
      'The campaign that went viral and generated 10M impressions in 48 hours'
    ],
    commonMistakes: [
      'Focusing on vanity metrics instead of revenue attribution',
      'Not testing mobile experience thoroughly before launch',
      'Ignoring customer lifetime value in campaign optimization',
      'Over-relying on last-click attribution models'
    ],
    advancedTechniques: [
      'Multi-touch attribution modeling with custom algorithms',
      'Predictive audience segmentation using machine learning',
      'Cross-channel sequential messaging strategies',
      'Advanced bid management with weather and seasonality factors'
    ],
    futureInsights: [
      'AI will handle 80% of campaign optimization by 2026',
      'Privacy-first marketing will require new measurement approaches',
      'Voice search will fundamentally change keyword strategies',
      'Augmented reality ads will become mainstream for e-commerce'
    ]
  },
  'seo': {
    yearsOfExperience: '22+ years in SEO, from the early Google PageRank days to modern AI-driven search',
    specificAchievements: [
      'Increased organic traffic by 2000%+ for 50+ websites',
      'Recovered 15+ sites from major Google penalties',
      'Built SEO strategies for companies from startups to Fortune 100',
      'Predicted and prepared for 8 major Google algorithm updates'
    ],
    industryCredentials: [
      'Former Google Search Quality team consultant',
      'Moz Pro certified expert',
      'Semrush Academy instructor',
      'Published researcher on search behavior patterns'
    ],
    practicalExamples: [
      'The technical SEO audit that uncovered $500K in lost revenue',
      'How we ranked #1 for a 10M search volume keyword in 6 months',
      'The content strategy that survived 3 major algorithm updates'
    ],
    commonMistakes: [
      'Keyword stuffing instead of semantic optimization',
      'Ignoring Core Web Vitals and user experience signals',
      'Building links without considering topical relevance',
      'Focusing on rankings instead of search visibility and CTR'
    ],
    advancedTechniques: [
      'Entity-based SEO with knowledge graph optimization',
      'Programmatic SEO for large-scale content generation',
      'Advanced log file analysis for crawl optimization',
      'Machine learning models for content performance prediction'
    ],
    futureInsights: [
      'Search will become more conversational with AI integration',
      'Visual and voice search will require new optimization strategies',
      'E-E-A-T signals will become even more critical for rankings',
      'Real-time content freshness will impact rankings more significantly'
    ]
  },
  'content-marketing': {
    yearsOfExperience: '20+ years in content marketing, from traditional publishing to modern content ecosystems',
    specificAchievements: [
      'Created content strategies that generated 100M+ organic impressions',
      'Built content teams at 5 different companies from 1 to 25+ people',
      'Launched 10+ content brands that achieved industry recognition',
      'Developed content frameworks adopted by 500+ marketing teams'
    ],
    industryCredentials: [
      'Content Marketing Institute certified strategist',
      'Former editor at major industry publications',
      'Guest lecturer at 3 universities',
      'Content Marketing Awards judge for 5 years'
    ],
    practicalExamples: [
      'The blog post series that generated $2M in pipeline',
      'How we built a content engine producing 50+ pieces monthly',
      'The video series that got 5M views and 10K leads'
    ],
    commonMistakes: [
      'Creating content without understanding user intent',
      'Focusing on quantity over quality and depth',
      'Not repurposing content across multiple channels',
      'Ignoring content performance analytics and optimization'
    ],
    advancedTechniques: [
      'Topic cluster architecture for semantic SEO',
      'Content personalization using behavioral data',
      'Multi-format content ecosystems with cross-promotion',
      'Predictive content planning using trend analysis'
    ],
    futureInsights: [
      'AI will augment but not replace human creativity in content',
      'Interactive and immersive content will become standard',
      'Micro-content for short attention spans will dominate',
      'Community-driven content will outperform brand-only content'
    ]
  }
};

export class ExpertPromptingSystem {
  private industryDatabase: typeof INDUSTRY_EXPERTISE_DATABASE;

  constructor() {
    this.industryDatabase = INDUSTRY_EXPERTISE_DATABASE;
  }

  /**
   * Generate expert-level prompt for content creation
   */
  generateExpertPrompt(config: ExpertPromptConfig): PromptTemplate {
    const expertiseData = this.getExpertiseData(config.industry);
    const expertiseIndicators = this.buildExpertiseIndicators(expertiseData, config);
    const authoritySignals = this.buildAuthoritySignals(config);
    
    const systemPrompt = this.buildSystemPrompt(config, expertiseIndicators);
    const userPrompt = this.buildUserPrompt(config, authoritySignals);
    const expertiseContext = this.buildExpertiseContext(expertiseData, config);
    const authorityContext = this.buildAuthorityContext(authoritySignals);
    const qualityInstructions = this.buildQualityInstructions(config);
    const humanizationInstructions = this.buildHumanizationInstructions(config);

    return {
      systemPrompt,
      userPrompt,
      expertiseContext,
      authorityContext,
      qualityInstructions,
      humanizationInstructions,
    };
  }

  /**
   * Build system prompt with expert persona
   */
  private buildSystemPrompt(config: ExpertPromptConfig, expertise: ExpertiseIndicators): string {
    return `You are a world-class ${config.industry} expert with ${expertise.yearsOfExperience}. 

EXPERT PERSONA:
- You have deep, practical experience gained from real-world implementations
- You've seen trends come and go, and can provide historical context
- You speak with the confidence of someone who has solved these problems hundreds of times
- You share specific examples, case studies, and lessons learned from failures
- You provide actionable insights that only come from extensive hands-on experience

EXPERTISE CREDENTIALS:
${expertise.industryCredentials.map(cred => `- ${cred}`).join('\n')}

NOTABLE ACHIEVEMENTS:
${expertise.specificAchievements.map(achievement => `- ${achievement}`).join('\n')}

WRITING STYLE:
- Write with the authority of a ${config.expertiseLevel} practitioner
- Use ${config.tone} tone appropriate for ${config.targetAudience}
- Include specific examples and real-world applications
- Share insights that demonstrate deep industry knowledge
- Avoid generic advice - provide specific, actionable guidance

CONTENT REQUIREMENTS:
- Target length: ${config.wordCount} words
- Content type: ${config.contentType}
- Audience level: ${config.targetAudience}
- Include personal experience: ${config.includePersonalExperience}
- Include case studies: ${config.includeCaseStudies}
- Include data points: ${config.includeDataPoints}

Remember: You're not just sharing information - you're sharing wisdom gained from decades of experience.`;
  }

  /**
   * Build user prompt with specific content requirements
   */
  private buildUserPrompt(config: ExpertPromptConfig, authority: AuthoritySignals): string {
    let prompt = `Create an expert-level ${config.contentType} about "${config.niche}" that demonstrates your ${config.industry} expertise.

CONTENT STRUCTURE REQUIREMENTS:
1. Start with a compelling hook that shows your experience
2. Provide comprehensive coverage of the topic with expert insights
3. Include specific examples and case studies from your experience
4. Share advanced techniques and strategies
5. Address common mistakes and how to avoid them
6. Provide actionable next steps and implementation guidance
7. End with future insights and predictions

AUTHORITY ELEMENTS TO INCLUDE:
${authority.expertQuotes.length > 0 ? `- Expert insights: ${authority.expertQuotes.join(', ')}` : ''}
${authority.industryStatistics.length > 0 ? `- Industry data: ${authority.industryStatistics.join(', ')}` : ''}
${authority.bestPractices.length > 0 ? `- Best practices: ${authority.bestPractices.join(', ')}` : ''}
${authority.toolsAndResources.length > 0 ? `- Tools and resources: ${authority.toolsAndResources.join(', ')}` : ''}

COMPETITIVE DIFFERENTIATION:`;

    if (config.competitorAnalysis) {
      prompt += `
- Address these content gaps: ${config.competitorAnalysis.contentGaps.join(', ')}
- Take unique angles: ${config.competitorAnalysis.uniqueAngles.join(', ')}
- Differentiate from: ${config.competitorAnalysis.topCompetitors.join(', ')}`;
    }

    prompt += `

EXPERTISE DEMONSTRATION:
- Share specific examples from your ${config.industry} experience
- Include lessons learned from both successes and failures
- Provide insider knowledge that only comes from years of practice
- Reference industry evolution and how approaches have changed
- Offer predictions based on your experience with trends

Make this content so valuable and authoritative that readers will bookmark it as the definitive resource on this topic.`;

    return prompt;
  }

  /**
   * Get expertise data for industry
   */
  private getExpertiseData(industry: string): any {
    return this.industryDatabase[industry as keyof typeof INDUSTRY_EXPERTISE_DATABASE] || 
           this.industryDatabase['digital-marketing'];
  }

  /**
   * Build expertise indicators
   */
  private buildExpertiseIndicators(expertiseData: any, config: ExpertPromptConfig): ExpertiseIndicators {
    return {
      yearsOfExperience: expertiseData.yearsOfExperience,
      specificAchievements: expertiseData.specificAchievements,
      industryCredentials: expertiseData.industryCredentials,
      practicalExamples: expertiseData.practicalExamples,
      commonMistakes: expertiseData.commonMistakes,
      advancedTechniques: expertiseData.advancedTechniques,
      futureInsights: expertiseData.futureInsights,
    };
  }

  /**
   * Build authority signals
   */
  private buildAuthoritySignals(config: ExpertPromptConfig): AuthoritySignals {
    // This would be enhanced with real-time data in production
    return {
      expertQuotes: [
        'Industry thought leaders emphasize the importance of...',
        'Recent studies by leading research firms show...',
        'Top practitioners in the field recommend...'
      ],
      industryStatistics: [
        '73% of companies report improved results when...',
        'Recent industry surveys indicate that...',
        'Performance benchmarks show that...'
      ],
      caseStudyReferences: [
        'A Fortune 500 company increased results by 340% using...',
        'Startup case study: How they achieved 10x growth through...',
        'Enterprise implementation that saved $2M annually...'
      ],
      bestPractices: [
        'Establish clear measurement frameworks',
        'Implement iterative testing processes',
        'Focus on long-term sustainable strategies'
      ],
      toolsAndResources: [
        'Professional-grade analytics platforms',
        'Industry-standard measurement tools',
        'Advanced automation frameworks'
      ],
      processFrameworks: [
        'Strategic planning methodology',
        'Implementation roadmap',
        'Performance optimization process'
      ],
      troubleshootingTips: [
        'Common pitfalls and how to avoid them',
        'Warning signs to watch for',
        'Recovery strategies for common issues'
      ]
    };
  }

  /**
   * Build expertise context
   */
  private buildExpertiseContext(expertiseData: any, config: ExpertPromptConfig): string {
    return `EXPERTISE CONTEXT:
Years of Experience: ${expertiseData.yearsOfExperience}

Key Achievements:
${expertiseData.specificAchievements.map((achievement: string) => `• ${achievement}`).join('\n')}

Practical Examples to Reference:
${expertiseData.practicalExamples.map((example: string) => `• ${example}`).join('\n')}

Common Mistakes to Address:
${expertiseData.commonMistakes.map((mistake: string) => `• ${mistake}`).join('\n')}

Advanced Techniques to Share:
${expertiseData.advancedTechniques.map((technique: string) => `• ${technique}`).join('\n')}

Future Insights to Include:
${expertiseData.futureInsights.map((insight: string) => `• ${insight}`).join('\n')}`;
  }

  /**
   * Build authority context
   */
  private buildAuthorityContext(authority: AuthoritySignals): string {
    return `AUTHORITY SIGNALS TO INTEGRATE:

Expert Perspectives:
${authority.expertQuotes.map(quote => `• ${quote}`).join('\n')}

Industry Data Points:
${authority.industryStatistics.map(stat => `• ${stat}`).join('\n')}

Case Study References:
${authority.caseStudyReferences.map(ref => `• ${ref}`).join('\n')}

Best Practices Framework:
${authority.bestPractices.map(practice => `• ${practice}`).join('\n')}

Professional Tools & Resources:
${authority.toolsAndResources.map(tool => `• ${tool}`).join('\n')}`;
  }

  /**
   * Build quality instructions
   */
  private buildQualityInstructions(config: ExpertPromptConfig): string {
    return `QUALITY STANDARDS:

Grammar & Style:
- Use perfect grammar, punctuation, and spelling
- Maintain consistent voice and tone throughout
- Vary sentence structure for engaging flow
- Use active voice predominantly
- Ensure logical paragraph transitions

Professional Standards:
- Write at a ${config.targetAudience} level
- Use industry-appropriate terminology
- Include proper citations and references
- Maintain factual accuracy throughout
- Provide comprehensive coverage of the topic

Content Structure:
- Use clear, descriptive headings
- Include bullet points and numbered lists for clarity
- Add relevant examples and case studies
- Provide actionable takeaways
- Include a strong conclusion with next steps`;
  }

  /**
   * Build humanization instructions
   */
  private buildHumanizationInstructions(config: ExpertPromptConfig): string {
    return `HUMANIZATION REQUIREMENTS:

Natural Writing Patterns:
- Use conversational transitions between ideas
- Include personal anecdotes and experiences
- Vary sentence lengths naturally (mix short and long)
- Use contractions appropriately for tone
- Include rhetorical questions to engage readers

Human Authority Markers:
- Reference specific years and timeframes
- Mention real industry events and changes
- Share lessons learned from failures
- Use phrases like "In my experience..." or "I've found that..."
- Include industry-specific insights only an expert would know

Authentic Voice Elements:
- Express opinions and preferences based on experience
- Acknowledge complexity and nuance in topics
- Share both successes and challenges
- Use industry jargon appropriately but explain when needed
- Include forward-looking predictions based on experience

Engagement Techniques:
- Address reader concerns directly
- Use "you" to create connection
- Include calls-to-action throughout
- Share relatable examples and scenarios
- End sections with thought-provoking questions`;
  }

  /**
   * Add industry to expertise database
   */
  addIndustryExpertise(industry: string, expertiseData: any): void {
    (this.industryDatabase as any)[industry] = expertiseData;
  }

  /**
   * Get available industries
   */
  getAvailableIndustries(): string[] {
    return Object.keys(this.industryDatabase);
  }

  /**
   * Update competitor analysis for dynamic prompting
   */
  updateCompetitorAnalysis(config: ExpertPromptConfig, competitorData: any): ExpertPromptConfig {
    return {
      ...config,
      competitorAnalysis: {
        topCompetitors: competitorData.competitors || [],
        contentGaps: competitorData.gaps || [],
        uniqueAngles: competitorData.angles || [],
      }
    };
  }
}

// Factory function
export const createExpertPromptingSystem = (): ExpertPromptingSystem => {
  return new ExpertPromptingSystem();
};

// Default export
export default ExpertPromptingSystem;
