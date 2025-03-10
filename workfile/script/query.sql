SELECT g.gid_1, g.name_1, ST_AsGeoJSON(g.`SHAPE`) AS `geometry`, a.tot
FROM gadm1 g
JOIN (
  SELECT af.gid_1, COUNT(*) AS tot
  FROM artifact_findplace af
  JOIN artifact a ON af.artifact = a.id
  WHERE a.category_class = 31
  GROUP BY af.gid_1
) a ON g.gid_1 = a.gid_1;