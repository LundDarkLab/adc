
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

(async () => {
  try {
    showLoading(true);
    // Carica CSS base
    await loadCSS(bootstrap.cssHref, bootstrap.cssIntegrity, bootstrap.cssCrossOrigin);
    await loadCSS(mdi.cssHref, mdi.cssIntegrity, mdi.cssCrossOrigin);
    await loadCSS('css/main.css', '', '');
    // Carica JS base
    await loadScript(jQuery.jsSrc, jQuery.jsIntegrity, jQuery.jsCrossOrigin);    
    await loadScript(bootstrap.jsSrc, bootstrap.jsIntegrity, bootstrap.jsCrossOrigin);
    
    // Setup globale
    const initHeader = await import('./shared/components/headerMenu/initHeaderMenu.js');
    const initSideMenu = await import('./shared/components/sideMenu/initSideMenu.js');
    const initFooter = await import('./shared/components/footer/initFooter.js');
    const bsModule = await import('./shared/components/bsComponents/initBsComponents.js');
    
    await initSideMenu.initSideMenu();
    await initHeader.initHeaderMenu();
    await initFooter.initFooter();

    bsModule.bsTooltips();

    // Logica condizionale per pagine
    if (window.pageType === 'artifact_add' || window.pageType === 'artifact_edit' || window.pageType === 'artifact_view') {
      // Carica Leaflet
      await loadScript(leaflet.jsSrc, leaflet.jsIntegrity, leaflet.jsCrossOrigin);
      await loadScript(leafletMapScale.jsSrc, leafletMapScale.jsIntegrity, leafletMapScale.jsCrossOrigin);
      await loadScript(leafletMousePosition.jsSrc, leafletMousePosition.jsIntegrity, leafletMousePosition.jsCrossOrigin);
      await loadCSS(leaflet.cssHref, leaflet.cssIntegrity, leaflet.cssCrossOrigin);
      await loadCSS(leafletMapScale.cssHref, leafletMapScale.cssIntegrity, leafletMapScale.cssCrossOrigin);
      await loadCSS(leafletMousePosition.cssHref, leafletMousePosition.cssIntegrity, leafletMousePosition.cssCrossOrigin);
      await loadCSS('js/shared/components/map/map.css', '', '');
      await loadCSS('css/artifacts_add.css', '', '');
      
      // Importa feature
      const artifactModule = await import('./features/artifact/initArtifact.js');
      artifactModule.initArtifactPage();
    }
    
    
    showLoading(false);
  } catch (error) {
    console.error('Errore caricamento:', error);
  }
})();