SELECT b.bookingID, b.sessionDate, b.startTime, b.endTime, b.agreedRate, b.teachingMode, b.status,
       s.subjectName, u.fullName AS studentName, u.email AS studentEmail
FROM BOOKING b
JOIN USER u ON u.userID = b.studentID
JOIN SUBJECT s ON s.subjectID = b.subjectID
WHERE b.tutorID = ?
ORDER BY b.sessionDate DESC, b.startTime DESC;
