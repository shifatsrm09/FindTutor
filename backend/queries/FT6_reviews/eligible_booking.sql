SELECT b.bookingID
FROM BOOKING b
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
WHERE b.bookingID = ?
  AND b.studentID = ?
  AND b.status = 'COMPLETED'
  AND r.reviewID IS NULL;
