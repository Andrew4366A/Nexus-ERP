import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { StepBody, StepIndicator } from "@/components/multi-step-sheet";
import { API_BASE_URL, useAuth } from "@/lib/auth";
import { inventoryListQueryKey } from "@/lib/inventory-query";

const CATEGORIES = ["Electronics", "Furniture", "Lighting", "Accessories", "Stationery"] as const;

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(500).optional(),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  unitPrice: z.coerce.number().positive().max(1_000_000),
});

type FormValues = z.infer<typeof schema>;

export function EditInventorySheet({
  trigger,
  item,
  onItemUpdated,
}: {
  trigger: ReactNode;
  item: {
    id: string;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  };
  onItemUpdated?: (item: { id: string }) => void;
}) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: item.name,
      sku: item.sku,
      category: item.category as (typeof CATEGORIES)[number],
      description: item.description ?? "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    },
  });

  const reset = () => {
    setStep(0);
    form.reset();
  };

  const handleNext = async () => {
    const valid = await form.trigger();
    if (valid) setStep((s) => Math.min(s + 1, 1));
  };

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("You must be signed in to edit inventory.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          sku: values.sku,
          category: values.category,
          description: values.description,
          quantity: values.quantity,
          unitPrice: values.unitPrice,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Could not update inventory item");
      }

      await queryClient.invalidateQueries({ queryKey: inventoryListQueryKey });
      onItemUpdated?.({ id: item.id });
      toast.success("Inventory item updated", {
        description: `${values.name} · ${values.sku}`,
      });
      setOpen(false);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update inventory item";
      toast.error(message);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-6">
          <SheetTitle>Edit inventory</SheetTitle>
          <SheetDescription>Update product details in your stock catalogue.</SheetDescription>
          <div className="pt-4">
            <StepIndicator steps={["Product", "Stock & pricing"]} current={step} />
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6">
              {step === 0 && (
                <StepBody>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Aurora Wireless Headset"
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="AUD-1024"
                            maxLength={32}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short description shown on the product page"
                            maxLength={500}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepBody>
              )}

              {step === 1 && (
                <StepBody>
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity in stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            step="1"
                            min={0}
                            placeholder="100"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit price (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            placeholder="49.99"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepBody>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t bg-muted/30 p-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Update item
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
