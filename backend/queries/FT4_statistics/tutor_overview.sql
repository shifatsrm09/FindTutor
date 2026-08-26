SELECT
    COUNT(DISTINCT CASE WHEN b.status IN ('PENDING', 'CONFIRMED') THEN b.studentID END) AS currentStudents,
    COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.studentID END) AS completedStudents,
    COUNT(b.bookingID) AS totalSessions,
    COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) AS completedSessions,
    COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.agreedRate ELSE 0 END), 0) AS totalEarnings
FROM BOOKING b
WHERE b.tutorID = ?;
