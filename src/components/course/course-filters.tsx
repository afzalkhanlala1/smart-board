"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/utils";

export function CourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentSubject = searchParams.get("subject") || "";
  const currentGrade = searchParams.get("grade") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  const updateFilter = (updates: Record<string, string>) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString(updates)}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    currentSearch || currentSubject || currentGrade || currentMinPrice || currentMaxPrice;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          defaultValue={currentSearch}
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value;
            if (value.length === 0 || value.length >= 2) {
              updateFilter({ search: value });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilter({ search: (e.target as HTMLInputElement).value });
            }
          }}
        />
      </div>

      {/* Sort - visible on mobile */}
      <div className="lg:hidden">
        <Label className="text-sm font-medium mb-2 block">Sort By</Label>
        <Select
          value={currentSort}
          onValueChange={(value) => updateFilter({ sort: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div>
          <Label className="text-sm mb-2 block">Subject</Label>
          <Select
            value={currentSubject || "__all__"}
            onValueChange={(value) =>
              updateFilter({ subject: value === "__all__" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Subjects</SelectItem>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Grade Level</Label>
          <Select
            value={currentGrade || "__all__"}
            onValueChange={(value) =>
              updateFilter({ grade: value === "__all__" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Grades</SelectItem>
              {GRADE_LEVELS.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Price Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              min={0}
              defaultValue={currentMinPrice}
              className="w-full"
              onBlur={(e) => updateFilter({ minPrice: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilter({ minPrice: (e.target as HTMLInputElement).value });
                }
              }}
            />
            <span className="text-muted-foreground text-sm">-</span>
            <Input
              type="number"
              placeholder="Max"
              min={0}
              defaultValue={currentMaxPrice}
              className="w-full"
              onBlur={(e) => updateFilter({ maxPrice: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilter({ maxPrice: (e.target as HTMLInputElement).value });
                }
              }}
            />
          </div>
        </div>
      </div>

      {isPending && (
        <div className="text-xs text-muted-foreground text-center">
          Updating results...
        </div>
      )}
    </div>
  );
}

export function CourseSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentSort} onValueChange={updateSort}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="oldest">Oldest</SelectItem>
        <SelectItem value="price-low">Price: Low to High</SelectItem>
        <SelectItem value="price-high">Price: High to Low</SelectItem>
        <SelectItem value="title">Title A-Z</SelectItem>
      </SelectContent>
    </Select>
  );
}
