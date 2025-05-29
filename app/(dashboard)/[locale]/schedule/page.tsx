"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // For month, week, day views
import interactionPlugin from "@fullcalendar/interaction"; // For date clicking, event dragging, etc. (optional for display only)

// Import FullCalendar's core and theme CSS
// import "@fullcalendar/common/main.css"; // Using common instead of core
// import "@fullcalendar/daygrid/main.css";
import { getStudentDetails } from "@/app/actions/getStudentDetails";
import { getUpcomingLessons } from "@/app/actions/getUpcomingLessons";
// You might need a theme CSS as well, e.g., '@fullcalendar/bootstrap5/main.css' if using Bootstrap
// or create custom styling. For now, just basic daygrid styles.

interface CalendarEvent {
  title: string;
  start: Date;
  allDay: boolean;
  // extendedProps can hold original lesson data if needed
  extendedProps?: {
    courseName: string;
    topic: string;
    time: string;
  };
}

const SchedulePage = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
          const lessons = await getUpcomingLessons(studentDetails.id);

          const formattedEvents: CalendarEvent[] = lessons.map((lesson) => ({
            title: `${lesson.topic} (${lesson.courseName})`,
            start: new Date(lesson.date), // Ensure lesson.date is a valid date string or Date object
            allDay: true, // Assuming lessons are 'allDay' events for simplicity on month view
            // If time is important for 'start' and 'end', this needs more complex parsing.
            extendedProps: {
              courseName: lesson.courseName,
              topic: lesson.topic,
              time: lesson.time,
            },
          }));
          setEvents(formattedEvents);
        } else {
          setError(
            "Could not identify student. Please ensure you are logged in."
          );
        }
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        setError("Failed to load schedule. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-4 md:p-6 text-center">Loading schedule...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-6">My Schedule</h1>
      <div className="bg-white shadow-lg rounded-lg p-4">
        {events.length > 0 ? (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek", // Added week view
            }}
            height="auto" // Adjust height as needed
            // You can add more FullCalendar options here:
            // eventClick={(info) => {
            //   alert('Event: ' + info.event.title + '\nTime: ' + info.event.extendedProps?.time);
            // }}
          />
        ) : (
          <p className="text-center text-gray-500 py-10">
            You have no upcoming lessons in your schedule.
          </p>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
