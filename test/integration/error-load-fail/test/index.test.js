/* eslint-env jest */

import { join } from 'path'
import fs from 'fs-extra'
import webdriver from 'next-webdriver'
import {
  nextBuild,
  nextStart,
  findPort,
  killApp,
  check,
  getPageFileFromBuildManifest,
} from 'next-test-utils'

jest.setTimeout(1000 * 60 * 1)
const appDir = join(__dirname, '..')
let app

describe('Failing to load _error', () => {
  afterAll(() => killApp(app))

  it('handles failing to load _error correctly', async () => {
    await nextBuild(appDir)
    const appPort = await findPort()
    app = await nextStart(appDir, appPort)

    const browser = await webdriver(appPort, '/')
    await browser.eval(`window.beforeNavigate = true`)

    await browser.elementByCss('#to-broken').moveTo()
    await browser.waitForElementByCss('script[src*="broken.js"')

    const errorPageFilePath = getPageFileFromBuildManifest(appDir, '/_error')
    // remove _error client bundle so that it can't be loaded
    await fs.remove(join(appDir, '.next', errorPageFilePath))

    await browser.elementByCss('#to-broken').click()

    await check(async () => {
      return !(await browser.eval('window.beforeNavigate'))
        ? 'reloaded'
        : 'fail'
    }, /reloaded/)
  })
})
