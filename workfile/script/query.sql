-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_NAME = 'list_model_acquisition' AND REFERENCED_COLUMN_NAME = 'id';

select 
 macro.id as macro_id,
 macro_def.definition as macro,
 generic.id as generic_id,
 generic.definition as generic
from time_series_generic generic
inner join time_series_macro macro ON macro.id = generic.macro
inner join time_series_macro_definition macro_def ON macro_def.id = macro.macro
where macro.serie = 2
order by macro_def.id asc;