import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', maxWorkers: 2, setupFiles: ['./tests/no-network.ts'], include: ['tests/**/*.test.ts'] } })
