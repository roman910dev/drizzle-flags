import { defineConfig, type Options } from 'tsup'

type Config =
	| Options
	| Options[]
	| ((
			overrideOptions: Options,
	  ) => Options | Options[] | Promise<Options | Options[]>)

const config: Config = defineConfig({
	entry: ['src/index.ts'],
	outDir: 'dist',
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	treeshake: true,
	target: 'es2022',
	minify: false,
	keepNames: true,
})
export default config
