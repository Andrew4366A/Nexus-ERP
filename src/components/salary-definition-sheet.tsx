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
import { StepBody, StepIndicator } from "@/components/multi-step-sheet";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(80, "Title must be under 80 characters"),
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

export type SalaryDefinitionFormValues = Pick<
  FormValues,
  "title" | "level" | "basic" | "allowance" | "deductions"
>;

const STEPS = ["Role", "Compensation"];
const STEP_FIELDS: (keyof FormValues)[][] = [
  ["title", "level"],
  ["basic", "allowance", "deductions"],
];

export function SalaryDefinitionSheet({
  trigger,
  onDefinitionCreated,
}: {
  trigger: ReactNode;
  onDefinitionCreated?: (values: SalaryDefinitionFormValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      level: undefined as unknown as FormValues["level"],
      basic: undefined as unknown as number,
      allowance: 0,
      deductions: 0,
    },
  });

  const reset = () => {
    setStep(0);
    form.reset();
  };

  const handleNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = (values: FormValues) => {
    onDefinitionCreated?.({
      title: values.title,
      level: values.level,
      basic: values.basic,
      allowance: values.allowance,
      deductions: values.deductions,
    });
    toast.success("Salary definition created", {
      description: `${values.title} (${values.level})`,
    });
    setOpen(false);
    reset();
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
          <SheetTitle>Create salary definition</SheetTitle>
          <SheetDescription>
            Define a new role with its compensation structure.
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
                          <Input type="number" step="0.01" min={0} {...field} />
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
                          <Input type="number" step="0.01" min={0} {...field} />
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
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Create definition
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
