-- ============================================================
-- FIND TUTOR: COMPLETE DEMO SEED DATA
-- Run admin_mvp_migration.sql first if this is an existing database.
-- All seeded student and tutor passwords are plain text: password123
-- This script clears existing demo data before inserting new records.
-- ============================================================

USE find_tutor;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM COMPLAINT;
DELETE FROM REVIEW;
DELETE FROM BOOKING;
DELETE FROM TUTOR_REQUEST;
DELETE FROM AVAILABILITY;
DELETE FROM TEACHES;
DELETE FROM TUTOR;
DELETE FROM STUDENT;
DELETE FROM SUBJECT;
DELETE FROM USER;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE USER AUTO_INCREMENT = 1;
ALTER TABLE SUBJECT AUTO_INCREMENT = 1;
ALTER TABLE AVAILABILITY AUTO_INCREMENT = 1;
ALTER TABLE TUTOR_REQUEST AUTO_INCREMENT = 1;
ALTER TABLE BOOKING AUTO_INCREMENT = 1;
ALTER TABLE REVIEW AUTO_INCREMENT = 1;
ALTER TABLE COMPLAINT AUTO_INCREMENT = 1;

-- ============================================================
-- USERS: 5 STUDENTS + 5 TUTORS
-- ============================================================

INSERT INTO USER (userID, fullName, email, password, phone, isBanned) VALUES
(1, 'Ayesha Rahman', 'ayesha@student.com', 'password123', '01710000001', FALSE),
(2, 'Nabil Hasan', 'nabil@student.com', 'password123', '01710000002', FALSE),
(3, 'Mim Akter', 'mim@student.com', 'password123', '01710000003', FALSE),
(4, 'Rafi Ahmed', 'rafi@student.com', 'password123', '01710000004', FALSE),
(5, 'Sadia Islam', 'sadia@student.com', 'password123', '01710000005', FALSE),
(6, 'Tanvir Hossain', 'tanvir@tutor.com', 'password123', '01720000001', FALSE),
(7, 'Nusrat Jahan', 'nusrat@tutor.com', 'password123', '01720000002', FALSE),
(8, 'Farhan Karim', 'farhan@tutor.com', 'password123', '01720000003', FALSE),
(9, 'Mahi Chowdhury', 'mahi@tutor.com', 'password123', '01720000004', FALSE),
(10, 'Samiul Kabir', 'samiul@tutor.com', 'password123', '01720000005', FALSE);

INSERT INTO STUDENT (userID, institution) VALUES
(1, 'BRAC University'),
(2, 'North South University'),
(3, 'Independent University Bangladesh'),
(4, 'BRAC University'),
(5, 'East West University');

INSERT INTO TUTOR (userID, bio, exp_year, teachingMode) VALUES
(6, 'Computer science tutor focused on programming and algorithms.', 4, 'BOTH'),
(7, 'Mathematics and physics tutor for university-level courses.', 6, 'ONLINE'),
(8, 'Database and web development tutor with project experience.', 5, 'BOTH'),
(9, 'Digital logic and electronics tutor with practical examples.', 3, 'OFFLINE'),
(10, 'Statistics and Python tutor for beginners and intermediate learners.', 4, 'ONLINE');

-- ============================================================
-- SUBJECTS AND TUTOR SUBJECTS
-- ============================================================

INSERT INTO SUBJECT (subjectID, subjectName, category) VALUES
(1, 'Programming', 'Computer Science'),
(2, 'Database Systems', 'Computer Science'),
(3, 'Data Structures', 'Computer Science'),
(4, 'Algorithms', 'Computer Science'),
(5, 'Mathematics', 'Mathematics'),
(6, 'Physics', 'Science'),
(7, 'Digital Logic Design', 'Computer Engineering'),
(8, 'Web Development', 'Computer Science'),
(9, 'Statistics', 'Mathematics'),
(10, 'Python', 'Computer Science');

INSERT INTO TEACHES (tutorID, subjectID, hourlyRate) VALUES
(6, 1, 600.00), (6, 3, 650.00), (6, 4, 700.00),
(7, 5, 500.00), (7, 6, 550.00), (7, 9, 500.00),
(8, 2, 650.00), (8, 8, 600.00), (8, 10, 550.00),
(9, 6, 500.00), (9, 7, 600.00), (9, 5, 450.00),
(10, 9, 500.00), (10, 10, 550.00), (10, 1, 500.00);

-- ============================================================
-- TUTOR AVAILABILITY
-- ============================================================

INSERT INTO AVAILABILITY (dayOfWeek, startTime, endTime, tutorID) VALUES
('Monday', '10:00:00', '13:00:00', 6), ('Wednesday', '14:00:00', '18:00:00', 6), ('Friday', '15:00:00', '19:00:00', 6),
('Tuesday', '09:00:00', '13:00:00', 7), ('Thursday', '14:00:00', '18:00:00', 7), ('Saturday', '10:00:00', '14:00:00', 7),
('Monday', '15:00:00', '19:00:00', 8), ('Wednesday', '10:00:00', '14:00:00', 8), ('Sunday', '14:00:00', '18:00:00', 8),
('Tuesday', '14:00:00', '18:00:00', 9), ('Thursday', '10:00:00', '13:00:00', 9), ('Saturday', '15:00:00', '19:00:00', 9),
('Monday', '09:00:00', '12:00:00', 10), ('Friday', '14:00:00', '18:00:00', 10), ('Sunday', '10:00:00', '14:00:00', 10);

-- ============================================================
-- STUDENT TUTOR REQUESTS
-- ============================================================

INSERT INTO TUTOR_REQUEST (budget, prefStartTime, prefEndTime, prefDate, teachingMode, studentID, status, subjectID) VALUES
(700.00, '14:00:00', '17:00:00', '2026-09-02', 'ONLINE', 1, 'OPEN', 4),
(550.00, '14:00:00', '16:00:00', '2026-09-03', 'ONLINE', 2, 'OPEN', 5),
(700.00, '15:00:00', '18:00:00', '2026-09-06', 'BOTH', 3, 'MATCHED', 2),
(600.00, '14:00:00', '17:00:00', '2026-09-01', 'OFFLINE', 4, 'OPEN', 7),
(600.00, '10:00:00', '13:00:00', '2026-09-07', 'ONLINE', 5, 'OPEN', 10),
(650.00, '15:00:00', '18:00:00', '2026-09-08', 'BOTH', 1, 'CLOSED', 8);

-- ============================================================
-- BOOKINGS: COMPLETED, CONFIRMED, PENDING AND CANCELLED
-- ============================================================

INSERT INTO BOOKING (startTime, endTime, agreedRate, sessionDate, teachingMode, studentID, tutorID, subjectID, status) VALUES
('10:00:00', '12:00:00', 650.00, '2026-08-03', 'ONLINE', 1, 6, 3, 'COMPLETED'),
('10:00:00', '12:00:00', 500.00, '2026-08-04', 'ONLINE', 2, 7, 5, 'COMPLETED'),
('10:00:00', '12:00:00', 650.00, '2026-08-05', 'BOTH', 3, 8, 2, 'COMPLETED'),
('10:00:00', '12:00:00', 600.00, '2026-08-06', 'OFFLINE', 4, 9, 7, 'COMPLETED'),
('14:00:00', '16:00:00', 550.00, '2026-08-07', 'ONLINE', 5, 10, 10, 'COMPLETED'),
('15:00:00', '17:00:00', 600.00, '2026-08-12', 'ONLINE', 2, 6, 1, 'COMPLETED'),
('14:00:00', '16:00:00', 600.00, '2026-09-02', 'ONLINE', 1, 6, 4, 'CONFIRMED'),
('14:00:00', '16:00:00', 500.00, '2026-09-03', 'ONLINE', 2, 7, 5, 'PENDING'),
('15:00:00', '17:00:00', 650.00, '2026-09-06', 'BOTH', 3, 8, 2, 'CONFIRMED'),
('14:00:00', '16:00:00', 600.00, '2026-09-01', 'OFFLINE', 4, 9, 7, 'PENDING'),
('10:00:00', '12:00:00', 550.00, '2026-09-07', 'ONLINE', 5, 10, 10, 'CANCELLED');

-- ============================================================
-- REVIEWS FOR COMPLETED BOOKINGS
-- ============================================================

INSERT INTO REVIEW (bookingID, comment, rating) VALUES
(1, 'Tanvir explained data structures very clearly.', 5.0),
(2, 'Nusrat was patient and helpful with calculus.', 4.5),
(3, 'Farhan made database normalization easy to understand.', 5.0),
(4, 'Mahi gave useful digital logic practice problems.', 4.0),
(5, 'Samiul helped me understand Python fundamentals.', 4.5),
(6, 'Great programming session with practical examples.', 4.5);

-- ============================================================
-- COMPLAINTS FOR ADMIN DASHBOARD TESTING
-- ============================================================

INSERT INTO COMPLAINT (reporterID, reportedUserID, description, status) VALUES
(1, 9, 'The tutor arrived late for an offline session.', 'OPEN'),
(4, 7, 'The tutor did not respond to my first booking request.', 'OPEN'),
(8, 3, 'The student repeatedly changed the agreed session time.', 'OPEN'),
(5, 6, 'The tutor issue was discussed and resolved.', 'RESOLVED');

-- ============================================================
-- LOGIN EXAMPLES
-- Student: ayesha@student.com / password123
-- Tutor:   tanvir@tutor.com / password123
-- Admin:   admin / admin
-- ============================================================
