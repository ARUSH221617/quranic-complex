"use client";

import { getStudentDetails } from "@/app/actions/getStudentDetails";
import {
  getStudentProgress,
  StudentCourseProgressInfo,
} from "@/app/actions/getStudentProgress";
import { useState, useEffect } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ProgressPage = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<StudentCourseProgressInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studentDetails = await getStudentDetails();
        if (studentDetails?.id) {
          setStudentId(studentDetails.id);
          const data = await getStudentProgress(studentDetails.id);
          setProgressData(data);
        } else {
          setError(
            "Could not identify student. Please ensure you are logged in."
          );
        }
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError("Failed to load progress data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-4 md:p-6 text-center">Loading progress...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-8">My Progress</h1>

      {progressData.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          No progress data available yet.
        </p>
      )}

      {progressData.map((courseProgress, index) => (
        <div
          key={courseProgress.id}
          className="mb-10 p-6 bg-white shadow-lg rounded-lg"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {courseProgress.studentCourseTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Overall Completion
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    isAnimationActive={true}
                    data={[
                      {
                        name: "Completed",
                        value: courseProgress.completionPercentage,
                      },
                      {
                        name: "Remaining",
                        value: 100 - courseProgress.completionPercentage,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill={COLORS[index % COLORS.length]} // Use a color for completed
                    label={(entry) => `${entry.name} ${entry.value}%`}
                  >
                    <Cell
                      key={`cell-completed`}
                      fill={COLORS[index % COLORS.length]}
                    />
                    <Cell key={`cell-remaining`} fill="#e0e0e0" />{" "}
                    {/* Softer color for remaining */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p
                className="text-center mt-2 text-2xl font-bold"
                style={{ color: COLORS[index % COLORS.length] }}
              >
                {courseProgress.completionPercentage}%
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Completed Items
              </h3>
              {courseProgress.completedItems.filter((item) => item.isCompleted)
                .length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 max-h-60 overflow-y-auto">
                  {courseProgress.completedItems
                    .filter((item) => item.isCompleted)
                    .map((item) => (
                      <li key={item.id}>
                        {item.itemName}
                        {item.grade && (
                          <span className="ml-2 font-semibold text-green-600">
                            ({item.grade})
                          </span>
                        )}
                        {item.completedAt && (
                          <span className="text-xs text-gray-400 ml-1">
                            {" "}
                            - {new Date(item.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No items completed yet for this course.
                </p>
              )}
            </div>
          </div>

          {/* Placeholder for other charts or more detailed lists if needed later */}
          {/* For example, a list of all items and their status */}
          {/* <h3 className="text-lg font-semibold mb-2 text-gray-700">All Items</h3> ... */}
        </div>
      ))}
    </div>
  );
};

export default ProgressPage;
