export { debugLogsRuntimePre }
export { debugLogsRuntimePost }

import { getCwd } from '../shared/utils'
import type { AutoImporter } from './AutoImporter'
import { DEBUG, logDebug } from '../shared/debug'

function debugLogsRuntimePre(autoImporter: AutoImporter): undefined | void {
  if (!DEBUG) return
  logDebug('DEBUG_LOGS_RUNTIME [begin]')
  try {
    logDebug('process.platform', JSON.stringify(process.platform))
  } catch {
    logDebug('process.platform', 'undefined')
  }
  // https://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js/35813135#35813135
  try {
    logDebug('process.release', JSON.stringify(process.release))
  } catch {
    logDebug('process.release', 'undefined')
  }
  // https://github.com/cloudflare/workers-sdk/issues/1481 - Feature Request: Detect whether code is being run in Cloudflare Workers (or Node.js)
  try {
    logDebug('navigator', JSON.stringify(navigator))
  } catch {
    logDebug('navigator', 'undefined')
  }
  logDebug('cwd', getCwd())
  logDebug('importer.status', autoImporter.status)
  if (autoImporter.status === 'SET') {
    logDebug('importer.paths.autoImporterFilePathOriginal', autoImporter.paths.autoImporterFilePathOriginal)
    logDebug('importer.paths.autoImporterFileDirActual', autoImporter.paths.autoImporterFileDirActual)
    logDebug('importer.paths.importBuildFilePathRelative', autoImporter.paths.importBuildFilePathRelative)
    logDebug('importer.paths.importBuildFilePathOriginal', autoImporter.paths.importBuildFilePathOriginal)
    try {
      logDebug('importer.paths.importBuildFilePathResolved()', autoImporter.paths.importBuildFilePathResolved())
    } catch (err) {
      logDebug('importer.paths.importBuildFilePathResolved() error:', err)
      logDebug('importer.paths.importBuildFilePathResolved()', 'ERRORED')
    }
  }
}

function debugLogsRuntimePost({
  success,
  requireError,
  outDir,
  isOutsideOfCwd
}: {
  success: boolean
  requireError: unknown
  outDir: undefined | string
  isOutsideOfCwd: null | boolean
}): undefined | void {
  if (!DEBUG) return
  logDebug('requireError', requireError)
  logDebug('outDir', outDir)
  logDebug('isOutsideOfCwd', isOutsideOfCwd)
  logDebug('success', success)
  logDebug('DEBUG_LOGS_RUNTIME [end]')
}
