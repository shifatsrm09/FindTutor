SELECT
    r.reviewID,
    r.rating,
    r.comment,
    r.createdAt,
    u.fullName AS studentName,
    s.subjectName
FROM REVIEW r
JOIN BOOKING b ON b.bookingID = r.bookingID
JOIN USER u ON u.userID = b.studentID
JOIN SUBJECT s ON s.subjectID = b.subjectID
WHERE b.tutorID = ?
ORDER BY r.createdAt DESC;
