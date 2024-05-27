// /** @type {import("prettier").Config} */
/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
	useTabs: true,
	tabWidth: 4,
	semi: false,
	singleQuote: true,
	jsxSingleQuote: false,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: false,
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
	importOrder: [
		'<BUILTIN_MODULES>', // Node.js built-in modules
		'',
		'<TYPES>',
		'<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
		'',
		'<TYPES>^[.][.]',
		'^[.][.]', // parent imports
		'',
		'<TYPES>^[.][/]',
		'^[.][/]', // sibling imports
		'',
		'<TYPES>^[.]$',
		'^[.]$', // index imports
	],
    importOrderParserPlugins: ['typescript'],
	importOrderTypeScriptVersion: '5.3.3'
}
