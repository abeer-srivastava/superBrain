export const INGEST_QUEUE = 'extraction';

export interface IngestJob {
  contentId: string;
  /** Skip extraction + enrichment and only re-embed existing text. */
  reembedOnly?: boolean;
}
