import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.importAnomaly.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.exchangeRate.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // ── Create Users ──
  const aisha = await prisma.user.create({
    data: { name: "Aisha", email: "aisha@fairfunds.app", passwordHash },
  });
  const rohan = await prisma.user.create({
    data: { name: "Rohan", email: "rohan@fairfunds.app", passwordHash },
  });
  const priya = await prisma.user.create({
    data: { name: "Priya", email: "priya@fairfunds.app", passwordHash },
  });
  const sam = await prisma.user.create({
    data: { name: "Sam", email: "sam@fairfunds.app", passwordHash },
  });
  const meera = await prisma.user.create({
    data: { name: "Meera", email: "meera@fairfunds.app", passwordHash },
  });
  const dev = await prisma.user.create({
    data: { name: "Dev", email: "dev@fairfunds.app", passwordHash, isGuest: false },
  });

  console.log("✅ Created 6 users");

  // ── Create Group ──
  const group = await prisma.group.create({
    data: {
      name: "Flat Expenses 2026",
      description: "Shared expenses for apartment living — Feb to Apr 2026",
      defaultCurrency: "INR",
    },
  });

  console.log("✅ Created group:", group.name);

  // ── Create Memberships (temporal) ──
  // Aisha: Feb 1 onwards (admin, never left)
  await prisma.groupMembership.create({
    data: {
      userId: aisha.id,
      groupId: group.id,
      role: "ADMIN",
      joinedAt: new Date("2026-02-01"),
    },
  });

  // Rohan: Feb 1 onwards
  await prisma.groupMembership.create({
    data: {
      userId: rohan.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-02-01"),
    },
  });

  // Priya: Feb 1 onwards
  await prisma.groupMembership.create({
    data: {
      userId: priya.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-02-01"),
    },
  });

  // Sam: Apr 15 onwards (joined mid-April)
  await prisma.groupMembership.create({
    data: {
      userId: sam.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-04-15"),
    },
  });

  // Meera: Feb 1 – Mar 28 (left end of March)
  await prisma.groupMembership.create({
    data: {
      userId: meera.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-02-01"),
      leftAt: new Date("2026-03-28"),
    },
  });

  // Dev: weekend visit Feb 8-9, then Goa trip Mar 8-14
  await prisma.groupMembership.create({
    data: {
      userId: dev.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-02-08"),
      leftAt: new Date("2026-02-09"),
    },
  });
  await prisma.groupMembership.create({
    data: {
      userId: dev.id,
      groupId: group.id,
      role: "MEMBER",
      joinedAt: new Date("2026-03-08"),
      leftAt: new Date("2026-03-14"),
    },
  });

  console.log("✅ Created memberships with temporal ranges");

  // ── Seed exchange rates ──
  const usdInrRates = [
    { date: "2026-03-09", rate: 84.48 },
    { date: "2026-03-10", rate: 84.52 },
    { date: "2026-03-11", rate: 84.55 },
    { date: "2026-03-12", rate: 84.50 },
  ];

  for (const r of usdInrRates) {
    await prisma.exchangeRate.create({
      data: {
        baseCurrency: "USD",
        targetCurrency: "INR",
        rate: r.rate,
        date: new Date(r.date),
        source: "frankfurter",
      },
    });
  }

  console.log("✅ Seeded USD→INR exchange rates");

  console.log("\n🎉 Seed complete!");
  console.log(`\n📋 Group ID: ${group.id}`);
  console.log(`\n🔐 Login credentials (all users):`);
  console.log(`   Email: [name]@fairfunds.app`);
  console.log(`   Password: password123`);
  console.log(`   Example: aisha@fairfunds.app / password123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
