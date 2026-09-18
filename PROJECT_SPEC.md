# Smart Attendance Management System

## 1. Project Goal

A web-based attendance management system for educational institutions.

The application should allow authorized users to manage students, teachers, classes, subjects, attendance records, reports, and academic information.

The system should be responsive, secure, modular, and deployable to Vercel.

---

# 2. User Roles

## Administrator

Can:

* Manage teachers
* Manage students
* Manage classes
* Manage subjects
* View attendance
* Generate reports
* Configure system settings

## Teacher

Can:

* View assigned classes
* View students
* Take attendance
* Edit attendance where authorized
* View attendance history
* View attendance statistics
* Generate relevant reports

## Student

Can:

* View personal attendance
* View attendance history
* View subject-wise attendance
* View attendance percentage

---

# 3. Core Modules

1. Authentication
2. Dashboard
3. Student Management
4. Teacher Management
5. Class Management
6. Subject Management
7. Attendance Management
8. Attendance History
9. Reports
10. Notifications
11. User Profile
12. Settings
13. Audit Logs

---

# 4. Attendance

Attendance should support:

* Present
* Absent
* Late
* Excused

Attendance records should contain appropriate references to:

* Student
* Class
* Subject
* Teacher
* Date
* Time/session where applicable
* Attendance status

---

# 5. Important Requirements

The application must:

* Authenticate users
* Authorize users according to their role
* Prevent unauthorized access to other users' data
* Validate data
* Handle errors
* Provide loading states
* Provide empty states
* Work on mobile and desktop
* Use responsive UI
* Store secrets only in environment variables
* Use a real database
* Maintain database integrity
* Provide useful attendance statistics

---

# 6. Future/Advanced Features

These should NOT be implemented until the core system is stable:

* QR-code attendance
* Geolocation verification
* Face recognition
* Attendance anomaly detection
* Automated notifications
* AI-based attendance insights
* Export to PDF
* Export to Excel
* Advanced analytics

---

# 7. Development Rule

Features must be implemented incrementally.

No major feature should be implemented without first inspecting the existing architecture.

The AI developer must not invent requirements.

If a requirement is ambiguous, ask before implementation.
