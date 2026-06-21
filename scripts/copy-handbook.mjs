import { cp, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = resolve(root, 'handbook')
const target = resolve(root, 'dist', 'handbook')

if (!existsSync(source)) {
  throw new Error('handbook directory is missing')
}

await mkdir(resolve(root, 'dist'), { recursive: true })
await cp(source, target, { recursive: true })
