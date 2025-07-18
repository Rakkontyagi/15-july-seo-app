
export class LinkDistributionOptimizer {
  optimizeLinkDistribution(content: string, links: { keyword: string; url: string }[]): string {
    let optimizedContent = content;
    links.forEach(link => {
      // Very simplistic distribution: just place the link once
      const regex = new RegExp(`\\b(${link.keyword})\\b`, 'i');
      optimizedContent = optimizedContent.replace(regex, `<a href="${link.url}">${link.keyword}</a>`);
    });
    return optimizedContent;
  }
}
