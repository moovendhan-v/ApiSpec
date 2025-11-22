import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      $allOperations: async ({ operation, model, args, query }) => {
        const maxRetries = 3;
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await query(args);
          } catch (error: any) {
            lastError = error;
            // Retry on connection errors
            if (error.code === 'P1001' && i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              continue;
            }
            throw error;
          }
        }
        throw lastError;
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
