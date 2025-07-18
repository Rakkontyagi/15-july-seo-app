export function addAuthenticDialogueElements(content: string, dialogue: string): string {
  const paragraphs = content.split(/\n\s*\n/);
  if (paragraphs.length > 0) {
    const randomIndex = Math.floor(Math.random() * paragraphs.length);
    paragraphs.splice(randomIndex, 0, dialogue);
  }
  return paragraphs.join('\n\n');
}