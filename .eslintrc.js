/** @type {import('eslint').Linter.Config} */
module.exports = {
	env: {
		browser: true,
		es2021: true,
		commonjs: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	overrides: [
		{
			env: { node: true },
			files: ['.eslintrc.{js,cjs}'],
			parserOptions: { sourceType: 'script' },
		},
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: ['tsconfig.json'],
	},
	ignorePatterns: ['dist/', 'node_modules/', '.eslintrc.js'],
	plugins: ['@typescript-eslint', 'import'],
	rules: {
		'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
		'@typescript-eslint/consistent-type-imports': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			},
		],
		eqeqeq: 'error',
		'sort-imports': [
			'warn',
			{
				ignoreCase: false,
				ignoreDeclarationSort: true, // don't want to sort import lines, use eslint-plugin-import instead
				ignoreMemberSort: true, // allow prettier to sort member lines
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				allowSeparatedGroups: true,
			},
		],
		'import/order': ['warn', { 'newlines-between': 'always' }],
		// '@typescript-eslint/no-non-null-assertion': 'warn',
		// '@typescript-eslint/restrict-template-expressions': 'warn',
		'@typescript-eslint/no-base-to-string': 'warn',
	},
}
