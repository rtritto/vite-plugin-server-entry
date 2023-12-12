export { loadServerBuild }

import { getCwd, assert, assertUsage, toPosixPath, assertPosixPath, requireResolve } from './utils'
import { importBuildFileName } from '../shared/importBuildFileName'
import { import_ } from '@brillout/import'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter'
import { debugLogsRuntimePost, debugLogsRuntimePre } from '../shared/debugLogs'

async function loadServerBuild(outDir?: string): Promise<void | undefined> {
  const autoImporter: AutoImporter = require('../autoImporter')

  debugLogsRuntimePre(autoImporter)

  assertUsage(
    autoImporter.status !== 'DISABLED',
    "As a library author, if you disable the auto importer, then make sure your library injects a manual import of the file dist/server/importBuild.cjs into the built server entry file dist/server/index.js (or wherever the built server entry file is located) and make sure your library doesn't call loadServerBuild(), see https://github.com/brillout/vite-plugin-import-build#manual-import and https://github.com/brillout/vite-plugin-import-build#what-it-does"
  )

  let success = false
  let requireError: unknown
  let isOutsideOfCwd: boolean | null = null
  if (autoImporter.status === 'SET') {
    try {
      autoImporter.loadImportBuild()
      success = true
    } catch (err) {
      requireError = err
    }
    isOutsideOfCwd = isImportBuildOutsideOfCwd(autoImporter.paths)
    if (isOutsideOfCwd) {
      success = false
    }
  } else {
    // Yarn PnP or user has set config.vitePluginImportBuild._disableAutoImporter
    assert(autoImporter.status === 'UNSET')
  }

  if (!success) {
    success = await loadWithNodejs(outDir)
  }

  // We don't handle the following case:
  //  - When the user directly imports importBuild.cjs, because we assume that vite-plugin-ssr and Telefunc don't call loadServerBuild() in that case

  debugLogsRuntimePost({ success, requireError, isOutsideOfCwd, outDir })
  assertUsage(
    success,
    'Cannot find server build. (Re-)build your app and try again. If you still get this error, then you may need to manually import the server build, see https://github.com/brillout/vite-plugin-import-build#manual-import'
  )
}

// `${build.outDir}/dist/importBuild.cjs` may not belong to process.cwd() if e.g. vite-plugin-ssr is linked => autoImporter.js can potentially be shared between multiple projects
function isImportBuildOutsideOfCwd(paths: AutoImporterPaths): boolean | null {
  const cwd = getCwd()

  // We cannot check edge environments. Upon edge deployment the server code is usually bundled right after `$ vite build`, so it's unlikley that the resolved importBuildFilePath doesn't belong to cwd
  if (!cwd) return null

  let importBuildFilePath: string
  try {
    importBuildFilePath = paths.importBuildFilePathResolved()
  } catch {
    // Edge environments usually(/always?) don't support require.resolve()
    //  - This code block is called for edge environments that return a dummy process.cwd(), e.g. Cloudflare Workers: process.cwd() === '/'
    return null
  }

  if (isWebpackResolve(importBuildFilePath)) return null

  importBuildFilePath = toPosixPath(importBuildFilePath)
  assertPosixPath(cwd)
  return !importBuildFilePath.startsWith(cwd)
}

async function loadWithNodejs(outDir?: string): Promise<boolean> {
  const cwd = getCwd()
  if (!cwd) return false

  let path: typeof import('path')
  let fs: typeof import('fs')
  try {
    path = await import_('path')
    fs = await import_('fs')
  } catch {
    return false
  }

  const isPathAbsolute = (p: string) => {
    if (process.platform === 'win32') {
      return path.win32.isAbsolute(p)
    } else {
      return p.startsWith('/')
    }
  }

  let distImporterPathUnresolved: string
  if (outDir) {
    // Only pre-rendering has access to config.build.outDir
    assertPosixPath(outDir)
    assert(isPathAbsolute(outDir), outDir)
    distImporterPathUnresolved = path.posix.join(outDir, 'server', importBuildFileName)
  } else {
    // The SSR server doesn't have access to config.build.outDir so we shoot in the dark by trying with 'dist/'
    distImporterPathUnresolved = path.posix.join(cwd, 'dist', 'server', importBuildFileName)
  }
  const distImporterDir = path.posix.dirname(distImporterPathUnresolved)
  let distImporterPath: string
  let filename: string
  try {
    filename = __filename
  } catch {
    // __filename isn't defined when this file is being bundled into an ESM bundle
    return false
  }
  try {
    distImporterPath = await requireResolve(distImporterPathUnresolved, filename)
  } catch (err) {
    if (fs.existsSync(distImporterDir)) {
      console.error(err)
      assert(false, { distImporterDir, distImporterPathUnresolved })
    }
    return false
  }

  // webpack couldn't have properly resolved distImporterPath (since there is not static import statement)
  if (isWebpackResolve(distImporterPath)) {
    return false
  }

  // Ensure ESM compability
  assert(distImporterPath.endsWith('.cjs'))
  await import_(distImporterPath)
  return true
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}
