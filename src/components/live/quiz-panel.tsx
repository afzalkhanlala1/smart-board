"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  ClipboardList,
  Plus,
  Play,
  Square,
  BarChart3,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  correctAnswer?: string | null;
  sortOrder: number;
}

interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "ENDED";
  questions: QuizQuestion[];
  _count?: { responses: number };
}

interface QuizPanelProps {
  lectureId: string;
  liveSessionId: string;
  userId: string;
  isTeacher: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function QuizPanel({
  lectureId,
  liveSessionId,
  userId,
  isTeacher,
}: QuizPanelProps) {
  const room = useRoomContext();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showResultsFor, setShowResultsFor] = useState<string | null>(null);
  const [resultsByQuiz, setResultsByQuiz] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({});
  const [newTitle, setNewTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState<
    Array<{
      question: string;
      type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
      options: string[];
      correctAnswer: string;
    }>
  >([
    {
      question: "",
      type: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
    },
  ]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/livekit/quiz?liveSessionId=${liveSessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
        const active = data.find((q: Quiz) => q.status === "ACTIVE");
        if (active && !isTeacher) {
          setActiveQuiz(active);
        }
      }
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    }
  }, [liveSessionId, isTeacher]);

  useEffect(() => {
    if (liveSessionId) fetchQuizzes();
  }, [liveSessionId, fetchQuizzes]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "quiz-start") {
          if (!isTeacher) {
            setActiveQuiz(data.quiz);
            setAnswers({});
            setSubmitted(false);
            toast.info(`Quiz started: ${data.quiz.title}`);
          }
        }

        if (data.type === "quiz-end") {
          if (!isTeacher) {
            setActiveQuiz(null);
            setSubmitted(false);
          }
          fetchQuizzes();
        }

        if (data.type === "quiz-answer" && isTeacher) {
          setResultsByQuiz((prev) => {
            const quizId = data.quizId as string;
            const qId = data.questionId as string;
            const ans = data.answer as string;
            const updatedQuiz = { ...(prev[quizId] ?? {}) };
            const qMap = { ...(updatedQuiz[qId] ?? {}) };
            qMap[ans] = (qMap[ans] ?? 0) + 1;
            updatedQuiz[qId] = qMap;
            return { ...prev, [quizId]: updatedQuiz };
          });
        }
      } catch {
        // ignore non-JSON
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isTeacher, fetchQuizzes]);

  const createQuiz = useCallback(async () => {
    if (!newTitle.trim() || newQuestions.some((q) => !q.question.trim())) {
      toast.error("Please fill in all question fields");
      return;
    }

    for (let i = 0; i < newQuestions.length; i++) {
      const q = newQuestions[i];
      if (q.type === "MULTIPLE_CHOICE") {
        const validOptions = q.options.filter((o) => o.trim().length > 0);
        if (validOptions.length < 2) {
          toast.error(
            `Question ${i + 1}: multiple choice needs at least 2 options`
          );
          return;
        }
        if (
          q.correctAnswer &&
          !validOptions.includes(q.correctAnswer)
        ) {
          toast.error(
            `Question ${i + 1}: correct answer must match one of the options`
          );
          return;
        }
      }
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/livekit/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveSessionId,
          title: newTitle,
          questions: newQuestions.map((q, i) => ({
            question: q.question,
            type: q.type,
            options: q.type === "TRUE_FALSE" ? ["True", "False"] : q.options.filter(Boolean),
            correctAnswer: q.correctAnswer || undefined,
            sortOrder: i,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create quiz");
      }

      toast.success("Quiz created");
      setShowCreate(false);
      setNewTitle("");
      setNewQuestions([
        { question: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "" },
      ]);
      fetchQuizzes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setIsCreating(false);
    }
  }, [liveSessionId, newTitle, newQuestions, fetchQuizzes]);

  const launchQuiz = useCallback(
    async (quiz: Quiz) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/livekit/quiz", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, status: "ACTIVE" }),
        });

        if (!res.ok) throw new Error("Failed to launch quiz");

        const updated = await res.json();
        setQuizzes((prev) =>
          prev.map((q) => (q.id === quiz.id ? updated : q))
        );

        const payload = encoder.encode(
          JSON.stringify({
            type: "quiz-start",
            quiz: updated,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });
        setResultsByQuiz((prev) => ({ ...prev, [quiz.id]: {} }));
        setShowResultsFor(quiz.id);
        toast.success("Quiz launched");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      } finally {
        setIsLoading(false);
      }
    },
    [room]
  );

  const endQuiz = useCallback(
    async (quiz: Quiz) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/livekit/quiz", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, status: "ENDED" }),
        });

        if (!res.ok) throw new Error("Failed to end quiz");

        const payload = encoder.encode(
          JSON.stringify({ type: "quiz-end", quizId: quiz.id })
        );
        await room.localParticipant.publishData(payload, { reliable: true });

        fetchQuizzes();
        toast.success("Quiz ended");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      } finally {
        setIsLoading(false);
      }
    },
    [room, fetchQuizzes]
  );

  const submitAnswers = useCallback(async () => {
    if (!activeQuiz) return;
    setIsLoading(true);
    try {
      const answerList = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await fetch("/api/livekit/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: activeQuiz.id, answers: answerList }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      for (const ans of answerList) {
        const payload = encoder.encode(
          JSON.stringify({
            type: "quiz-answer",
            quizId: activeQuiz.id,
            questionId: ans.questionId,
            answer: ans.answer,
            userId,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });
      }

      setSubmitted(true);
      toast.success("Answers submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsLoading(false);
    }
  }, [activeQuiz, answers, room, userId]);

  const addQuestion = () => {
    setNewQuestions((prev) => [
      ...prev,
      { question: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (newQuestions.length <= 1) return;
    setNewQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (
    idx: number,
    field: string,
    value: string | string[]
  ) => {
    setNewQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  // Student view (no active quiz)
  if (!isTeacher && !activeQuiz) {
    return (
      <div className="border-b border-white/10">
        <div className="flex items-center gap-2 px-4 py-2">
          <ClipboardList className="h-4 w-4 text-white/40" />
          <span className="text-sm font-medium text-white/60">Quiz</span>
          <span className="ml-auto text-xs text-white/30">
            None active
          </span>
        </div>
      </div>
    );
  }

  // Student active quiz view
  if (!isTeacher && activeQuiz) {
    return (
      <div className="flex flex-col border-b border-white/10 max-h-[50%] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-white/10">
          <ClipboardList className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            {activeQuiz.title}
          </span>
          <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs border-emerald-500/30">
            Live
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Check className="h-8 w-8 text-emerald-400" />
              <p className="text-sm text-white/70">Answers submitted!</p>
              <p className="text-xs text-white/40">Waiting for results...</p>
            </div>
          ) : (
            activeQuiz.questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm text-white/80 font-medium">
                  {i + 1}. {q.question}
                </p>
                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-1">
                    {(q.options as string[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                        }
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                          answers[q.id] === opt
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "TRUE_FALSE" && (
                  <div className="flex gap-2">
                    {["True", "False"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                        }
                        className={cn(
                          "flex-1 rounded-lg px-3 py-2 text-sm transition-colors",
                          answers[q.id] === opt
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "SHORT_ANSWER" && (
                  <input
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                )}
              </div>
            ))
          )}
        </div>
        {!submitted && (
          <div className="px-3 py-2 border-t border-white/10">
            <Button
              onClick={submitAnswers}
              disabled={
                isLoading ||
                Object.keys(answers).length < activeQuiz.questions.length
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Submit Answers
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Teacher quiz management view
  if (isTeacher) {
    return (
      <div className="border-b border-white/10">
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
        >
          <ClipboardList className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white/80">Quizzes</span>
          <Badge className="ml-auto text-xs bg-white/10 text-white/70 border-white/10">
            {quizzes.length}
          </Badge>
          {showCreate ? (
            <ChevronUp className="h-3 w-3 text-white/40" />
          ) : (
            <ChevronDown className="h-3 w-3 text-white/40" />
          )}
        </button>

        {showCreate && (
          <div className="px-3 pb-3 space-y-3 max-h-80 overflow-y-auto">
            {/* Existing quizzes */}
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-lg bg-white/5 px-3 py-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70 font-medium truncate">
                    {quiz.title}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs",
                      quiz.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : quiz.status === "ENDED"
                        ? "bg-white/10 text-white/40 border-white/10"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    )}
                  >
                    {quiz.status}
                  </Badge>
                </div>
                <p className="text-xs text-white/40">
                  {quiz.questions.length} question
                  {quiz.questions.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  {quiz.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => launchQuiz(quiz)}
                      disabled={isLoading}
                      className="text-emerald-400 hover:bg-emerald-500/20 h-7 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Launch
                    </Button>
                  )}
                  {quiz.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => endQuiz(quiz)}
                      disabled={isLoading}
                      className="text-red-400 hover:bg-red-500/20 h-7 text-xs"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      End
                    </Button>
                  )}
                  {(quiz.status === "ACTIVE" || quiz.status === "ENDED") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setShowResultsFor(
                          showResultsFor === quiz.id ? null : quiz.id
                        )
                      }
                      className="text-sky-400 hover:bg-sky-500/20 h-7 text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Results
                    </Button>
                  )}
                </div>

                {showResultsFor === quiz.id && (
                  <div className="mt-2 space-y-2">
                    {quiz.questions.map((q) => {
                      const quizResults = resultsByQuiz[quiz.id] ?? {};
                      const qResults = quizResults[q.id];
                      return (
                        <div key={q.id} className="text-xs">
                          <p className="text-white/60 mb-1">{q.question}</p>
                          {qResults && Object.keys(qResults).length > 0 ? (
                            Object.entries(qResults).map(([ans, count]) => {
                              const total = Object.values(qResults).reduce(
                                (a, b) => a + b,
                                0
                              );
                              return (
                                <div
                                  key={ans}
                                  className="flex items-center gap-2 mb-0.5"
                                >
                                  <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500/40 rounded"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (count / Math.max(1, total)) * 100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-white/50 w-16 truncate">
                                    {ans}
                                  </span>
                                  <span className="text-white/70 font-medium w-6 text-right">
                                    {count}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-white/30">No responses yet</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Create new quiz form */}
            <div className="rounded-lg border border-dashed border-white/20 px-3 py-2 space-y-2">
              <p className="text-xs font-medium text-white/60">New Quiz</p>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Quiz title..."
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
              {newQuestions.map((q, idx) => (
                <div key={idx} className="space-y-1.5 rounded bg-white/5 p-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/40 w-4">{idx + 1}.</span>
                    <input
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(idx, "question", e.target.value)
                      }
                      placeholder="Question..."
                      className="flex-1 rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                    {newQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-red-400/60 hover:text-red-400 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <select
                    value={q.type}
                    onChange={(e) =>
                      updateQuestion(
                        idx,
                        "type",
                        e.target.value as QuizQuestion["type"]
                      )
                    }
                    className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 outline-none"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                  {q.type === "MULTIPLE_CHOICE" &&
                    q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oi] = e.target.value;
                          updateQuestion(idx, "options", newOpts);
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
                      />
                    ))}
                  <input
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(idx, "correctAnswer", e.target.value)
                    }
                    placeholder="Correct answer (optional)"
                    className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-emerald-400/70 placeholder:text-white/20 outline-none focus:border-emerald-500/30"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addQuestion}
                  className="text-white/50 hover:text-white hover:bg-white/10 h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Question
                </Button>
                <Button
                  size="sm"
                  onClick={createQuiz}
                  disabled={isCreating || !newTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs ml-auto"
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
