-- 250603
-- alter table time_series_macro add column start int, add column end int;
-- alter table time_series_generic add column start int, add column end int;
-- alter table time_series_macro add constraint time_series_macro_start_end_check check (start < end);
-- alter table time_series_generic add constraint time_series_generic_start_end_check check (start < end);

-- start transaction;
-- update time_series_macro set start = -13000, end = -1701 where serie = 2 and macro = 1;
-- update time_series_macro set start = -1700, end = -501 where serie = 2 and macro = 2;
-- update time_series_macro set start = -500, end = 1050 where serie = 2 and macro = 3;
-- update time_series_macro set start = 1051, end = 1521 where serie = 2 and macro = 5;
-- update time_series_macro set start = 1522, end = 1611 where serie = 2 and macro = 6;

-- update time_series_macro set start = -7000, end = -3201 where serie = 5 and macro = 1;
-- update time_series_macro set start = -3200, end = -1051 where serie = 5 and macro = 2;
-- update time_series_macro set start = -1050, end = -681 where serie = 5 and macro = 3;
-- update time_series_macro set start = -680, end = 329 where serie = 5 and macro = 4;
-- update time_series_macro set start = 330, end = 1204 where serie = 5 and macro = 5;

-- update time_series_generic set start = -13000, end = -9501 where id = 1;
-- update time_series_generic set start = -9500,  end = -4001 where id = 2;
-- update time_series_generic set start = -4000,  end = -1701 where id = 3;
-- update time_series_generic set start = -1700,  end = -1101 where id = 4;
-- update time_series_generic set start = -1100,  end = -501  where id = 5;
-- update time_series_generic set start = -500,   end = -1    where id = 6;
-- update time_series_generic set start = 0,      end = 400   where id = 7;
-- update time_series_generic set start = 401,    end = 550   where id = 8;
-- update time_series_generic set start = 551,    end = 800   where id = 9;
-- update time_series_generic set start = 801,    end = 1050  where id = 10;
-- update time_series_generic set start = 1051,   end = 1396  where id = 11;
-- update time_series_generic set start = 1397,   end = 1521  where id = 12;
-- update time_series_generic set start = 1522,   end = 1611  where id = 14;

-- update time_series_generic set start = -7000, end = -3201 where id = 17;
-- update time_series_generic set start = -3200, end = -2051 where id = 18;
-- update time_series_generic set start = -2050, end = -1651 where id = 19;
-- update time_series_generic set start = -1650, end = -1051 where id = 20;
-- update time_series_generic set start = -1050, end =  -901 where id = 21;
-- update time_series_generic set start =  -900, end =  -681 where id = 22;
-- update time_series_generic set start =  -680, end =  -481 where id = 23;
-- update time_series_generic set start =  -480, end =  -324 where id = 24;
-- update time_series_generic set start =  -323, end =   -32 where id = 25;
-- update time_series_generic set start =   -31, end =   329 where id = 26;
-- update time_series_generic set start =   330, end =  1204 where id = 27;

-- commit;