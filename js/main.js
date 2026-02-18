import { jQuery, bootstrap, mdi, leaflet, leafletMapScale, leafletMousePosition} from './shared/config/appConfig.js';
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

// === DIPENDENZE CONDIZIONALI ===

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

// === ROUTING DELLE PAGINE ===

const pageRoutes = {
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
    dependencies: [loadLeafletDependencies, load3DHopDependencies],
    init: () => import('./features/artifact/pages/artifactView.js').then(m => m.initViewPage())
  },
  // PERSON - USER
  'person_add': {
    css: ['css/person_add.css'],
    dependencies: [],
    init: () => import('./features/person/pages/personAdd.js').then(m => m.initAddPage())
  },
  // MODELS
  'model_add': {
    css: ['css/model_add.css'],
    dependencies: [load3DHopDependencies],
    init: () => import('./features/model/pages/modelAdd.js').then(m => m.initAddPage())
  },
};

// === INIZIALIZZAZIONE PRINCIPALE ===

(async () => {
  try {
    showLoading(true);
    
    // 1. Carica risorse base (comuni a tutte le pagine)
    await Promise.all([
      loadCSS(bootstrap.cssHref, bootstrap.cssIntegrity, bootstrap.cssCrossOrigin),
      loadCSS(mdi.cssHref, mdi.cssIntegrity, mdi.cssCrossOrigin),
      loadCSS('css/main.css', '', ''),
      loadScript(jQuery.jsSrc, jQuery.jsIntegrity, jQuery.jsCrossOrigin),
      loadScript(bootstrap.jsSrc, bootstrap.jsIntegrity, bootstrap.jsCrossOrigin)
    ]);
    
    // 2. Setup globale (header, menu, footer, tooltips)
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

    // 3. Routing: carica pagina specifica
    const route = pageRoutes[window.pageType];
    
    if (route) {
      // Carica CSS specifici della pagina
      const cssPromises = route.css.map(href => loadCSS(href, '', ''));
      
      // Carica dipendenze (Leaflet, 3DHop, Chart.js, etc.)
      const depPromises = route.dependencies.map(fn => fn());
      
      // Esegui in parallelo
      await Promise.all([...cssPromises, ...depPromises]);
      
      // Inizializza la pagina
      await route.init();
    } else {
      console.warn(`Nessuna route definita per pageType: ${window.pageType}`);
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Errore caricamento:', error);
    showLoading(false);
  }
})();