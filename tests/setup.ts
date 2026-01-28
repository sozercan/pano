// This file is imported by frontend tests that need DOM APIs
// Don't use global preload as it breaks API/integration tests

import { GlobalRegistrator } from '@happy-dom/global-registrator'

export function setupDOM() {
  GlobalRegistrator.register()
}

export function teardownDOM() {
  GlobalRegistrator.unregister()
}
