SELECT ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
       COUNT(r.reviewID) AS reviewCount
FROM BOOKING b
LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
WHERE b.tutorID = ?;
