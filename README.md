# drizzle-flags

This package can be used to use [flags](https://planetscale.com/learn/courses/mysql-for-developers/examples/bitwise-operations) columns in drizzle. These columns can store multiple boolean values using a single integer column, which can save up a lot of space. For example, using this method 8 booleans can be stored in a single `TINYINT`.

## Installation

```bash
npm install drizzle-flags
```

## Usage

### Creating a flags column

Use the `flags` function to create a flags column. Provide the name of each flag. These names will not actually go in the database, so camelCase is fine.

It will create an integer column in the database, automatically sized depending on the number of flags. As each flag is a single bit, these are the maximum number of flags that can be stored in each integer type:

-   up to 8 flags -> `TINYINT`
-   up to 16 flags -> `SMALLINT`
-   up to 24 flags -> `MEDIUMINT`
-   up to 32 flags -> `INT`
-   up to 64 flags -> `BIGINT`

```typescript
// schema.ts
import flags from 'drizzle-flags'

export const users = mysqlTable('users', {
	id: serial('id').primaryKey(),
	username: varchar('username', { length: 191 }).notNull().unique(),
	fullName: varchar('full_name', { length: 191 }),
	email: varchar('email', { length: 191 }).unique(),
	notifications: flags('notifications', [
		'app',
		'newFeatures',
		'tips',
		'marketing',
		'newsletter',
	]).default({
		app: true,
		newFeatures: true,
		tips: true,
		marketing: false,
		newsletter: false,
	}),
})
```

In this example, the `notifications` column will store 5 boolean values, indicating whether the user has enabled notifications for the app, new features, tips, marketing, and the newsletter channels. A `TINYINT` column will be created in the database to store these flags.

### Reading and writing flags

Now that we have created the column, we can read and write the `notifications` column as an object with the flag names as keys.

```typescript
const user = await db.query.users.findFirst({
	where: eq(schema.users.id, 1),
})

console.log(user?.notifications)

// Output:
// {
//     app: true,
//     newFeatures: true,
//     tips: true,
//     marketing: false,
//     newsletter: false,
// }

// enable `marketing` and `newsletter` notifications
await db
	.update(schema.users)
	.set({
		notifications: {
			app: true,
			newFeatures: true,
			tips: true,
			marketing: true,
			newsletter: true,
		},
	})
	.where(eq(schema.users.id, 1))
```

### Filtering by flags

The `f0` and `f1` functions can be used to filter rows based on the value of a flag.

-   `f0` stands for flag 0, where the selected flags are `false`.
-   `f1` stands for flag 1, where the selected flags are `true`.

Here are some examples:

```typescript
// Find users who have enabled the `newsletter` notifications
await db.query.users.findMany({
	where: f1(schema.users.notifications, 'newsletter'),
})

// Find users who have enabled the `app` and `newFeatures` notifications
await db.query.users.findMany({
	where: f1(schema.users.notifications, ['app', 'newFeatures']),
})

// Find users who have disabled the `tips` notifications
await db.query.users.findMany({
	where: f0(schema.users.notifications, 'tips'),
})

// Find users who have enabled the `app` and `tips` notifications
// and disabled the `newsletter` notifications
await db.query.users.findMany({
	where: and(
		f1(schema.users.notifications, ['app', 'tips']),
		f0(schema.users.notifications, 'newsletter'),
	),
})
```

### Including flags in the extra fields

The `flagsExtras` function can be used to include the flags in the extra fields of the query.

```typescript
const user = await db.query.users.findFirst({
	where: eq(schema.users.id, 1),
	columns: { id: true, username: true },
	extras: flagsExtras(schema.users.notifications),
})

console.log(user)

// Output:
// {
//     id: 1,
//     username: 'john_doe',
//     app: true,
//     newFeatures: true,
//     tips: true,
//     marketing: true,
//     newsletter: true,
// }
```
