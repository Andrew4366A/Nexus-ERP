import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In - Nexus ERP" },
      { name: "description", content: "Sign in to Nexus ERP." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .trim()
    .min(1, "Username or email is required")
    .refine(
      (value) => {
        if (value.includes("@")) {
          return z.string().email().safeParse(value).success;
        }

        return value.length >= 3;
      },
      { message: "Enter a valid email address or username" },
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setFormError(null);
    try {
      await login({
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
      });
      router.navigate({ to: "/" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10 font-['Inter',system-ui,sans-serif]">
      <section className="w-full max-w-md rounded-[12px] border border-slate-200/70 bg-white p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            N
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Access your Nexus ERP workspace.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(handleLogin)}>
          <div className="space-y-2">
            <Label htmlFor="usernameOrEmail" className="text-slate-700">
              Username or Email
            </Label>
            <Input
              id="usernameOrEmail"
              autoComplete="username"
              placeholder="name@company.com"
              className="h-11 bg-white"
              aria-invalid={Boolean(errors.usernameOrEmail)}
              {...register("usernameOrEmail")}
            />
            {errors.usernameOrEmail && (
              <p className="text-xs font-medium text-destructive">
                {errors.usernameOrEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 bg-white pr-11"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-900"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="cursor-pointer text-sm text-slate-600">
                    Remember me
                  </Label>
                </div>
              )}
            />
            <Link to="/" className="text-sm font-medium text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="h-11 w-full bg-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          {formError && (
            <p className="text-center text-sm font-medium text-destructive">{formError}</p>
          )}
        </form>
      </section>
    </main>
  );
}
