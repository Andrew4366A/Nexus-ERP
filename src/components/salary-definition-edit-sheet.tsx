import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { StepBody, StepIndicator } from "@/components/multi-step-sheet";
import { API_BASE_URL, useAuth } from "@/lib/auth";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80, "Title must be under 80 characters"),
  level: z.enum(["L1", "L2", "L3", "L4", "L5"], {
    errorMap: () => ({ message: "Select a level" }),
  }),
  basic: z.coerce
    .number({ invalid_type_error: "Salary must be a number" })
    .positive("Basic salary must be greater than 0")
    .max(1_000_000, "Value too large"),
  allowance: z.coerce
    .number({ invalid_type_error: "Allowance must be a number" })
    .min(0, "Allowance cannot be negative")
    .max(1_000_000, "Value too large"),
  deductions: z.coerce
    .number({ invalid_type_error: "Deductions must be a number" })
    .min(0, "Deductions cannot be negative")
    .max(1_000_000, "Value too large"),
});

type FormValues = z.infer<typeof schema>;

export type SalaryDefinitionEditValues = Pick<
  FormValues,
  "title" | "level" | "basic" | "allowance" | "deductions"
>;

const STEPS = ["Role", "Compensation"];
const STEP_FIELDS: (keyof FormValues)[][] = [
  ["title", "level"],
  ["basic", "allowance", "deductions"],
];

export function SalaryDefinitionEditSheet({
  trigger,
  definition,
  method = "patch",
  onUpdated,
}: {
  trigger: ReactNode;
  definition: (SalaryDefinitionEditValues & { id: string }) | null;
  method?: "patch" | "put";
  onUpdated?: (next: SalaryDefinitionEditValues & { id: string }) => void;
}) {
  const { token } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo(() => {
    if (!definition) {
      return {
        title: "",
        level: undefined as unknown as FormValues["level"],
        basic: undefined as unknown as number,
        allowance: 0,
        deductions: 0,
      };
    }

    return {
      title: definition.title,
      level: definition.level,
      basic: definition.basic,
      allowance: definition.allowance,
      deductions: definition.deductions,
    };
  }, [definition]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (!definition) return;
    form.reset({
      title: definition.title,
      level: definition.level,
      basic: definition.basic,
      allowance: definition.allowance,
      deductions: definition.deductions,
    });
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition?.id]);

  const reset = () => {
    setStep(0);
    form.reset(defaultValues);
  };

  const handleNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (values: FormValues) => {
    if (!token || !definition) {
      toast.error("You must be signed in to edit salary definition.");
      return;
    }

    const id = definition.id;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payroll/salary-definitions/${id}`, {
        method: method === "put" ? "PUT" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: values.title,
          level: values.level,
          basic: values.basic,
          allowance: values.allowance,
          deductions: values.deductions,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to update salary definition");
      }

      const updated = payload?.salaryDefinition;
      const next = {
        id,
        title: updated?.title ?? values.title,
        level: updated?.level ?? values.level,
        basic: updated?.basic ?? values.basic,
        allowance: updated?.allowance ?? values.allowance,
        deductions: updated?.deductions ?? values.deductions,
      };

      onUpdated?.(next);
      toast.success("Salary definition updated", { description: `${next.title} (${next.level})` });
      setOpen(false);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update salary definition";
      toast.error(message);
    } finally {
      setSaving(false);
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
          <SheetTitle>Edit salary definition</SheetTitle>
          <SheetDescription>
            Update the salary structure values for this definition.
          </SheetDescription>
          <div className="pt-4">
            <StepIndicator steps={STEPS} current={step} />
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Operations Lead" maxLength={80} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["L1", "L2", "L3", "L4", "L5"].map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    name="basic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basic salary (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            placeholder="5000"
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
                    name="allowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowance (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
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
                    name="deductions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductions (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
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
                disabled={step === 0 || saving}
              >
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext} disabled={saving}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={saving || !definition}>
                  Save changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
