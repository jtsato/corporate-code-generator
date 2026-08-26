import type { ValueTransformer } from 'typeorm';

/**
 * Makes a numeric column read back as a `number` on every supported engine.
 *
 * `pg` returns `bigint` and `numeric` as strings, because they can hold values
 * no float64 represents exactly, while SQLite returns them as numbers. Without
 * this transformer the same column would compare, sort and serialize
 * differently depending on which database the application was pointed at — and
 * the SQLite-backed tests would never see it.
 *
 * The conversion narrows to float64, which is the precision the generated model
 * already commits to by mapping these types onto `number`.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | number | null | undefined): number | null | undefined =>
    value === null || value === undefined ? value : Number(value),
};
