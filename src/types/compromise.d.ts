declare module 'compromise' {
  interface CompromiseDoc {
    match(pattern: string): CompromiseDoc;
    out(format: string): string[];
    length: number;
    text(): string;
  }

  function compromise(text: string): CompromiseDoc;
  export = compromise;
}