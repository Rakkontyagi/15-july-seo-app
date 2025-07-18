
export class LSIAnchorTextGenerator {
  generateAnchorText(lsiKeywords: string[], mainKeyword: string): string[] {
    const anchorTexts: string[] = [];
    lsiKeywords.forEach(lsi => {
      anchorTexts.push(lsi);
    });
    anchorTexts.push(mainKeyword);
    return anchorTexts;
  }
}
