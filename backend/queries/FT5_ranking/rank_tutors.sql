SELECT u.userID AS tutorID, u.fullName, u.location, t.exp_year,
       ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
       COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.bookingID END) AS completedSessions,
       COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.agreedRate ELSE 0 END), 0) AS totalEarnings
FROM TUTOR t
JOIN USER u ON u.userID = t.userID
LEFT JOIN BOOKING b ON b.tutorID = t.userID
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
WHERE u.isBanned = FALSE
GROUP BY u.userID, u.fullName, u.location, t.exp_year
ORDER BY averageRating DESC, completedSessions DESC, totalEarnings DESC, t.exp_year DESC;
