import mapConfig from '../mapConfig.js';
export function myToolBar(L){
  L.Control.MyToolBar = L.Control.extend({
    options: { position: 'topleft'},
    
    onAdd: function (map) {
      this._map = map;
      this._container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      
      // Usa addButton per creare il pulsante home di default
      this.addButton({
        id: 'maxZoomBtn',
        title: 'max zoom',
        iconClass: 'mdi mdi-home',
        tooltip: true,
        iconSize: '18px',
        onClick: function(e) {
          this._map.setView(this._map.getCenter(), mapConfig.defaultZoom);
        }
      });
      
      return this._container;
    },
    
    addButton: function(options) {
      const btnElement = document.createElement('a');
      btnElement.href = '#';
      btnElement.title = options.title || '';
      btnElement.id = options.id || '';
      
      if (options.tooltip) {
        btnElement.setAttribute('data-bs-toggle', 'tooltip');
        btnElement.setAttribute('data-bs-placement', options.tooltipPlacement || 'right');
      }
      
      const icon = document.createElement('i');
      icon.className = options.iconClass || '';
      icon.style.fontSize = options.iconSize || '12px';
      btnElement.appendChild(icon);
      
      if (options.onClick) {
        L.DomEvent.on(btnElement, 'click', L.DomEvent.preventDefault);
        L.DomEvent.on(btnElement, 'click', (e) => {
          // Nascondi la tooltip prima di eseguire l'onClick
          if (options.tooltip && window.bootstrap && window.bootstrap.Tooltip) {
            const tooltipInstance = window.bootstrap.Tooltip.getInstance(btnElement);
            if (tooltipInstance) {
              tooltipInstance.hide();
            }
          }
          options.onClick.call(this, e);
        }, this);
      }
      
      this._container.appendChild(btnElement);

      // Inizializza la tooltip di Bootstrap se richiesta
      if (options.tooltip && window.bootstrap && window.bootstrap.Tooltip) {
        new window.bootstrap.Tooltip(btnElement);
      }
      
      return btnElement;
    },
    
    removeButton: function(buttonId) {
      const btn = this._container.querySelector(`#${buttonId}`);
      if (btn) {
        const tooltipInstance = window.bootstrap.Tooltip.getInstance(btn);
        if (tooltipInstance) {
          tooltipInstance.dispose();
        }
        this._container.removeChild(btn);
      }
    }
  });

  L.control.myToolBar = function (options) {
    return new L.Control.MyToolBar(options);
  };
}