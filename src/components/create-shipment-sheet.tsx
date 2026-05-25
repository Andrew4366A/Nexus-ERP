import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const schema = z.object({
  sku: z.string().min(1, "Select a SKU from inventory"),
  destination: z
    .string()
    .trim()
    .min(2, "Destination is required")
    .max(120, "Keep destination under 120 characters"),
  carrier: z
    .string()
    .trim()
    .min(2, "Carrier is required")
    .max(80, "Keep carrier under 80 characters"),
});

export type CreateShipmentFormValues = z.infer<typeof schema>;

export interface SkuOption {
  sku: string;
  label: string;
}

export function CreateShipmentSheet({
  trigger,
  skuOptions,
  onCreate,
}: {
  trigger: ReactNode;
  skuOptions: SkuOption[];
  onCreate: (values: CreateShipmentFormValues) => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateShipmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      destination: "",
      carrier: "",
    },
  });

  const handleSubmit = (values: CreateShipmentFormValues) => {
    onCreate(values);
    toast.success("Shipment created", {
      description: `${values.sku} → ${values.destination}`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border/60 pb-4 text-left">
          <SheetTitle>Create new shipment</SheetTitle>
          <SheetDescription>
            Link inventory to a route. Dispatch assigns a driver from the yard board.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-1 flex-col gap-5 px-1 py-6"
          >
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (from inventory)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select SKU" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skuOptions.map((opt) => (
                        <SelectItem key={opt.sku} value={opt.sku}>
                          <span className="font-mono text-xs">{opt.sku}</span>
                          <span className="text-muted-foreground"> — {opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dallas, TX — Retail Hub 04" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nexus Freight LTL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-auto flex gap-2 border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={cn(
                  "flex-1 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                )}
              >
                Create shipment
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
