import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createQuizSchema = z.object({
  liveSessionId: z.string().min(1),
  title: z.string().min(1),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
      options: z.array(z.string()).default([]),
      correctAnswer: z.string().optional(),
      sortOrder: z.number().default(0),
    })
  ).min(1),
});

const submitAnswerSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.answers) {
      const { quizId, answers } = submitAnswerSchema.parse(body);

      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      });

      if (!quiz || quiz.status !== "ACTIVE") {
        return NextResponse.json({ error: "Quiz not available" }, { status: 400 });
      }

      const results = [];
      for (const ans of answers) {
        const question = quiz.questions.find((q) => q.id === ans.questionId);
        if (!question) continue;

        const isCorrect = question.correctAnswer
          ? ans.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
          : null;

        const response = await db.quizResponse.upsert({
          where: {
            questionId_userId: {
              questionId: ans.questionId,
              userId: session.user.id,
            },
          },
          create: {
            quizId,
            questionId: ans.questionId,
            userId: session.user.id,
            answer: ans.answer,
            isCorrect,
          },
          update: {
            answer: ans.answer,
            isCorrect,
          },
        });
        results.push(response);
      }

      return NextResponse.json({ message: "Answers submitted", results });
    }

    const { liveSessionId, title, questions } = createQuizSchema.parse(body);

    const liveSession = await db.liveSession.findUnique({
      where: { id: liveSessionId },
      include: { lecture: { include: { course: true } } },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (
      liveSession.lecture.course.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Only the teacher can create quizzes" }, { status: 403 });
    }

    const quiz = await db.quiz.create({
      data: {
        liveSessionId,
        title,
        questions: {
          create: questions.map((q, i) => ({
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer || null,
            sortOrder: q.sortOrder ?? i,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error in quiz API:", error);
    return NextResponse.json({ error: "Failed to process quiz" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const liveSessionId = searchParams.get("liveSessionId");
    const quizId = searchParams.get("quizId");

    if (quizId) {
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
          responses: true,
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      return NextResponse.json(quiz);
    }

    if (liveSessionId) {
      const quizzes = await db.quiz.findMany({
        where: { liveSessionId },
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(quizzes);
    }

    return NextResponse.json({ error: "Missing liveSessionId or quizId" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, status } = z.object({
      quizId: z.string().min(1),
      status: z.enum(["ACTIVE", "ENDED"]),
    }).parse(body);

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { liveSession: { include: { lecture: { include: { course: true } } } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (
      quiz.liveSession.lecture.course.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Only the teacher can manage quizzes" }, { status: 403 });
    }

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: { status },
      include: {
        questions: { orderBy: { sortOrder: "asc" } },
        responses: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}
