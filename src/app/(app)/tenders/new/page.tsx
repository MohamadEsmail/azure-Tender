import Link from "next/link";
import { createTender } from "@/lib/actions/tenders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTenderPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">مناقصة جديدة</h1>
        <p className="text-sm text-muted-foreground">
          ارفع مستند المناقصة وأدخل عنوانًا مختصرًا والموعد النهائي للتقديم.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التفاصيل</CardTitle>
          <CardDescription>
            الملفات تُحفظ في تخزين خاص. سيتم فتح شاشة المراجعة بعد الإنشاء.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTender} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المناقصة</Label>
              <Input id="title" name="title" required placeholder="مثال: فعاليات التواجد البلدي" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">الجهة</Label>
              <Input id="client" name="client" placeholder="مثال: بلدية مدينة العين" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">الموعد النهائي للتقديم</Label>
              <Input id="deadline" name="deadline" type="date" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="files">ملفات المناقصة (PDF أو DOCX)</Label>
              <Input
                id="files"
                name="files"
                type="file"
                multiple
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <p className="text-xs text-muted-foreground">الحد الأقصى 50 ميجابايت لكل ملف.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/tenders"
                className="text-sm text-muted-foreground hover:underline"
              >
                إلغاء
              </Link>
              <Button type="submit">إنشاء وبدء المراجعة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
