import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/logistics")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Logistics module — coming soon
    </div>
  ),
});
