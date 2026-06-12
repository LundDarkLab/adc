import { bootstrap, mdi, leaflet, leafletMapScale, leafletMousePosition} from './shared/config/appConfig.js';
import { showLoading } from './shared/utils/showLoadingUtils.js';

const loadScript = (src, integrity, crossOrigin) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    if (integrity) script.integrity = integrity;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadCSS = (href, integrity, crossOrigin) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (integrity) link.integrity = integrity;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
};

async function loadLeafletDependencies() {
  await Promise.all([
    loadScript(leaflet.jsSrc, leaflet.jsIntegrity, leaflet.jsCrossOrigin),
    loadCSS(leaflet.cssHref, leaflet.cssIntegrity, leaflet.cssCrossOrigin)
  ]);
  await Promise.all([
    loadScript(leafletMapScale.jsSrc, leafletMapScale.jsIntegrity, leafletMapScale.jsCrossOrigin),
    loadScript(leafletMousePosition.jsSrc, leafletMousePosition.jsIntegrity, leafletMousePosition.jsCrossOrigin),
    loadCSS(leafletMapScale.cssHref, leafletMapScale.cssIntegrity, leafletMapScale.cssCrossOrigin),
    loadCSS(leafletMousePosition.cssHref, leafletMousePosition.cssIntegrity, leafletMousePosition.cssCrossOrigin),
    loadCSS('js/shared/components/map/map.css', '', '')
  ]);
}

async function load3DHopDependencies() {
  await loadCSS('css/my3dhop.css', '', '');
  await loadScript('assets/3dhop/spidergl.js');
  await loadScript('assets/3dhop/presenter.js');
  await loadScript('assets/3dhop/nexus.js');
  await loadScript('assets/3dhop/ply.js');
  await loadScript('assets/3dhop/trackball_turntable.js');
  await loadScript('assets/3dhop/trackball_turntable_pan.js');
  await loadScript('assets/3dhop/trackball_pantilt.js');
  await loadScript('assets/3dhop/trackball_sphere.js');
  await loadScript('assets/3dhop/init.js');
}

const pageRoutes = {
  // DASHBOARD
  'dashboard': {
    css: ['css/dashboard.css'],
    dependencies: [loadLeafletDependencies],
    init: () => import('./features/dashboard/pages/dashboard.js').then(m => m.initDashboard())
  },
  // ARTIFACTS
  'artifact_add': {
    css: ['css/artifacts_add.css'],
    dependencies: [loadLeafletDependencies],
    init: () => import('./features/artifact/pages/artifactAdd.js').then(m => m.initAddPage())
  },
  'artifact_edit': {
    css: ['css/artifacts_add.css'],
    dependencies: [loadLeafletDependencies],
    init: () => import('./features/artifact/pages/artifactEdit.js').then(m => m.initEditPage())
  },
  'artifact_view': {
    css: ['css/artifact_view.css'],
    dependencies: [loadLeafletDependencies, load3DHopDependencies, () => loadScript("https://www.gstatic.com/charts/loader.js")],
    init: () => import('./features/artifact/pages/artifactView.js').then(m => m.initViewPage())
  },
  // MEDIA
  'media_add': {
    css: ['css/media.css'],
    dependencies: [],
    init: () => import('./features/artifact/pages/mediaAdd.js').then(m => m.initPage())
  },
  'media_edit': {
    css: ['css/media.css'],
    dependencies: [],
    init: () => import('./features/artifact/pages/mediaEdit.js').then(m => m.initPage())
  },
  // PERSON - USER
  'person_add': {
    css: ['css/person_add.css'],
    dependencies: [],
    init: () => import('./features/person/pages/personAdd.js').then(m => m.initAddPage())
  },
  'person_view': {
    css: ['css/person_view.css'],
    dependencies: [],
    init: () => import('./features/person/pages/personView.js').then(m => m.initPersonViewPage())
  },
  'person_edit': {
    css: ['css/person_add.css'],
    dependencies: [],
    init: () => import('./features/person/pages/personEdit.js').then(m => m.initPersonEditPage())
  },
  // MODELS
  'model_add': {
    css: ['css/model_add.css'],
    dependencies: [load3DHopDependencies],
    init: () => import('./features/model/pages/modelAdd.js').then(m => m.initAddPage())
  },
  'model_view': {
    css: ['css/model_view.css'],
    dependencies: [load3DHopDependencies],
    init: () => import('./features/model/pages/modelView.js').then(m => m.initViewPage())
  },
  'models': {
    css: ['css/models.css', 'js/components/gallery/modelCard/modelCard.css'],
    dependencies: [],
    init: () => import('./features/model/pages/models.js').then(m => m.initPage())
  },
  // TIMELINE
  'timeline': {
    css: ['css/timeline.css'],
    dependencies: [],
    init: () => import('./features/timeline/pages/timeline.js').then(m => m.initTimelinePage())
  }
};

try {
  showLoading(true);
  await Promise.all([
    loadCSS(bootstrap.cssHref, bootstrap.cssIntegrity, bootstrap.cssCrossOrigin),
    loadCSS(mdi.cssHref, mdi.cssIntegrity, mdi.cssCrossOrigin),
    loadCSS('css/main.css', '', ''),
    // loadScript(jQuery.jsSrc, jQuery.jsIntegrity, jQuery.jsCrossOrigin),
    loadScript(bootstrap.jsSrc, bootstrap.jsIntegrity, bootstrap.jsCrossOrigin)
  ]);
  const [initHeader, initSideMenu, initFooter, bsModule] = await Promise.all([
    import('./shared/components/headerMenu/initHeaderMenu.js'),
    import('./shared/components/sideMenu/initSideMenu.js'),
    import('./shared/components/footer/initFooter.js'),
    import('./shared/components/bsComponents/initBsComponents.js')
  ]);
  
  await Promise.all([
    initSideMenu.initSideMenu(),
    initHeader.initHeaderMenu(),
    initFooter.initFooter()
  ]);
  bsModule.bsTooltips();
  const route = pageRoutes[window.pageType];
  
  if (route) {
    const cssPromises = route.css.map(href => loadCSS(href, '', ''));
    const depPromises = (route.dependencies || []).map(fn => fn());
    await Promise.all([...cssPromises, ...depPromises]);
    await route.init();
  } else {
    console.warn(`Nessuna route definita per pageType: ${window.pageType}`);
  }
  showLoading(false);
} catch (error) {
  console.error('Errore caricamento:', error);
  showLoading(false);
}