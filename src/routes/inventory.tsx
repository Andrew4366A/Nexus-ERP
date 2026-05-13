import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inventory")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Inventory module — coming soon
    </div>
  ),
});
