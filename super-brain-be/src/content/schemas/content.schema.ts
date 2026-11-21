import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const CONTENT_TYPES = ['link', 'note', 'pdf', 'image'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const CONTENT_STATUSES = ['processing', 'ready', 'failed'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ContentDocument = HydratedDocument<Content>;

@Schema({ timestamps: true })
export class Content {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: CONTENT_TYPES })
  type: ContentType;

  /** Public web URL for links (and PDFs saved by URL). Never a filesystem path. */
  @Prop()
  originalLink?: string;

  @Prop({ trim: true, maxlength: 300 })
  title?: string;

  /** Full text — the note body for notes, extracted text otherwise. Not returned in lists. */
  @Prop()
  extractedText?: string;

  /** Original YouTube transcript, retained privately when extractedText is translated. */
  @Prop({ select: false })
  originalText?: string;

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  keyPoints: string[];

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  /** The user's own thoughts about this item, separate from the source. */
  @Prop({ maxlength: 20000 })
  annotation?: string;

  // ── Source metadata ─────────────────────────────────────────────────────
  @Prop() siteName?: string;
  @Prop() author?: string;
  @Prop() imageUrl?: string;
  @Prop() wordCount?: number;

  // ── Uploaded file (opaque storage key; served via authenticated API) ────
  @Prop({ select: false }) filePath?: string;
  @Prop() fileName?: string;
  @Prop() mimeType?: string;
  @Prop() fileSize?: number;

  // ── State ──────────────────────────────────────────────────────────────
  @Prop({ type: String, required: true, enum: CONTENT_STATUSES, default: 'processing' })
  status: ContentStatus;

  /** Human-readable reason when status is "failed". */
  @Prop() error?: string;

  @Prop({ default: false }) favorite: boolean;

  /** Hidden from the public share page even when sharing is on. */
  @Prop({ default: false }) isPrivate: boolean;

  @Prop() lastViewedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index(
  { title: 'text', tags: 'text', summary: 'text', annotation: 'text', extractedText: 'text' },
  {
    name: 'content_fulltext',
    weights: { title: 10, tags: 6, summary: 4, annotation: 3, extractedText: 1 },
    default_language: 'english',
  },
);

/** Fields safe and cheap to return in list views. */
export const LIST_PROJECTION = '-extractedText -filePath';
