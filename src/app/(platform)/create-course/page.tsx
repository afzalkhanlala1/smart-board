"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Save,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SUBJECTS, GRADE_LEVELS, getStorageUrl } from "@/lib/utils";

interface CourseFormData {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  price: string;
  thumbnail: string | null;
}

const INITIAL_FORM: CourseFormData = {
  title: "",
  description: "",
  subject: "",
  gradeLevel: "",
  price: "0",
  thumbnail: null,
};

export default function CreateCoursePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CreateCoursePage />
    </Suspense>
  );
}

function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const isEditing = !!courseId;

  const [form, setForm] = useState<CourseFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) {
          toast.error("Failed to load course");
          router.push("/teacher/courses");
          return;
        }
        const data = await res.json();
        setForm({
          title: data.title,
          description: data.description,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          price: String(data.price),
          thumbnail: data.thumbnail,
        });
        if (data.thumbnail) {
          setThumbnailPreview(getStorageUrl(data.thumbnail));
        }
      } catch {
        toast.error("Failed to load course");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCourse();
  }, [courseId, router]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};

    if (form.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    if (!form.subject) {
      newErrors.subject = "Please select a subject";
    }
    if (!form.gradeLevel) {
      newErrors.gradeLevel = "Please select a grade level";
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Price must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleThumbnailUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setIsUploading(true);
      try {
        const preview = URL.createObjectURL(file);
        setThumbnailPreview(preview);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "thumbnail");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Upload failed");
        }

        const data = await res.json();
        setForm((prev) => ({ ...prev, thumbnail: data.url }));
        toast.success("Thumbnail uploaded");
      } catch {
        setThumbnailPreview(form.thumbnail ? getStorageUrl(form.thumbnail) : null);
        toast.error("Failed to upload thumbnail");
      } finally {
        setIsUploading(false);
      }
    },
    [form.thumbnail]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDrop: (files) => {
      if (files.length > 0) handleThumbnailUpload(files[0]);
    },
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("Image must be less than 5MB");
      } else {
        toast.error("Invalid file type");
      }
    },
  });

  const removeThumbnail = () => {
    setForm((prev) => ({ ...prev, thumbnail: null }));
    setThumbnailPreview(null);
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        price: parseFloat(form.price),
        status,
        thumbnail: form.thumbnail,
      };

      const url = isEditing ? `/api/courses/${courseId}` : "/api/courses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
        return;
      }

      const course = await res.json();
      toast.success(
        isEditing
          ? "Course updated successfully"
          : status === "PUBLISHED"
            ? "Course published!"
            : "Course saved as draft"
      );
      router.push(`/courses/${course.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const setField = <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {isEditing ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditing
              ? "Update your course details"
              : "Fill in the details to create a new course"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Course Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Introduction to Algebra"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what students will learn in this course..."
              rows={6}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {form.description.length} characters (minimum 10)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label>
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.subject}
                onValueChange={(value) => setField("subject", value)}
              >
                <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>
                Grade Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.gradeLevel}
                onValueChange={(value) => setField("gradeLevel", value)}
              >
                <SelectTrigger className={errors.gradeLevel ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gradeLevel && (
                <p className="text-sm text-destructive">{errors.gradeLevel}</p>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (USD) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className={`pl-7 ${errors.price ? "border-destructive" : ""}`}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Set to 0 for a free course
            </p>
          </div>

          <Separator />

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            {thumbnailPreview ? (
              <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={thumbnailPreview}
                  alt="Course thumbnail"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeThumbnail}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? "Drop the image here"
                      : "Drag & drop an image, or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <Link href="/teacher/courses">
          <Button variant="outline">Cancel</Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit("DRAFT")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Update & Publish" : "Publish Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
