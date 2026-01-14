SELECT 
  gid_0 as gid, 
  country as name, 
  ST_AsGeoJSON(
    ST_Transform(
      ST_Simplify(
        ST_Transform(SHAPE, 3857), 500
      ), 4326
    )
  ) as geom 
FROM gadm0 WHERE gid_0 = 'DNK';