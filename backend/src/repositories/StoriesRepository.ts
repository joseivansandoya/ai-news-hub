import { Pool } from 'pg';
import { BaseRepository } from '@/repositories/BaseRepository';
import { Story, CreateStoryDTO, UpdateStoryDTO } from '@/types';

export class StoriesRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async create(dto: CreateStoryDTO): Promise<Story> {
    const query = `
      INSERT INTO stories (
        briefing_id,
        title,
        summary,
        content,
        source_url,
        source_name,
        published_at,
        cover_image_url,
        display_order,
        category,
        importance,
        source_urls
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const params = [
      dto.briefingId,
      dto.title,
      dto.summary,
      dto.content,
      dto.sourceUrl,
      dto.sourceName,
      dto.publishedAt,
      dto.coverImageUrl || null,
      dto.displayOrder,
      dto.category || null,
      dto.importance || null,
      JSON.stringify(dto.sourceUrls || [dto.sourceUrl]),
    ];

    const story = await this.queryOne<Story>(query, params);

    if (!story) {
      throw new Error('Failed to create story');
    }

    return story;
  }

  async createMany(dtos: CreateStoryDTO[]): Promise<Story[]> {
    if (dtos.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const dto of dtos) {
      placeholders.push(`(
        $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
        $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++},
        $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}
      )`);

      values.push(
        dto.briefingId,
        dto.title,
        dto.summary,
        dto.content,
        dto.sourceUrl,
        dto.sourceName,
        dto.publishedAt,
        dto.coverImageUrl || null,
        dto.displayOrder,
        dto.category || null,
        dto.importance || null,
        JSON.stringify(dto.sourceUrls || [dto.sourceUrl])
      );
    }

    const query = `
      INSERT INTO stories (
        briefing_id,
        title,
        summary,
        content,
        source_url,
        source_name,
        published_at,
        cover_image_url,
        display_order,
        category,
        importance,
        source_urls
      )
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    return this.queryMany<Story>(query, values);
  }

  async findByBriefingId(briefingId: string): Promise<Story[]> {
    const query = `
      SELECT * FROM stories
      WHERE briefing_id = $1
      ORDER BY display_order ASC
    `;

    return this.queryMany<Story>(query, [briefingId]);
  }

  async findById(id: string): Promise<Story | null> {
    const query = `
      SELECT * FROM stories
      WHERE id = $1
    `;

    return this.queryOne<Story>(query, [id]);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Story | null> {
    const query = `
      SELECT s.* 
      FROM stories s
      JOIN briefings b ON s.briefing_id = b.id
      WHERE s.id = $1 AND b.user_id = $2
    `;

    return this.queryOne<Story>(query, [id, userId]);
  }

  async update(id: string, dto: UpdateStoryDTO): Promise<Story | null> {
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(dto.title);
    }
    if (dto.summary !== undefined) {
      updates.push(`summary = $${paramIndex++}`);
      params.push(dto.summary);
    }
    if (dto.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(dto.content);
    }
    if (dto.sourceUrl !== undefined) {
      updates.push(`source_url = $${paramIndex++}`);
      params.push(dto.sourceUrl);
    }
    if (dto.sourceName !== undefined) {
      updates.push(`source_name = $${paramIndex++}`);
      params.push(dto.sourceName);
    }
    if (dto.publishedAt !== undefined) {
      updates.push(`published_at = $${paramIndex++}`);
      params.push(dto.publishedAt);
    }
    if (dto.coverImageUrl !== undefined) {
      updates.push(`cover_image_url = $${paramIndex++}`);
      params.push(dto.coverImageUrl);
    }
    if (dto.displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      params.push(dto.displayOrder);
    }
    if (dto.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(dto.category);
    }
    if (dto.importance !== undefined) {
      updates.push(`importance = $${paramIndex++}`);
      params.push(dto.importance);
    }
    if (dto.sourceUrls !== undefined) {
      updates.push(`source_urls = $${paramIndex++}`);
      params.push(JSON.stringify(dto.sourceUrls));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE stories
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    return this.queryOne<Story>(query, params);
  }

  async delete(id: string): Promise<void> {
    const query = `
      DELETE FROM stories
      WHERE id = $1
    `;

    await this.query(query, [id]);
  }
}
