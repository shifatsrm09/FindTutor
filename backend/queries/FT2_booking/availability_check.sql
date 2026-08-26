SELECT availabilityID
FROM AVAILABILITY
WHERE tutorID = ?
  AND dayOfWeek = DAYNAME(?)
  AND startTime <= ?
  AND endTime >= ?;
