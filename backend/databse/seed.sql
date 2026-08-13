-- ============================================================
-- FIND TUTOR
-- SEED DATA
-- ============================================================

USE find_tutor;


-- ============================================================
-- USER
-- Password for all seeded accounts:
-- password123
--
-- The password values below are bcrypt hashes.
-- ============================================================

INSERT INTO `USER`
    (userID, fullName, email, password, phone)
VALUES
    (
        1,
        'Dewan Sifat Rahman',
        'sifat@student.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000001'
    ),
    (
        2,
        'Anha Sadman',
        'anha@student.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000002'
    ),
    (
        3,
        'Sadman Sadat Shopnil',
        'shopnil@student.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000003'
    ),
    (
        4,
        'Rahim Ahmed',
        'rahim@tutor.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000004'
    ),
    (
        5,
        'Nusrat Jahan',
        'nusrat@tutor.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000005'
    ),
    (
        6,
        'Tanvir Hasan',
        'tanvir@tutor.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000006'
    ),
    (
        7,
        'Farhan Karim',
        'farhan@tutor.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '01700000007'
    );


-- ============================================================
-- STUDENT
-- ============================================================

INSERT INTO STUDENT
    (userID, institution)
VALUES
    (1, 'BRAC University'),
    (2, 'BRAC University'),
    (3, 'BRAC University');


-- ============================================================
-- TUTOR
-- ============================================================

INSERT INTO TUTOR
    (userID, bio, exp_year, teachingMode)
VALUES
    (
        4,
        'CSE tutor specializing in programming, algorithms and data structures.',
        4,
        'ONLINE'
    ),
    (
        5,
        'Experienced mathematics tutor for university students.',
        6,
        'BOTH'
    ),
    (
        6,
        'Physics and electronics tutor with practical teaching experience.',
        5,
        'OFFLINE'
    ),
    (
        7,
        'Programming tutor specializing in Java, Python and databases.',
        3,
        'BOTH'
    );


-- ============================================================
-- SUBJECT
-- ============================================================

INSERT INTO SUBJECT
    (subjectID, subjectName, category)
VALUES
    (1, 'Programming', 'Computer Science'),
    (2, 'Database Systems', 'Computer Science'),
    (3, 'Data Structures', 'Computer Science'),
    (4, 'Mathematics', 'Mathematics'),
    (5, 'Physics', 'Science'),
    (6, 'Digital Logic', 'Computer Engineering'),
    (7, 'Algorithms', 'Computer Science'),
    (8, 'Web Development', 'Computer Science');


-- ============================================================
-- TEACHES
-- ============================================================

INSERT INTO TEACHES
    (tutorID, subjectID, hourlyRate)
VALUES
    -- Rahim
    (4, 1, 500.00),
    (4, 3, 550.00),
    (4, 7, 600.00),

    -- Nusrat
    (5, 4, 450.00),
    (5, 5, 500.00),
    (5, 1, 550.00),

    -- Tanvir
    (6, 5, 500.00),
    (6, 6, 550.00),
    (6, 4, 450.00),

    -- Farhan
    (7, 1, 500.00),
    (7, 2, 600.00),
    (7, 8, 550.00);


-- ============================================================
-- AVAILABILITY
-- ============================================================

INSERT INTO AVAILABILITY
    (availabilityID, dayOfWeek, startTime, endTime, tutorID)
VALUES
    -- Rahim
    (1, 'Monday',    '10:00:00', '12:00:00', 4),
    (2, 'Wednesday', '14:00:00', '17:00:00', 4),
    (3, 'Friday',    '16:00:00', '19:00:00', 4),

    -- Nusrat
    (4, 'Tuesday',   '09:00:00', '12:00:00', 5),
    (5, 'Thursday',  '14:00:00', '17:00:00', 5),
    (6, 'Saturday',  '10:00:00', '13:00:00', 5),

    -- Tanvir
    (7, 'Monday',    '15:00:00', '18:00:00', 6),
    (8, 'Wednesday', '10:00:00', '13:00:00', 6),
    (9, 'Saturday',  '15:00:00', '18:00:00', 6),

    -- Farhan
    (10, 'Tuesday',  '16:00:00', '19:00:00', 7),
    (11, 'Thursday', '10:00:00', '13:00:00', 7),
    (12, 'Sunday',   '14:00:00', '17:00:00', 7);


-- ============================================================
-- TUTOR REQUEST
-- ============================================================

INSERT INTO TUTOR_REQUEST
    (
        requestID,
        budget,
        prefStartTime,
        prefEndTime,
        prefDate,
        teachingMode,
        studentID,
        status,
        subjectID
    )
VALUES
    (
        1,
        600.00,
        '14:00:00',
        '17:00:00',
        '2026-08-20',
        'ONLINE',
        1,
        'OPEN',
        3
    ),
    (
        2,
        500.00,
        '10:00:00',
        '13:00:00',
        '2026-08-21',
        'ONLINE',
        2,
        'OPEN',
        4
    ),
    (
        3,
        550.00,
        '15:00:00',
        '18:00:00',
        '2026-08-22',
        'OFFLINE',
        3,
        'MATCHED',
        6
    ),
    (
        4,
        650.00,
        '16:00:00',
        '19:00:00',
        '2026-08-23',
        'ONLINE',
        1,
        'OPEN',
        2
    );


-- ============================================================
-- BOOKING
-- ============================================================

INSERT INTO BOOKING
    (
        bookingID,
        startTime,
        endTime,
        agreedRate,
        sessionDate,
        teachingMode,
        studentID,
        tutorID,
        subjectID,
        status
    )
VALUES
    (
        1,
        '14:00:00',
        '16:00:00',
        550.00,
        '2026-08-10',
        'ONLINE',
        1,
        4,
        3,
        'COMPLETED'
    ),
    (
        2,
        '10:00:00',
        '12:00:00',
        450.00,
        '2026-08-11',
        'ONLINE',
        2,
        5,
        4,
        'COMPLETED'
    ),
    (
        3,
        '15:00:00',
        '17:00:00',
        550.00,
        '2026-08-12',
        'OFFLINE',
        3,
        6,
        6,
        'COMPLETED'
    ),
    (
        4,
        '16:00:00',
        '18:00:00',
        600.00,
        '2026-08-18',
        'ONLINE',
        1,
        7,
        2,
        'CONFIRMED'
    ),
    (
        5,
        '10:00:00',
        '12:00:00',
        500.00,
        '2026-08-19',
        'ONLINE',
        2,
        4,
        1,
        'CONFIRMED'
    ),
    (
        6,
        '15:00:00',
        '17:00:00',
        500.00,
        '2026-08-25',
        'OFFLINE',
        3,
        5,
        5,
        'PENDING'
    );


-- ============================================================
-- REVIEW
-- ============================================================

INSERT INTO REVIEW
    (
        reviewID,
        bookingID,
        comment,
        rating
    )
VALUES
    (
        1,
        1,
        'Very helpful explanation of data structures.',
        5.0
    ),
    (
        2,
        2,
        'Excellent mathematics tutor.',
        4.5
    ),
    (
        3,
        3,
        'Explained digital logic concepts clearly.',
        5.0
    );


-- ============================================================
-- END OF SEED DATA
-- ============================================================