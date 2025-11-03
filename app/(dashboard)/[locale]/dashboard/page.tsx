import { getServerSession } from "next-auth/next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getDashboardData } from "./actions";

export default async function DashboardPage() {
  const session = await getServerSession();
  const t = await getTranslations("dashboard");
  const { enrolledPrograms, upcomingLessons, notifications } =
    await getDashboardData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("enrolledPrograms")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enrolledPrograms}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("upcomingLessons")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingLessons}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("notifications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{notifications}</p>
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
