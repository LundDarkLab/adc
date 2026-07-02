export async function initNavigation(tooltipSelector) {
  const [initHeader, initSideMenu, initFooter, bsModule] = await Promise.all([
    import('./headerMenu/initHeaderMenu.js'),
    import('./sideMenu/initSideMenu.js'),
    import('./footer/initFooter.js'),
    import('./bsComponents/initBsComponents.js')
  ]);

  await Promise.all([
    initSideMenu.initSideMenu(),
    initHeader.initHeaderMenu(),
    initFooter.initFooter()
  ]);

  bsModule.bsTooltips(tooltipSelector);
}
