import {
  PrismaClient,
  Prisma,
  Role,
  CourseStatus,
  LectureType,
  LectureStatus,
  PaymentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_EMAILS = [
  "admin@edutania.com",
  "teacher1@edutania.com",
  "teacher2@edutania.com",
  "student1@edutania.com",
  "student2@edutania.com",
] as const;

const BCRYPT_ROUNDS = 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function main() {
  const [
    adminHash,
    teacher1Hash,
    teacher2Hash,
    student1Hash,
    student2Hash,
  ] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("teacher123"),
    hashPassword("teacher123"),
    hashPassword("student123"),
    hashPassword("student123"),
  ]);

  await prisma.user.deleteMany({
    where: { email: { in: [...SEED_EMAILS] } },
  });

  await prisma.user.createMany({
    data: [
      {
        email: "admin@edutania.com",
        passwordHash: adminHash,
        name: "Alex Rivera",
        role: Role.ADMIN,
        isApproved: true,
        bio: "Platform administrator.",
      },
      {
        email: "teacher1@edutania.com",
        passwordHash: teacher1Hash,
        name: "Dr. Sarah Chen",
        role: Role.TEACHER,
        isApproved: true,
        bio: "Mathematics educator with 12 years of classroom experience.",
      },
      {
        email: "teacher2@edutania.com",
        passwordHash: teacher2Hash,
        name: "James Okonkwo",
        role: Role.TEACHER,
        isApproved: true,
        bio: "Science and literature specialist; former curriculum lead.",
      },
      {
        email: "student1@edutania.com",
        passwordHash: student1Hash,
        name: "Maya Patel",
        role: Role.STUDENT,
        isApproved: false,
      },
      {
        email: "student2@edutania.com",
        passwordHash: student2Hash,
        name: "Jordan Lee",
        role: Role.STUDENT,
        isApproved: false,
      },
    ],
  });

  const users = await prisma.user.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
  });
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u])) as Record<
    (typeof SEED_EMAILS)[number],
    (typeof users)[number]
  >;

  const teacher1 = userByEmail["teacher1@edutania.com"];
  const teacher2 = userByEmail["teacher2@edutania.com"];
  const student1 = userByEmail["student1@edutania.com"];

  await prisma.course.createMany({
    data: [
      {
        teacherId: teacher1.id,
        title: "Algebra I: Expressions, Equations, and Linear Models",
        description:
          "Build a strong foundation in symbolic reasoning: simplifying expressions, solving linear equations, and graphing relationships. Includes problem sets aligned to Grade 9 standards and short diagnostic checks each week.",
        gradeLevel: "9",
        subject: "Mathematics",
        price: new Prisma.Decimal("39.99"),
        status: CourseStatus.PUBLISHED,
      },
      {
        teacherId: teacher1.id,
        title: "World History: Ancient Civilizations to Empires",
        description:
          "Survey Mesopotamia, Egypt, Greece, Rome, and early Asian states through primary sources and guided discussions. Students practice historical thinking skills: causation, comparison, and continuity over time.",
        gradeLevel: "10",
        subject: "Social Studies",
        price: new Prisma.Decimal("44.50"),
        status: CourseStatus.PUBLISHED,
      },
      {
        teacherId: teacher2.id,
        title: "Biology: Cells, Genetics, and Heredity",
        description:
          "Hands-on style course covering cell structure, metabolism, DNA, and Mendelian genetics with lab-style prompts and data interpretation. Ideal for students preparing for honors biology or AP prep.",
        gradeLevel: "11",
        subject: "Science",
        price: new Prisma.Decimal("49.99"),
        status: CourseStatus.PUBLISHED,
      },
      {
        teacherId: teacher2.id,
        title: "English Literature: Shakespeare, Poetry, and Close Reading",
        description:
          "Read selected sonnets, a Shakespeare play, and contemporary responses. Focus on theme, imagery, and evidence-based essays. Includes peer workshop milestones and a capstone analytical paper.",
        gradeLevel: "12",
        subject: "English Language Arts",
        price: new Prisma.Decimal("42.00"),
        status: CourseStatus.PUBLISHED,
      },
    ],
  });

  const courses = await prisma.course.findMany({
    where: { teacherId: { in: [teacher1.id, teacher2.id] } },
    orderBy: { createdAt: "asc" },
  });

  if (courses.length !== 4) {
    throw new Error(`Expected 4 seeded courses, found ${courses.length}`);
  }

  const now = new Date();
  const inDays = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const lectureRows: Prisma.LectureCreateManyInput[] = [];

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    lectureRows.push(
      {
        courseId: c.id,
        title: "Live: Introduction & syllabus walkthrough",
        description: "Kickoff session, expectations, and how to use the platform.",
        type: LectureType.LIVE,
        status: LectureStatus.SCHEDULED,
        scheduledAt: inDays(3 + i),
        sortOrder: 0,
      },
      {
        courseId: c.id,
        title: "Live: Core concepts Q&A",
        description: "Interactive review; bring questions from the week's practice.",
        type: LectureType.LIVE,
        status: LectureStatus.SCHEDULED,
        scheduledAt: inDays(10 + i),
        sortOrder: 1,
      },
      {
        courseId: c.id,
        title: "Recorded: Deep-dive lecture (module 1)",
        description: "Pre-recorded walkthrough with worked examples and checkpoints.",
        type: LectureType.RECORDED,
        status: LectureStatus.COMPLETED,
        duration: 42 + i * 5,
        recordingUrl: `/storage/recordings/seed-${c.id.slice(0, 8)}-m1.mp4`,
        sortOrder: 2,
      },
      {
        courseId: c.id,
        title: "Recorded: Practice review session",
        description: "Solutions and common mistakes from the problem bank.",
        type: LectureType.RECORDED,
        status: LectureStatus.COMPLETED,
        duration: 28,
        recordingUrl: `/storage/recordings/seed-${c.id.slice(0, 8)}-review.mp4`,
        sortOrder: 3,
      }
    );
  }

  await prisma.lecture.createMany({ data: lectureRows });

  await prisma.teacherEarning.createMany({
    data: [
      {
        teacherId: teacher1.id,
        totalEarned: new Prisma.Decimal("12840.55"),
        pendingBalance: new Prisma.Decimal("620.00"),
        paidOut: new Prisma.Decimal("11200.00"),
        lastPayoutDate: inDays(-14),
      },
      {
        teacherId: teacher2.id,
        totalEarned: new Prisma.Decimal("9560.20"),
        pendingBalance: new Prisma.Decimal("890.50"),
        paidOut: new Prisma.Decimal("8200.00"),
        lastPayoutDate: inDays(-7),
      },
    ],
  });

  await prisma.enrollment.createMany({
    data: [
      {
        studentId: student1.id,
        courseId: courses[0].id,
        paymentStatus: PaymentStatus.COMPLETED,
        progress: { completedLectures: 1, percentComplete: 15 },
      },
      {
        studentId: student1.id,
        courseId: courses[1].id,
        paymentStatus: PaymentStatus.COMPLETED,
        progress: { completedLectures: 0, percentComplete: 5 },
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log("Users:", SEED_EMAILS.join(", "));
  console.log("Courses:", courses.map((c) => c.title).join(" | "));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
