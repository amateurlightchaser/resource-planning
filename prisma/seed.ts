import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  await prisma.assignment.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.person.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({ data: { email: 'admin@example.com', name: 'Admin', passwordHash: await hashPassword('password123') } });

  const people = await prisma.$transaction([
    prisma.person.create({ data: { name: 'Alicia Tan', role: 'Product Designer', team: 'Design', location: 'Singapore', email: 'alicia@example.com' } }),
    prisma.person.create({ data: { name: 'Ben Koh', role: 'Frontend Engineer', team: 'Engineering', location: 'Singapore', email: 'ben@example.com' } }),
    prisma.person.create({ data: { name: 'Carol Lim', role: 'Project Manager', team: 'Delivery', location: 'Singapore', email: 'carol@example.com' } })
  ]);

  const projects = await prisma.$transaction([
    prisma.project.create({ data: { name: 'Apollo Redesign', code: 'APO', color: '#3b82f6', status: 'active', client: 'Acme Corp' } }),
    prisma.project.create({ data: { name: 'Mercury Mobile', code: 'MER', color: '#10b981', status: 'planned', client: 'Globex' } })
  ]);

  await prisma.assignment.createMany({
    data: [
      { personId: people[0].id, projectId: projects[0].id, startDateTime: new Date(), endDateTime: new Date(Date.now() + 2 * 86400000), allocationHoursPerDay: 6 },
      { personId: people[1].id, projectId: projects[0].id, startDateTime: new Date(), endDateTime: new Date(Date.now() + 3 * 86400000), allocationHoursPerDay: 8 },
      { personId: people[2].id, projectId: projects[1].id, startDateTime: new Date(), endDateTime: new Date(Date.now() + 5 * 86400000), allocationHoursPerDay: 4 }
    ]
  });

  await prisma.timeOff.create({
    data: {
      personId: people[0].id,
      startDateTime: new Date(Date.now() + 7 * 86400000),
      endDateTime: new Date(Date.now() + 8 * 86400000),
      type: 'vacation'
    }
  });

  console.log('Seeded user:', user.email);
}

main().finally(async () => prisma.$disconnect());
