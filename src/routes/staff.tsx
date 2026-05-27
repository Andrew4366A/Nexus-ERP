import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Directory — Nexus ERP" },
      { name: "description", content: "Browse staff across teams and departments." },
      { property: "og:title", content: "Staff Directory — Nexus ERP" },
      { property: "og:description", content: "Browse staff across teams and departments." },
    ],
  }),
  component: StaffPage,
});

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  hue: number;
}

const STAFF: Employee[] = [
  {
    id: 1,
    name: "Alex Morgan",
    role: "Operations Lead",
    department: "Operations",
    email: "alex@nexus.co",
    hue: 220,
  },
  {
    id: 2,
    name: "Priya Shah",
    role: "Warehouse Manager",
    department: "Logistics",
    email: "priya@nexus.co",
    hue: 320,
  },
  {
    id: 3,
    name: "Marcus Chen",
    role: "Logistics Analyst",
    department: "Logistics",
    email: "marcus@nexus.co",
    hue: 200,
  },
  {
    id: 4,
    name: "Sofia Rossi",
    role: "Inventory Officer",
    department: "Inventory",
    email: "sofia@nexus.co",
    hue: 12,
  },
  {
    id: 5,
    name: "James O'Connor",
    role: "Procurement Specialist",
    department: "Procurement",
    email: "james@nexus.co",
    hue: 160,
  },
  {
    id: 6,
    name: "Aisha Bello",
    role: "Fleet Coordinator",
    department: "Logistics",
    email: "aisha@nexus.co",
    hue: 48,
  },
  {
    id: 7,
    name: "Daniel Park",
    role: "HR Business Partner",
    department: "People",
    email: "daniel@nexus.co",
    hue: 270,
  },
  {
    id: 8,
    name: "Hannah Weiss",
    role: "Finance Controller",
    department: "Finance",
    email: "hannah@nexus.co",
    hue: 28,
  },
  {
    id: 9,
    name: "Liam Patel",
    role: "Systems Engineer",
    department: "IT",
    email: "liam@nexus.co",
    hue: 240,
  },
  {
    id: 10,
    name: "Mei Tanaka",
    role: "Quality Analyst",
    department: "Operations",
    email: "mei@nexus.co",
    hue: 340,
  },
  {
    id: 11,
    name: "Noah Fischer",
    role: "Compliance Officer",
    department: "Finance",
    email: "noah@nexus.co",
    hue: 180,
  },
  {
    id: 12,
    name: "Zara Khan",
    role: "Recruiter",
    department: "People",
    email: "zara@nexus.co",
    hue: 290,
  },
];

function StaffPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STAFF;
    return STAFF.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff directory</h1>
          <p className="text-sm text-muted-foreground">
            {STAFF.length} people across {new Set(STAFF.map((s) => s.department)).size} departments.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, department..."
            className="pl-9"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)] border-border/60">
          <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
          No staff match your search.
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((person) => {
            const initials = person.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("");
            return (
              <Card
                key={person.id}
                className="flex flex-col items-center gap-3 p-6 text-center shadow-[var(--shadow-card)] border-border/60 transition-shadow hover:shadow-md"
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-semibold text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.74 0.14 ${person.hue}), oklch(0.55 0.18 ${person.hue}))`,
                  }}
                  aria-hidden
                >
                  {initials}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold">{person.name}</h3>
                  <p className="text-xs text-muted-foreground">{person.role}</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {person.department}
                </span>
                <a
                  href={`mailto:${person.email}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3 w-3" />
                  {person.email}
                </a>
                <Button variant="outline" size="sm" className="mt-1 w-full">
                  View Profile
                </Button>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
