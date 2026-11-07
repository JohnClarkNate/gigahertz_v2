export type AppModule = 'dashboard' | 'inventory' | 'finance'

export function getCurrentModule(): AppModule {
  const module = new URLSearchParams(window.location.search).get('module')
  return module === 'inventory' || module === 'finance' ? module : 'dashboard'
}

export function navigateToModule(module: AppModule) {
  if (getCurrentModule() === module) return
  const path = module === 'dashboard' ? '/' : `/?module=${module}`
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
