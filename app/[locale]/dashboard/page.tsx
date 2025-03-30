import { getServerSession } from "next-auth/next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await getServerSession()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{locale === "ar" ? "لوحة التحكم" : "Dashboard"}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{locale === "ar" ? "البرامج المسجلة" : "Enrolled Programs"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{locale === "ar" ? "الدروس القادمة" : "Upcoming Lessons"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{locale === "ar" ? "الإشعارات" : "Notifications"}</CardTitle>
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
              {locale === "ar" ? "مرحباً، " : "Welcome, "}
              {session?.user?.name || (locale === "ar" ? "الطالب" : "Student")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {locale === "ar"
                ? "مرحباً بك في بوابة الطالب الخاصة بمجمع قرآنی خرمشهر. يمكنك من هنا متابعة برامجك ودروسك والاطلاع على تقدمك."
                : "Welcome to the student portal of Khorramshahr Quranic Complex. From here, you can track your programs, lessons, and view your progress."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

