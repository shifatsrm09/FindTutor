SELECT bookingID
FROM BOOKING
WHERE tutorID = ?
  AND sessionDate = ?
  AND status IN ('PENDING', 'CONFIRMED')
  AND startTime < ?
  AND endTime > ?;
