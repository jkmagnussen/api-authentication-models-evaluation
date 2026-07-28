/// <reference path="../prisma-client.d.ts" />
import { PrismaClient } from '@prisma/client';
import { DATABASE_URL } from './config';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});
