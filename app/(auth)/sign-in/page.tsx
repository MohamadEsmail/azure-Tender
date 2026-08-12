"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: SignInState = {};

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="container flex min-h-dvh items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>منصة أزور الإبداعية</CardTitle>
          <p className="text-sm text-muted-foreground">
            تسجيل الدخول للحساب الداخلي
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
              />
            </div>

            {state.error ? (
              <p className="text-sm text-[hsl(var(--confidence-red))]">
                {state.error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "جارٍ الدخول…" : "دخول"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            الدخول بدعوة فقط. تواصل مع مدير النظام لإنشاء حساب.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
