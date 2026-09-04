SELECT
    s.subjectID,
    s.subjectName,
    s.category,
    IFNULL(ts.tutorOfferingCount, 0) AS tutorOfferingCount,
    IFNULL(ts.availableTutorCount, 0) AS availableTutorCount,
    IFNULL(ts.onlineTutorCount, 0) AS onlineTutorCount,
    IFNULL(ts.offlineTutorCount, 0) AS offlineTutorCount,
    ts.minimumRate,
    ts.averageRate,
    ts.maximumRate,
    IFNULL(bs.totalBookings, 0) AS totalBookings,
    IFNULL(bs.completedSessions, 0) AS completedSessions,
    IFNULL(bs.reviewCount, 0) AS reviewCount,
    IFNULL(bs.averageRating, 0) AS averageRating,
    bs.lastBookedOn,
    IFNULL(ds.openTutorRequests, 0) AS openTutorRequests,
    ROUND(
        IFNULL(ds.openTutorRequests, 0) /
        NULLIF(IFNULL(ts.tutorOfferingCount, 0), 0),
        2
    ) AS demandPerTutor
FROM SUBJECT s
LEFT JOIN (
    SELECT
        te.subjectID,
        COUNT(DISTINCT t.userID) AS tutorOfferingCount,
        COUNT(DISTINCT CASE WHEN a.tutorID IS NOT NULL THEN t.userID END) AS availableTutorCount,
        COUNT(DISTINCT CASE WHEN t.teachingMode IN ('ONLINE', 'BOTH') THEN t.userID END) AS onlineTutorCount,
        COUNT(DISTINCT CASE WHEN t.teachingMode IN ('OFFLINE', 'BOTH') THEN t.userID END) AS offlineTutorCount,
        MIN(te.hourlyRate) AS minimumRate,
        ROUND(AVG(te.hourlyRate), 2) AS averageRate,
        MAX(te.hourlyRate) AS maximumRate
    FROM TEACHES te
    JOIN TUTOR t ON t.userID = te.tutorID
    JOIN USER u ON u.userID = t.userID AND u.isBanned = FALSE
    LEFT JOIN (
        SELECT DISTINCT tutorID
        FROM AVAILABILITY
    ) a ON a.tutorID = t.userID
    GROUP BY te.subjectID
) ts ON ts.subjectID = s.subjectID
LEFT JOIN (
    SELECT
        b.subjectID,
        COUNT(DISTINCT b.bookingID) AS totalBookings,
        COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.bookingID END) AS completedSessions,
        COUNT(DISTINCT r.reviewID) AS reviewCount,
        ROUND(AVG(r.rating), 2) AS averageRating,
        MAX(b.sessionDate) AS lastBookedOn
    FROM BOOKING b
    LEFT JOIN REVIEW r ON r.bookingID = b.bookingID
    GROUP BY b.subjectID
) bs ON bs.subjectID = s.subjectID
LEFT JOIN (
    SELECT
        tr.subjectID,
        COUNT(*) AS openTutorRequests
    FROM TUTOR_REQUEST tr
    WHERE tr.status = 'OPEN'
    GROUP BY tr.subjectID
) ds ON ds.subjectID = s.subjectID
WHERE (? IS NULL OR s.category = ?)
  AND (
      ? IS NULL
      OR s.subjectName LIKE CONCAT('%', ?, '%')
      OR s.category LIKE CONCAT('%', ?, '%')
  )
HAVING (
           ? IS NULL
           OR (? = 'ONLINE' AND onlineTutorCount > 0)
           OR (? = 'OFFLINE' AND offlineTutorCount > 0)
       )
   AND (? IS NULL OR averageRating >= ?)
   AND (? IS NULL OR tutorOfferingCount >= ?)
   AND (? IS NULL OR minimumRate <= ?)
