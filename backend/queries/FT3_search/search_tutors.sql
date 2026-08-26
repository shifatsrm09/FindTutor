SELECT u.userID AS tutorID, u.fullName, u.email, u.location, t.bio, t.exp_year, t.teachingMode,
       GROUP_CONCAT(DISTINCT s.subjectName ORDER BY s.subjectName SEPARATOR ', ') AS subjects,
       GROUP_CONCAT(DISTINCT CONCAT(a.dayOfWeek, ' ', TIME_FORMAT(a.startTime, '%H:%i'), '-', TIME_FORMAT(a.endTime, '%H:%i')) ORDER BY FIELD(a.dayOfWeek, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') SEPARATOR ' | ') AS availability,
       MIN(te.hourlyRate) AS minimumRate,
       ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
       COUNT(DISTINCT r.reviewID) AS reviewCount,
       COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.bookingID END) AS completedSessions
FROM TUTOR t
JOIN USER u ON u.userID = t.userID
JOIN TEACHES te ON te.tutorID = t.userID
JOIN SUBJECT s ON s.subjectID = te.subjectID
LEFT JOIN BOOKING b ON b.tutorID = t.userID
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
LEFT JOIN AVAILABILITY a ON a.tutorID = t.userID
WHERE u.isBanned = FALSE
  AND (? IS NULL OR te.subjectID = ?)
  AND (? IS NULL OR u.location = ?)
  AND (? IS NULL OR t.teachingMode IN (?, 'BOTH'))
  AND (? IS NULL OR te.hourlyRate >= ?)
  AND (? IS NULL OR te.hourlyRate <= ?)
GROUP BY u.userID, u.fullName, u.email, u.location, t.bio, t.exp_year, t.teachingMode
HAVING (? IS NULL OR COALESCE(AVG(r.rating), 0) >= ?)
