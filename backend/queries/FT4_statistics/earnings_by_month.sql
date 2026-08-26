SELECT DATE_FORMAT(sessionDate, '%Y-%m') AS month,
       COUNT(bookingID) AS completedSessions,
       COALESCE(SUM(agreedRate), 0) AS earnings
FROM BOOKING
WHERE tutorID = ? AND status = 'COMPLETED'
GROUP BY DATE_FORMAT(sessionDate, '%Y-%m')
ORDER BY month DESC;
