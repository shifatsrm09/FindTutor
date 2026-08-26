SELECT u.userID AS tutorID, u.fullName, u.location, t.teachingMode, te.hourlyRate,
       ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating
FROM TUTOR_REQUEST tr
JOIN TUTOR t ON 1 = 1
JOIN USER u ON u.userID = t.userID
JOIN TEACHES te ON te.tutorID = t.userID AND te.subjectID = tr.subjectID
LEFT JOIN BOOKING b ON b.tutorID = t.userID
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
WHERE tr.requestID = ?
  AND tr.status = 'OPEN'
  AND u.isBanned = FALSE
  AND (tr.teachingMode = 'BOTH' OR t.teachingMode = 'BOTH' OR tr.teachingMode = t.teachingMode)
  AND (tr.budget IS NULL OR te.hourlyRate <= tr.budget)
GROUP BY u.userID, u.fullName, u.location, t.teachingMode, te.hourlyRate
ORDER BY averageRating DESC, te.hourlyRate ASC;
