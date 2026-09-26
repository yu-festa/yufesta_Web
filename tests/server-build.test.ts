import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

test('배포용 JavaScript로 변환된 알림 API 두 개가 서버 모듈을 불러온다', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const configPath = ts.findConfigFile(join(root, 'api'), ts.sys.fileExists)
  assert.ok(configPath)
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  assert.equal(config.error, undefined)
  // Vercel reads the nearest tsconfig.json and defaults to NodeNext.
  const { options, errors } = ts.convertCompilerOptionsFromJson({
    target: 'ES2023', module: 'NodeNext', moduleResolution: 'NodeNext',
    esModuleInterop: true, ...config.config.compilerOptions,
  }, root)
  assert.deepEqual(errors, [])
  const temporaryRoot = resolve(root, 'node_modules/.tmp')
  mkdirSync(temporaryRoot, { recursive: true })
  const output = mkdtempSync(join(temporaryRoot, 'push-server-build-'))
  try {
    writeFileSync(join(output, 'package.json'), JSON.stringify({ type: 'module' }))
    const program = ts.createProgram({
      rootNames: ['api/open-notification.ts', 'api/open-notification-deliver.ts'].map(name => join(root, name)),
      options: { ...options, rootDir: root, outDir: output, skipLibCheck: true, types: ['node'], noEmitOnError: true },
    })
    const emitted = program.emit()
    assert.equal(emitted.emitSkipped, false, ts.formatDiagnosticsWithColorAndContext(emitted.diagnostics, {
      getCurrentDirectory: () => root, getCanonicalFileName: name => name, getNewLine: () => '\n',
    }))
    // Run the emitted files in a fresh Node process, without TypeScript source files.
    const check = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import schedule from './api/open-notification.js';
      import deliver from './api/open-notification-deliver.js';
      delete process.env.QSTASH_TOKEN;
      const response = await schedule.fetch(new Request('https://example.com/api/open-notification'));
      assert.equal(response.status, 503);
      assert.equal(typeof deliver.fetch, 'function');
    `], { cwd: output, encoding: 'utf8', timeout: 15000 })
    assert.equal(check.status, 0, check.stderr || check.error?.message)
  } finally {
    assert.ok(output.startsWith(temporaryRoot + sep))
    rmSync(output, { recursive: true, force: true })
  }
})
