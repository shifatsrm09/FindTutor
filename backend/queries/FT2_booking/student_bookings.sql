SELECT b.bookingID, b.sessionDate, b.startTime, b.endTime, b.agreedRate, b.teachingMode, b.status,
       s.subjectName, u.fullName AS tutorName, u.email AS tutorEmail
FROM BOOKING b
JOIN USER u ON u.userID = b.tutorID
JOIN SUBJECT s ON s.subjectID = b.subjectID
WHERE b.studentID = ?
ORDER BY b.sessionDate DESC, b.startTime DESC;
