import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 1. Prisma 7 requires a dedicated Postgres Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool)

// 3. Initialize the Client with the adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma