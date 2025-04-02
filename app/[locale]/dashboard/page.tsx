import { getServerSession } from "next-auth/next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const session = await getServerSession();
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("enrolledPrograms")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("upcomingLessons")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("notifications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("welcome", { name: session?.user?.name || t("student") })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("welcomeMessage")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
