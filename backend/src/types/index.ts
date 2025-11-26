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
}

export interface BriefingMetadata {
  sourcesChecked: string[];
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
