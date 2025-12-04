import { Pool } from 'pg';
import { BaseRepository } from '@/repositories/BaseRepository';
import { Briefing, CreateBriefingDTO, UpdateBriefingDTO } from '@/types';

export class BriefingsRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async create(dto: CreateBriefingDTO): Promise<Briefing> {
    const query = `
      INSERT INTO briefings (user_id, date, metadata)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const params = [
      dto.userId,
      dto.date,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
    ];

    const briefing = await this.queryOne<Briefing>(query, params);

    if (!briefing) {
      throw new Error('Failed to create briefing');
    }

    return briefing;
  }

  async findById(briefingId: string): Promise<Briefing | null> {
    const query = `
      SELECT * FROM briefings
      WHERE id = $1 AND deleted_at IS NULL
    `;

    return this.queryOne<Briefing>(query, [briefingId]);
  }

  async findByDate(date: string, userId: string): Promise<Briefing | null> {
    const query = `
      SELECT 
        b.id,
        b.user_id as "userId",
        b.date,
        b.metadata,
        b.deleted_at as "deletedAt",
        b.created_at as "createdAt",
        b.updated_at as "updatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'briefingId', s.briefing_id,
              'title', s.title,
              'summary', s.summary,
              'content', s.content,
              'sourceUrl', s.source_url,
              'sourceName', s.source_name,
              'publishedAt', s.published_at,
              'coverImageUrl', s.cover_image_url,
              'displayOrder', s.display_order,
              'category', s.category,
              'importance', s.importance,
              'createdAt', s.created_at,
              'updatedAt', s.updated_at
            ) ORDER BY s.display_order ASC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as stories
      FROM briefings b
      LEFT JOIN stories s ON b.id = s.briefing_id
      WHERE b.date = $1 
        AND b.user_id = $2 
        AND b.deleted_at IS NULL
      GROUP BY b.id
      LIMIT 1
    `;

    return this.queryOne<Briefing>(query, [date, userId]);
  }

  async findRecent(userId: string, limit: number = 30): Promise<Briefing[]> {
    const query = `
      SELECT * FROM briefings
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY date DESC
      LIMIT $2
    `;

    return this.queryMany<Briefing>(query, [userId, limit]);
  }

  async update(briefingId: string, dto: UpdateBriefingDTO): Promise<Briefing | null> {
    const query = `
      UPDATE briefings
      SET metadata = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const params = [
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      briefingId,
    ];

    return this.queryOne<Briefing>(query, params);
  }

  async softDelete(briefingId: string): Promise<void> {
    const query = `
      UPDATE briefings
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    await this.query(query, [briefingId]);
  }

  async softDeleteByDate(date: string, userId: string): Promise<void> {
    const query = `
      UPDATE briefings
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE date = $1 AND user_id = $2 AND deleted_at IS NULL
    `;

    await this.query(query, [date, userId]);
  }

  async existsForDate(date: string, userId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM briefings
        WHERE date = $1 AND user_id = $2 AND deleted_at IS NULL
      ) as exists
    `;

    const result = await this.queryOne<{ exists: boolean }>(query, [date, userId]);
    return result?.exists || false;
  }
}
