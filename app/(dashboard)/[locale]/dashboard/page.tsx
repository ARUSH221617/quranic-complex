import { getStudentDetails } from "@/app/actions/getStudentDetails";
import { getStudentCourses } from "@/app/actions/getStudentCourses";
import { getStudentProgress } from "@/app/actions/getStudentProgress";
import { PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DashboardPage = async () => {
  const student = await getStudentDetails();
  const userId = student?.id;
  const studentName = student?.name || "Student";
  const studentImage = student?.image || "/placeholder-user.jpg";

  const [courses, progress] = await Promise.all([
    userId ? getStudentCourses(userId) : [],
    userId ? getStudentProgress(userId) : [],
  ]);

  // Pick the most recently updated progress item (if any)
  const latestProgress = progress && progress.length > 0 ? progress[0] : null;
  const completedCourse = latestProgress?.studentCourseTitle || "-";
  const completedPercent = latestProgress?.completionPercentage || 0;

  // AI Recommendations placeholder (replace with dynamic if available)
  const aiRecommendation = {
    title: "Personalized Study Plan",
    description:
      "Based on your learning history, we recommend focusing on Surah Al-Imran and reviewing Tajweed rules for further mastery.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCACpN7Oy35ZDRi6rP_4EMlvDKWJr20NComwXI1k8bNOkxwbvbWNAHAgFFJgaxKEp-REbP1ANLaQKaS2OHFh131XMwMq_B_8s5UgNKiJQzPgD4AgSDLoeAbCZ5XBvpFt-4d3fuGM1hl6dZr-gS-A4USSqf1rR03e5iivBmWZb71HNSMcA-fYE8KSX7I0Loi_Zvzf3M_1uUAl1qls_3lC4AZOLB09UzMVyz0ketIx4H9AZbpeJD0Vlx1WQ4hiKRhW4hlQWRn5agn648",
  };

  return (
    <main className="flex flex-1 justify-center py-8">
      <div className="layout-content-container flex flex-col max-w-screen-xl flex-1 gap-8">
        <div className="flex flex-wrap justify-between items-center gap-4 p-4">
          <p
            className="text-slate-800 tracking-tight text-4xl font-bold leading-tight"
            style={{ fontFamily: "Noto Serif, serif" }}
          >
            Assalamu Alaikum, {studentName}
          </p>
        </div>
        {/* Quick Access */}
        <section>
          <h2
            className="text-slate-700 text-2xl font-bold leading-tight tracking-tight px-4 pb-4 pt-2"
            style={{ fontFamily: "Noto Serif, serif" }}
          >
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
            {courses && courses.length > 0 ? (
              courses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 rounded-xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div
                    className="w-full h-48 bg-center bg-no-repeat bg-cover"
                    style={{
                      backgroundImage: `url('${
                        course.imageUrl || "/placeholder.svg"
                      }')`,
                    }}
                  ></div>
                  <div className="p-4">
                    <h3 className="text-slate-800 text-lg font-semibold leading-normal">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-normal leading-normal">
                      {course.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center col-span-full py-12 px-4 gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50">
                <div className="flex flex-col items-center gap-2 text-center">
                  <PlusCircle className="w-12 h-12 text-slate-400" />
                  <p className="text-slate-600 font-medium">
                    No courses enrolled yet
                  </p>
                  <p className="text-slate-500 text-sm">
                    Start your learning journey today
                  </p>
                </div>
                <Button variant="primary" className="mt-2">
                  Explore Available Courses
                </Button>
              </div>
            )}
            {courses && courses.length > 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50 text-slate-500 hover:border-[#0c77f2] hover:text-[#0c77f2] transition-colors duration-300 cursor-pointer aspect-square md:aspect-auto min-h-48">
                <PlusCircle className="w-10 h-10" />
                <p className="text-sm font-medium">Explore More Courses</p>
              </div>
            )}
          </div>
        </section>
        {/* Recent Progress */}
        <section>
          <h2
            className="text-slate-700 text-2xl font-bold leading-tight tracking-tight px-4 pb-4 pt-2"
            style={{ fontFamily: "Noto Serif, serif" }}
          >
            Recent Progress
          </h2>
          <div className="p-4">
            {progress && progress.length > 0 ? (
              progress.slice(0, 1).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row items-stretch justify-between gap-6 rounded-xl bg-white shadow-lg overflow-hidden p-6"
                >
                  <div className="flex flex-col gap-2 flex-[2_2_0px] justify-center">
                    <p className="text-sm font-medium leading-normal text-[#0c77f2]">
                      Completed
                    </p>
                    <h3
                      className="text-slate-800 text-xl font-bold leading-tight"
                      style={{ fontFamily: "Noto Serif, serif" }}
                    >
                      {item.studentCourseTitle}
                    </h3>
                    <p className="text-slate-500 text-sm font-normal leading-normal">
                      {item.completionPercentage === 100
                        ? "You've successfully completed this course. Masha'Allah! Keep up the great work!"
                        : item.completionPercentage > 0
                        ? `You're ${item.completionPercentage}% done. Keep going!`
                        : "No progress yet. Start learning today!"}
                    </p>
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-[#0c77f2] h-2.5 rounded-full"
                          style={{ width: `${item.completionPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.completionPercentage}% Completed
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-full md:w-1/3 min-h-48 md:min-h-full bg-center bg-no-repeat aspect-video md:aspect-auto bg-cover rounded-lg"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLYxfQbDZG8gIwfAKhXk_0aTwJ0doh3ze6iHJgCyw5RQRPy8w4nGKwFPaYEeNJvmxwF5uQHf0dPlWsteCu9I3IWk1JAMWROE8KuoU1tPNEO6GYWiCumnOt_TbR0RBnLYPR8KZ0oMvit9LMsUOVjyY8fN5sJnaXsX3NllyX7iQ_5rDm2Fkk5yh-z8WeceGjvJfFX8iKfw2ihkntbz7WNj9bp7ZkKGpVZuHydSOB49qjiefHJfN7LLL-xiZYnwldxL-cL0hvHMGs41E')`,
                    }}
                  ></div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center col-span-full py-12 px-4 gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/50">
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-slate-600 font-medium">No progress yet</p>
                  <p className="text-slate-500 text-sm">
                    Start your learning journey today
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
        {/* AI Recommendations */}
        <section>
          <h2
            className="text-slate-700 text-2xl font-bold leading-tight tracking-tight px-4 pb-4 pt-2"
            style={{ fontFamily: "Noto Serif, serif" }}
          >
            AI Recommendations
          </h2>
          <div className="p-4">
            <div className="group relative flex flex-col md:flex-row items-center justify-between gap-8 rounded-2xl bg-gradient-to-br from-white via-blue-50 to-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden p-8 border border-slate-200">
              {/* Left: Content */}
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                  </span>
                  <h3
                    className="text-slate-800 text-2xl font-bold leading-tight"
                    style={{ fontFamily: "Noto Serif, serif" }}
                  >
                    {aiRecommendation.title}
                  </h3>
                </div>
                <p className="text-slate-600 text-base font-normal leading-relaxed mb-4 max-w-xl">
                  {aiRecommendation.description}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-fit group-hover:bg-blue-600 group-hover:shadow-lg transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Personalized Plan
                </Button>
              </div>
              {/* Right: Image */}
              <div className="flex-1 flex justify-center items-center">
                <div
                  className="w-64 h-40 md:w-80 md:h-48 bg-center bg-no-repeat bg-cover rounded-xl shadow-md border border-slate-100 transform group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: `url('${aiRecommendation.image}')`,
                  }}
                ></div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-30 blur-2xl pointer-events-none" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
