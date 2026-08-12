"use client";

import { useActionState } from "react";
import { createProjectAction, type NewProjectState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: NewProjectState = {};

export default function NewProjectPage() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>مشروع جديد</CardTitle>
          <p className="text-sm text-muted-foreground">
            عرّف المشروع واختر مساراته. بعد الإنشاء ترفع البريف ليبدأ الاستخراج.
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">اسم المشروع *</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">العميل / الجهة</Label>
                <Input id="client" name="client" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_no">رقم العقد / المرجع</Label>
                <Input id="contract_no" name="contract_no" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type">نوع المشروع</Label>
                <select
                  id="project_type"
                  name="project_type"
                  defaultValue="tender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="tender">مناقصة</option>
                  <option value="pitch">عرض تقديمي</option>
                  <option value="hybrid">مختلط</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">المهلة</Label>
                <Input id="deadline" name="deadline" type="date" dir="ltr" />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">المسارات</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tracks"
                  value="proposal"
                  defaultChecked
                />
                مسار العرض / الامتثال (ملف المناقصة)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tracks"
                  value="creative"
                  defaultChecked
                />
                المسار الإبداعي (المفهوم والتصور والعرض)
              </label>
            </fieldset>

            {state.error ? (
              <p className="text-sm text-[hsl(var(--confidence-red))]">
                {state.error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "جارٍ الإنشاء…" : "إنشاء المشروع"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
