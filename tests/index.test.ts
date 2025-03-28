import 'dotenv/config'

import { expect } from 'chai'
import { and } from 'drizzle-orm'
import { mysqlTable, serial } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/mysql2'
import { describe, it } from 'mocha'
import { createConnection } from 'mysql2'

import flags, { f0, f1, flagsExtras } from '../src'

function* generateOpts<T>(
	opts: T[],
	length: number,
	current: T[] = [],
): Generator<T[], void, void> {
	if (current.length === length) yield current
	else
		for (const opt of opts)
			yield* generateOpts(opts, length, [...current, opt])
}

const schema = {
	flagsTest: mysqlTable('flags_test', {
		id: serial('id').primaryKey(),
		flags: flags('flags', ['f0', 'f1', 'f2', 'f3', 'f4', 'f5']).notNull(),
	}),
}
const connection = createConnection(process.env.DATABASE_URL!)
const db = drizzle(connection, {
	schema,
	mode: 'planetscale',
	logger: true,
})

describe('flags', () => {
	it('should seed without error', async () => {
		await db.insert(schema.flagsTest).values(
			[...generateOpts([false, true], 4)].map((flags) => ({
				flags: {
					f0: flags[0]!,
					f1: flags[1]!,
					f2: flags[2]!,
					f3: flags[3]!,
					f4: false,
					f5: false,
				},
			})),
		)
	})

	it('f0', async () => {
		const quests = await db.query.flagsTest.findMany({
			where: f1(schema.flagsTest.flags, 'f0'),
		})
		console.log(quests)
		expect(quests.length).to.equal(8)
		expect(quests.every((q) => q.flags.f0)).to.be.true
	})

	it('f0 && f2', async () => {
		const quests = await db.query.flagsTest.findMany({
			where: f1(schema.flagsTest.flags, ['f0', 'f2']),
		})
		console.log(quests)
		expect(quests.length).to.equal(4)
		expect(quests.every((q) => q.flags.f0 && q.flags.f2)).to.be.true
	})

	it('!f0 && !f2', async () => {
		const quests = await db.query.flagsTest.findMany({
			where: f0(schema.flagsTest.flags, ['f0', 'f2']),
			extras: flagsExtras(schema.flagsTest.flags),
		})
		console.log(quests)
		expect(quests.length).to.equal(4)
		expect(quests.every((q) => !q.flags.f0 && !q.flags.f2)).to.be.true
		expect(quests.every((q) => !q.f0 && !q.f2)).to.be.true
	})

	it('f0 && !f3', async () => {
		const quests = await db.query.flagsTest.findMany({
			where: and(
				f1(schema.flagsTest.flags, 'f0'),
				f0(schema.flagsTest.flags, 'f3'),
			),
			columns: { id: true, flags: true },
		})
		console.log(quests)
		expect(quests.length).to.equal(4)
		expect(quests.every((q) => q.flags.f0 && !q.flags.f3)).to.be.true
	})

	it('f0 && f2 && !f3', async () => {
		const quests = await db.query.flagsTest.findMany({
			where: and(
				f1(schema.flagsTest.flags, ['f0', 'f2']),
				f0(schema.flagsTest.flags, 'f3'),
			),
			columns: { id: true, flags: true },
		})
		console.log(quests)
		expect(quests.length).to.equal(2)
		expect(quests.every((q) => q.flags.f0 && q.flags.f2 && !q.flags.f3)).to
			.be.true
	})

	it('should clean up the seed', async () => {
		await db.delete(schema.flagsTest)
	})
})
