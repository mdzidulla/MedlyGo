/**
 * Create Super Admin Script
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 *
 * Environment:
 *   Requires DATABASE_URL to be set (reads from .env or .env.local)
 *
 * This script creates (or updates) a super admin user in the database.
 * Only admins can onboard hospitals/providers via the admin dashboard.
 * Patients sign up themselves through the website.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n=== MedlyGo Super Admin Setup ===\n')

  const email = await prompt('Admin email: ')
  if (!email) {
    console.error('Email is required.')
    process.exit(1)
  }

  const fullName = await prompt('Full name: ')
  if (!fullName) {
    console.error('Full name is required.')
    process.exit(1)
  }

  const password = await prompt('Password (min 8 chars): ')
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      fullName,
      name: fullName,
      role: 'admin',
    },
    create: {
      email,
      password: hashedPassword,
      fullName,
      name: fullName,
      role: 'admin',
      emailVerified: new Date(),
    },
  })

  console.log(`\nSuper admin created successfully!`)
  console.log(`  Email: ${admin.email}`)
  console.log(`  Name:  ${admin.fullName}`)
  console.log(`  Role:  ${admin.role}`)
  console.log(`  ID:    ${admin.id}\n`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error creating admin:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
