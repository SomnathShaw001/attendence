"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherFiltersProps {
  departments: string[];
}

export function TeacherFilters({ departments }: TeacherFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentDept = searchParams.get("department") || "all";
  const currentStatus = searchParams.get("status") || "all";

  const [searchVal, setSearchVal] = useState(currentSearch);

  const applyFilters = (newParams: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, val]) => {
        if (val && val !== "all") {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });
      router.push(`/teachers?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: searchVal });
  };

  const handleReset = () => {
    setSearchVal("");
    startTransition(() => {
      router.push("/teachers");
    });
  };

  const hasActiveFilters =
    currentSearch !== "" || currentDept !== "all" || currentStatus !== "all";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by faculty name, email, employee ID..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-20 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Department */}
        <select
          value={currentDept}
          onChange={(e) => applyFilters({ department: e.target.value })}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={currentStatus}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="deactivated">Deactivated</option>
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
