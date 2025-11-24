import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  parserOptions: {
    project: './tsconfig.json', // point to this folder's tsconfig
    tsconfigRootDir: __dirname, // make ESLint resolve relative to this folder
  },
})
