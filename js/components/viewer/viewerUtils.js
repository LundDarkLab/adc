export function getDecimalPlaces(measure_unit) {
  return measure_unit === "m" ? 3 : 2;
}