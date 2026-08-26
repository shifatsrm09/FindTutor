UPDATE BOOKING
SET startTime = ?, endTime = ?, sessionDate = ?, teachingMode = ?, status = 'PENDING'
WHERE bookingID = ?
  AND studentID = ?
  AND status IN ('PENDING', 'CONFIRMED');
