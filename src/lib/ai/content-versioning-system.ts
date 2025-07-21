
export interface ContentVersion {
  versionId: string;
  timestamp: string;
  content: string;
  changes: string; // Description of changes from previous version
  author: string; // e.g., 'AI Generator', 'Human Editor'
}

export class ContentVersioningSystem {
  private versions: Map<string, ContentVersion[]> = new Map();

  /**
   * Initializes versioning for a new content piece.
   * @param contentId A unique ID for the content.
   * @param initialContent The initial content string.
   * @param author The author of the initial content (e.g., 'AI Generator').
   * @returns The initial content version.
   */
  initializeVersioning(contentId: string, initialContent: string, author: string = 'AI Generator'): ContentVersion {
    const initialVersion: ContentVersion = {
      versionId: this.generateVersionId(),
      timestamp: new Date().toISOString(),
      content: initialContent,
      changes: 'Initial version',
      author,
    };
    this.versions.set(contentId, [initialVersion]);
    return initialVersion;
  }

  /**
   * Adds a new version to the content's history.
   * @param contentId The unique ID for the content.
   * @param newContent The new content string.
   * @param author The author of the changes (e.g., 'AI Generator', 'Human Editor').
   * @returns The newly created content version.
   */
  addVersion(contentId: string, newContent: string, author: string = 'AI Generator'): ContentVersion {
    const contentVersions = this.versions.get(contentId);
    if (!contentVersions || contentVersions.length === 0) {
      return this.initializeVersioning(contentId, newContent, author); // Initialize if not found
    }

    const lastVersion = contentVersions[contentVersions.length - 1];
    const changes = this.diffContent(lastVersion.content, newContent);

    const newVersion: ContentVersion = {
      versionId: this.generateVersionId(),
      timestamp: new Date().toISOString(),
      content: newContent,
      changes,
      author,
    };
    contentVersions.push(newVersion);
    return newVersion;
  }

  /**
   * Retrieves all versions for a given content ID.
   * @param contentId The unique ID for the content.
   * @returns An array of content versions, or an empty array if not found.
   */
  getVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  /**
   * Generates a unique version ID.
   * @returns A unique version ID string.
   */
  private generateVersionId(): string {
    return `v${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Simulates content diffing to describe changes.
   * In a real system, this would use a proper diffing library.
   * @param oldContent The old content string.
   * @param newContent The new content string.
   * @returns A string describing the changes.
   */
  private diffContent(oldContent: string, newContent: string): string {
    if (oldContent === newContent) {
      return 'No changes.';
    }

    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);

    const addedWords = newWords.filter(word => !oldWords.includes(word));
    const removedWords = oldWords.filter(word => !newWords.includes(word));

    let changes = '';
    if (addedWords.length > 0) {
      changes += `Added ${addedWords.length} unique words.`;
    }
    if (removedWords.length > 0) {
      if (changes) changes += ' ';
      changes += `Removed ${removedWords.length} unique words.`;
    }
    if (!changes) {
      changes = 'Content modified (details not available in simple diff).';
    }

    return changes;
  }
}
