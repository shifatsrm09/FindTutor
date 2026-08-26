SELECT s.subjectName, COUNT(b.bookingID) AS completedSessions,
       COALESCE(SUM(b.agreedRate), 0) AS earnings
FROM BOOKING b
JOIN SUBJECT s ON s.subjectID = b.subjectID
WHERE b.tutorID = ? AND b.status = 'COMPLETED'
GROUP BY s.subjectID, s.subjectName
ORDER BY earnings DESC;
