import { Pool } from 'pg';
import { BaseRepository } from '@/repositories/BaseRepository';
import { User, CreateUserDTO, UpdateUserDTO } from '@/types';

export class UserRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const query = `
      INSERT INTO users (email, first_name, last_name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const params = [
      dto.email || null,
      dto.firstName || null,
      dto.lastName || null,
    ];

    const user = await this.queryOne<User>(query, params);

    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  async findById(userId: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;

    return this.queryOne<User>(query, [userId]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1
    `;

    return this.queryOne<User>(query, [email]);
  }

  async update(userId: string, dto: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(dto.email);
      paramIndex++;
    }

    if (dto.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex}`);
      values.push(dto.firstName);
      paramIndex++;
    }

    if (dto.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex}`);
      values.push(dto.lastName);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    return this.queryOne<User>(query, values);
  }

  async delete(userId: string): Promise<void> {
    const query = `
      DELETE FROM users
      WHERE id = $1
    `;

    await this.query(query, [userId]);
  }

  async findAll(limit: number = 100): Promise<User[]> {
    const query = `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `;

    return this.queryMany<User>(query, [limit]);
  }
}
