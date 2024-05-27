import type { ColumnBaseConfig, ColumnDataType, SQL } from 'drizzle-orm'
import type { MySqlColumn } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { customType } from 'drizzle-orm/mysql-core'

const _intSizes = {
	tinyint: 1,
	smallint: 2,
	mediumint: 3,
	int: 4,
	bigint: 8,
} as const

const intTypeForFlags = (nFlags: number) => {
	for (const [type, size] of Object.entries(_intSizes))
		if (nFlags <= 8 * size) return type
	throw new Error('Too many flags')
}

const flagsToInt = <U extends string, T extends [U, ...U[]]>(
	flags: T,
	value: Record<T[number], boolean>,
) => {
	let data = 0
	for (let i = 0; i < flags.length; i++)
		if (value[flags[i] as T[number]]) data |= 1 << i
	return data
}

const _flags = <U extends string, T extends [U, ...U[]]>(flags: T) =>
	customType<{
		data: Record<T[number], boolean>
		driverData: number
		notNull: true
		default: true
	}>({
		dataType: () => intTypeForFlags(flags.length),
		toDriver: (value) => flagsToInt(flags, value),
		fromDriver(value) {
			const data: Record<string, boolean> = {}
			for (let i = 0; i < flags.length; i++)
				data[flags[i]!] = !!(value & (1 << i))
			return data as Record<T[number], boolean>
		},
	})

/**
 * Use the `flags` function to create a flags column. Provide the name of each flag. 
 * These names will not actually go in the database, so camelCase is fine.
 * 
 * As each flag is a single bit, these are the maximum number of flags that can be stored in each integer type:
 * -   up to 8 flags -> `TINYINT`
 * -   up to 16 flags -> `SMALLINT`
 * -   up to 24 flags -> `MEDIUMINT`
 * -   up to 32 flags -> `INT`
 * -   up to 64 flags -> `BIGINT`
 * 
 * @param name - The name of the flags column.
 * @param flags - An array of flag names.
 * @returns A custom type representing the flags column.
 * 
 * @example
 * ```typescript
 * // schema.ts
 * import flags from 'drizzle-flags'
 * 
 * export const users = mysqlTable('users', {
 *   id: serial('id').primaryKey(),
 *   username: varchar('username', { length: 191 }).notNull().unique(),
 *   fullName: varchar('full_name', { length: 191 }),
 *   email: varchar('email', { length: 191 }).unique(),
 *   notifications: flags('notifications', [
 *     'app',
 *     'newFeatures',
 *     'tips',
 *     'marketing',
 *     'newsletter',
 *   ]).default({
 *     app: true,
 *     newFeatures: true,
 *     tips: true,
 *     marketing: false,
 *     newsletter: false,
 *   }),
 * })
 * ```
 */
export const flags = <U extends string, T extends [U, ...U[]]>(
	name: string,
	flags: T,
) => _flags(flags)(name)

/**
 * Example usage:
 * 
 */

export default flags

function f<
	U extends string,
	D extends Record<U, boolean>,
	C extends ColumnBaseConfig<ColumnDataType, string> & {
		data: D
		driverParam: number
	},
>(column: MySqlColumn<C>, value: U | U[], target: boolean) {
	const template = column.mapFromDriverValue(0) as D
	const flags = Object.keys(template) as [U, ...U[]]
	const values = typeof value === 'string' ? [value] : value
	const val = Object.fromEntries(
		flags.map((f) => [f, values.includes(f) ? true : false]),
	) as Record<U, boolean>
	const int = flagsToInt(flags, val)
	return target
		? sql`${column} & ${int} = ${int}`
		: sql`${column} & ${int} = 0`
}

/**
 * The `f0` and `f1` functions can be used to filter rows based on the value of a flag.
 *
 * - `f0` stands for flag 0, where the selected flags are `false`.
 * - `f1` stands for flag 1, where the selected flags are `true`.
 *
 * @param column - The column to filter on.
 * @param value - The flag value(s) to filter by. Can be a single flag or an array of flags.
 * @returns A filtered result based on the flag value(s).
 *
 * @example
 * // Find users who have enabled the `newsletter` notifications
 * await db.query.users.findMany({
 *     where: f1(schema.users.notifications, 'newsletter'),
 * })
 *
 * // Find users who have enabled the `app` and `newFeatures` notifications
 * await db.query.users.findMany({
 *     where: f1(schema.users.notifications, ['app', 'newFeatures']),
 * })
 *
 * // Find users who have disabled the `tips` notifications
 * await db.query.users.findMany({
 *     where: f0(schema.users.notifications, 'tips'),
 * })
 *
 * // Find users who have enabled the `app` and `tips` notifications
 * // and disabled the `newsletter` notifications
 * await db.query.users.findMany({
 *     where: and(
 *         f1(schema.users.notifications, ['app', 'tips']),
 *         f0(schema.users.notifications, 'newsletter'),
 *     ),
 * })
 */
export const f1 = <
	U extends string,
	D extends Record<U, boolean>,
	C extends ColumnBaseConfig<ColumnDataType, string> & {
		data: D
		driverParam: number
	},
>(
	column: MySqlColumn<C>,
	value: U | U[],
) => f(column, value, true)


/**
 * The `f0` and `f1` functions can be used to filter rows based on the value of a flag.
 *
 * - `f0` stands for flag 0, where the selected flags are `false`.
 * - `f1` stands for flag 1, where the selected flags are `true`.
 *
 * @param column - The column to filter on.
 * @param value - The flag value(s) to filter by. Can be a single flag or an array of flags.
 * @returns A filtered result based on the flag value(s).
 *
 * @example
 * // Find users who have enabled the `newsletter` notifications
 * await db.query.users.findMany({
 *     where: f1(schema.users.notifications, 'newsletter'),
 * })
 *
 * // Find users who have enabled the `app` and `newFeatures` notifications
 * await db.query.users.findMany({
 *     where: f1(schema.users.notifications, ['app', 'newFeatures']),
 * })
 *
 * // Find users who have disabled the `tips` notifications
 * await db.query.users.findMany({
 *     where: f0(schema.users.notifications, 'tips'),
 * })
 *
 * // Find users who have enabled the `app` and `tips` notifications
 * // and disabled the `newsletter` notifications
 * await db.query.users.findMany({
 *     where: and(
 *         f1(schema.users.notifications, ['app', 'tips']),
 *         f0(schema.users.notifications, 'newsletter'),
 *     ),
 * })
 */
export const f0 = <
	U extends string,
	D extends Record<U, boolean>,
	C extends ColumnBaseConfig<ColumnDataType, string> & {
		data: D
		driverParam: number
	},
>(
	column: MySqlColumn<C>,
	value: U | U[],
) => f(column, value, false)

/**
 * The `flagsExtras` function can be used to include the flags in the extra fields of the query.
 *
 * @param column - The column object representing the flags.
 * @returns An object containing the flags and their corresponding SQL expressions.
 * 
 * @example
 * ```typescript
 * const user = await db.query.users.findFirst({
 * 	where: eq(schema.users.id, 1),
 * 	columns: { id: true, username: true },
 * 	extras: flagsExtras(schema.users.notifications),
 * })
 * 
 * console.log(user)
 * // Output:
 * // {
 * //     id: 1,
 * //     username: 'john_doe',
 * //     app: true,
 * //     newFeatures: true,
 * //     tips: true,
 * //     marketing: true,
 * //     newsletter: true,
 * // }
 * ```
 */
export const flagsExtras = <
	C extends ColumnBaseConfig<ColumnDataType, string> & {
		data: Record<string, boolean>
		driverParam: number
	},
>(
	column: MySqlColumn<C>,
) => {
	const flags = Object.keys(column.mapFromDriverValue(0) as C['data'])
	return Object.fromEntries(
		flags.map((f) => [
			f,
			sql`${column} & ${1 << flags.indexOf(f)}`
				.mapWith({ mapFromDriverValue: (val) => !!val })
				.as(f),
		]),
	) as Record<keyof C['data'], SQL.Aliased<boolean>>
}
