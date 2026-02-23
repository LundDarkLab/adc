begin;
update list_measure_unit set acronym = 'mm' where id = 1;
update list_measure_unit set acronym = 'cm' where id = 2;
update list_measure_unit set acronym = 'mt' where id = 3;
COMMIT;