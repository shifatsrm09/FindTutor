SELECT bookingID
FROM BOOKING
WHERE tutorID = ?
  AND sessionDate = ?
  AND status IN ('PENDING', 'CONFIRMED')
  AND bookingID <> ?
  AND startTime < ?
  AND endTime > ?;
