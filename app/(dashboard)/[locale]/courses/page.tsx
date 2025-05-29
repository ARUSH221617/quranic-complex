import {
  getStudentCourses,
  StudentCourseInfo,
} from "@/app/actions/getStudentCourses";
import { getStudentDetails } from "@/app/actions/getStudentDetails";

const CoursesPage = async () => {
  const student = await getStudentDetails();
  const userId = student?.id;

  let courses: StudentCourseInfo[] = [];
  if (userId) {
    courses = await getStudentCourses(userId);
  }

  // JSX for displaying courses will be added in the next step.
  // For now, just a placeholder or basic structure.
  return (
    <div className="p-4 md:p-6">
      {" "}
      {/* Basic padding */}
      <h1 className="text-2xl font-semibold mb-6">My Courses</h1>
      {userId ? (
        courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white shadow-lg rounded-lg overflow-hidden"
              >
                {course.imageUrl && (
                  <img
                    src={course.imageUrl}
                    alt={`Image for ${course.title}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")} // Basic image error handling
                  />
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                  <p className="text-gray-700 text-sm">{course.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            You are not currently enrolled in any courses.
          </p>
        )
      ) : (
        <p className="text-center text-red-500">
          Could not identify student. Please ensure you are logged in.
        </p>
      )}
    </div>
  );
};

export default CoursesPage;
