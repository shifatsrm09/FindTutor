UPDATE BOOKING
SET status = ?
WHERE bookingID = ?
  AND tutorID = ?
  AND status IN ('PENDING', 'CONFIRMED');
