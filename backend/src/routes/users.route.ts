import { Router, Request, Response } from 'express';
import { UsersRepository } from '@/repositories/UsersRepository';
import { CreateUserDTO } from '@/types';

export function createUsersRoutes(
  usersRepo: UsersRepository,
): Router {
  const router = Router();

  // POST /api/users
  router.post('/', async (req: Request, res: Response) => {
    try {
      const userDto: CreateUserDTO = req.body;
      const user = await usersRepo.create(userDto);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error });
    }
  });

  return router;
}
