// User types
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Briefing types
export interface Briefing {
  id: string;
  userId: string;
  date: string;
  metadata: BriefingMetadata | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stories?: Story[];
}

export interface BriefingMetadata {
  totalItemsFetched: number;
  storiesAfterDedup: number;
  generationTimeMs: number;
  llmTokensUsed: number;
  llmCost: number;
}

export interface CreateBriefingDTO {
  userId: string;
  date: string;
  metadata?: BriefingMetadata;
}

export interface UpdateBriefingDTO {
  metadata?: BriefingMetadata;
}

// Stories types
export interface Story {
  id: string;
  briefingId: string;
  title: string;
  summary: string[];
  content: string[];
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  coverImageUrl: string | null;
  displayOrder: number;
  category: string | null;
  importance: number | null;
  sourceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoryDTO {
  briefingId: string;
  title: string;
  summary: string[];
  content: string[];
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
  coverImageUrl?: string | null;
  displayOrder: number;
  category?: string | null;
  importance?: number | null;
  sourceUrls?: string[];
}

export interface UpdateStoryDTO {
  title?: string;
  summary?: string[];
  content?: string[];
  sourceUrl?: string;
  sourceName?: string;
  publishedAt?: Date;
  coverImageUrl?: string | null;
  displayOrder?: number;
  category?: string | null;
  importance?: number | null;
  sourceUrls?: string[];
}

