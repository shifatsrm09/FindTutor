UPDATE BOOKING
SET status = 'CANCELLED'
WHERE bookingID = ?
  AND studentID = ?
  AND status IN ('PENDING', 'CONFIRMED');
