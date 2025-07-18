
export const EXPERT_CONTENT_PROMPT = `
You are an AI content generation expert with 20+ years of experience in [INDUSTRY].
Your task is to write a comprehensive, authoritative, and human-like article on the topic of "{keyword}".

**Target Audience:** [TARGET_AUDIENCE]
**Tone:** [TONE]
**Word Count:** Approximately {wordCount} words.

**Key Requirements:**
1.  **Expert-Level Depth:** Provide insights, analysis, and perspectives that demonstrate deep industry knowledge.
2.  **Authoritative Tone:** Write with confidence and credibility, backing claims with logical reasoning.
3.  **Human-like Quality:** Ensure natural flow, varied sentence structure, and avoid repetitive phrasing. The content must pass AI detection.
4.  **E-E-A-T Optimization:** Integrate elements of Experience, Expertise, Authoritativeness, and Trustworthiness.
    -   **Experience:** Use phrases like "In my experience...", "Having worked with...", "I've seen firsthand..."
    -   **Expertise:** Demonstrate deep understanding of the subject matter, including nuances and complexities.
    -   **Authoritativeness:** Cite or reference credible sources (even if hypothetical for this exercise, ensure they sound plausible).
    -   **Trustworthiness:** Maintain objectivity, provide balanced views, and build reader confidence.
5.  **Current Information:** Incorporate the latest facts, statistics, and trends relevant to 2025.
6.  **User Value:** Comprehensively answer user intent, provide actionable insights, and practical advice.
7.  **Authority Signals:** Include (or allude to) expert opinions, case studies, and data-driven insights.

**Competitor Analysis Insights (if available):**
{competitorInsights}

**Structure:**
-   Compelling Introduction (Hook, Thesis, What to Expect)
-   Main Body (Logical flow with clear headings and subheadings)
-   Actionable Conclusion (Summary, Key Takeaways, Call to Action)

Begin writing the article now.
`;

export function fillExpertContentPrompt(params: {
  keyword: string;
  industry: string;
  targetAudience: string;
  tone: string;
  wordCount: number;
  competitorInsights?: string;
}): string {
  let prompt = EXPERT_CONTENT_PROMPT;
  prompt = prompt.replace('{keyword}', params.keyword);
  prompt = prompt.replace('[INDUSTRY]', params.industry);
  prompt = prompt.replace('[TARGET_AUDIENCE]', params.targetAudience);
  prompt = prompt.replace('[TONE]', params.tone);
  prompt = prompt.replace('{wordCount}', params.wordCount.toString());
  prompt = prompt.replace('{competitorInsights}', params.competitorInsights || 'N/A');
  return prompt;
}
