SELECT b.bookingID, b.sessionDate, s.subjectName, u.fullName AS tutorName,
       r.reviewID, r.rating, r.comment
FROM BOOKING b
JOIN USER u ON u.userID = b.tutorID
JOIN SUBJECT s ON s.subjectID = b.subjectID
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
WHERE b.studentID = ? AND b.status = 'COMPLETED'
ORDER BY b.sessionDate DESC;
