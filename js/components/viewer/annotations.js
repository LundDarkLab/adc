import { bsAlert } from "../bsComponents.js";
import { confirmAction } from "../../helpers/helper.js";
import { getDateString } from "../../helpers/utils.js";

export function initAnnotations( presenter, viewerState, viewerEl, viewerAnnotations, artifactId, measure_unit, measureTool, setViewerState, storeAnnotations ){
  
  let spotPicking = false;
  let spotPickingName = "";
  let selectedSpot = null;

  // DOM elements
  const wrapAnnotations = document.getElementById('wrapAnnotations');
  const btTogglePanel = document.getElementsByClassName('toggleAnnotations');
  const btAddView = document.getElementById('btAddView');
  const btAddSpot = document.getElementById('btAddSpot');
  const btStopSpot = document.getElementById('btStopSpot');
  const btClearAnnotations = document.getElementById('btClearAnnotations');
  const btExportAnnotations = document.getElementById('btExportAnnotations');
  const btImportAnnotations = document.getElementById('btImportAnnotations');
  const annNotes = document.getElementById('annNotes');

  // Initialize listeners
  function initListeners() {
    [...btTogglePanel].forEach(btn => {
      btn.addEventListener('click', () => {
        if(wrapAnnotations) {
          wrapAnnotations.classList.toggle('invisible');
        }
      });
    });
    if(btAddView) btAddView.addEventListener('click', () => storeView());
    if(btAddSpot) btAddSpot.addEventListener('click', () => addSpot());
    if(btStopSpot) btStopSpot.addEventListener('click', () => spotPickEnd());
    if(btClearAnnotations) btClearAnnotations.addEventListener('click', () => clearAnnotations());
    if(btExportAnnotations) btExportAnnotations.addEventListener('click', () => exportAnnotations());
    if(btImportAnnotations) btImportAnnotations.addEventListener('click', () => importAnnotations());
    if(annNotes) annNotes.addEventListener('change', () => updateNotes());
  }

  // Startup
  function startupAnnotations() {
    displayNotes();
    displayViews();
    displaySpots();
    // select spot callback
    presenter.enableOnHover(true);
    presenter._onPickedSpot = onSpotClick;
  }

  // Callback quando si clicca su uno spot nel canvas
  function onSpotClick(spotName) {
    selectSpot(spotName);
  }

  // Funzione per selezionare uno spot
  function selectSpot(spotName) {
    // Deseleziona lo spot precedente
    if(selectedSpot) {
      unselectSpot(selectedSpot);
    }
    
    selectedSpot = spotName;
    
    // Cambia colore dello spot nel canvas
    if(presenter._scene && presenter._scene.spots[spotName]) {
      presenter._scene.spots[spotName].color = [1.0, 1.0, 0.0];
      presenter.repaint();
    }
    
    // Centra la trackball sullo spot selezionato
    if(viewerAnnotations.spots[spotName]) {
      const spotData = viewerAnnotations.spots[spotName];
      
      // Se c'è una trackball position salvata, usala
      if(spotData.trackballPosition) {
        presenter.animateToTrackballPosition(spotData.trackballPosition);
      }
    }
    
    // Aggiungi classe active all'elemento della lista
    const listItem = document.querySelector(`[data-spot-name="${spotName}"]`);
    if(listItem) {
      listItem.classList.add('active');
      
      const btnSelect = listItem.querySelector('.btSelectSpot');
      const btnUnselect = listItem.querySelector('.btUnselectSpot');
      if(btnSelect) btnSelect.classList.add('d-none');
      if(btnUnselect) btnUnselect.classList.remove('d-none');
    }
  }

  // Funzione per deselezionare uno spot
  function unselectSpot(spotName) {
    if(!spotName) return;
    
    // Ripristina colore originale dello spot nel canvas
    if(presenter._scene && presenter._scene.spots[spotName]) {
      presenter._scene.spots[spotName].color = [1.0, 0.0, 1.0]; // Magenta (colore originale)
      presenter.repaint();
    }
    
    // Rimuovi classe active dall'elemento della lista
    const listItem = document.querySelector(`[data-spot-name="${spotName}"]`);
    if(listItem) {
      listItem.classList.remove('active');
      
      // Mostra/nascondi i pulsanti
      const btnSelect = listItem.querySelector('.btSelectSpot');
      const btnUnselect = listItem.querySelector('.btUnselectSpot');
      if(btnSelect) btnSelect.classList.remove('d-none');
      if(btnUnselect) btnUnselect.classList.add('d-none');
    }
    
    if(selectedSpot === spotName) {
      selectedSpot = null;
    }
  }

  function displayNotes() {
    const notesEl = document.getElementById("annNotes");
    if(notesEl) {
      notesEl.value = viewerAnnotations.notes.text;
    }
  }

  function updateNotes() {
    viewerAnnotations.notes.text = document.getElementById("annNotes").value;
    storeAnnotations();
  }

  function storeView() {
    let viewIndex = 1;
    while(viewerAnnotations.views["View "+viewIndex]) { viewIndex++; }
    const viewName = "View "+viewIndex;

    viewerState.trackState = presenter.getTrackballPosition();

    viewerAnnotations.views[viewName] = {
      view: null,
      state: structuredClone(viewerState),
      text: "",
      url: ""
    };

    displayViews();
    storeAnnotations();
  }

  function displayViews() {
    const viewsDiv = document.getElementById("viewsListDiv");
    if(!viewsDiv) return;

    viewsDiv.innerHTML = "";
    const ul = document.createElement('ul');
    ul.className = 'list-group list-group-flush';
    
    for (let view in viewerAnnotations.views) {
      const li = document.createElement('li');
      li.className = 'list-group-item viewListItem';

      const txtWrap = document.createElement('div');
      txtWrap.className = 'text-wrap';

      const title = document.createElement('span');
      title.className = 'fw-bold';
      title.textContent = view;

      const textArea = document.createElement('textarea');
      textArea.classList.add('form-control', 'mb-2');
      textArea.rows = 3;
      textArea.style.width = "100%";
      textArea.placeholder = 'view notes';
      textArea.value = viewerAnnotations.views[view].text;
      textArea.addEventListener('change', function() {
        updateViewText(view, this.value); 
      });

      txtWrap.append(title, textArea);

      const btnWrap = document.createElement('div');
      btnWrap.className = 'btn-wrap';


      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';
      btnGroup.role = 'group';

      const btnGoView = document.createElement('button');
      btnGoView.type = 'button';
      btnGoView.className = 'btn btn-secondary btGoView';
      btnGoView.dataset.viewName = view;
      btnGoView.innerHTML = "<span class='mdi mdi-directions'></span> view";
      btnGoView.addEventListener('click', function() {
        document.querySelectorAll('.viewListItem').forEach(element => { element.classList.remove('active'); });
        li.classList.add('active');
        applyView(view);
      });
    
      const btnEditView = document.createElement('button');
      btnEditView.type = 'button';
      btnEditView.className = 'btn btn-secondary btEditView';
      btnEditView.dataset.viewName = view;
      btnEditView.innerHTML = "<span class='mdi mdi-tooltip-edit'></span> edit";
      btnEditView.addEventListener('click', function() {
        updateViewState(view);
      });
    
      const btnDelView = document.createElement('button');
      btnDelView.type = 'button';
      btnDelView.className = 'btn btn-danger btDelView';
      btnDelView.dataset.viewName = view;
      btnDelView.innerHTML = "<span class='mdi mdi-delete-forever'></span> delete";
      btnDelView.addEventListener('click', function() {
        deleteView(view);
      });

      btnGroup.append(btnGoView, btnEditView, btnDelView);
      btnWrap.appendChild(btnGroup);

      li.append(txtWrap, btnWrap);
      ul.appendChild(li);
    }
    
    viewsDiv.appendChild(ul);
  }

  function applyView(viewName) {
    if(!viewerAnnotations.views[viewName]) {
      console.error("View not found:", viewName);
      return;
    }
    
    if(!viewerAnnotations.views[viewName].state) {
      console.error("View state is null:", viewName);
      return;
    }
    
    setViewerState(viewerAnnotations.views[viewName].state);
    // Rimuovi la classe active al primo drag della trackball
    const canvas = viewerEl.canvas;
    let startX, startY;
  
    const onMouseDown = (e) => {
      startX = e.clientX;
      startY = e.clientY;
    };
  
    const onMouseUp = (e) => {
      // Se il mouse si è mosso di almeno 5px, consideriamo che sia un drag
      const moved = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
      if (moved) {
        document.querySelectorAll('.viewListItem').forEach(element => {
          element.classList.remove('active');
        });
        // Rimuovi i listener
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
      }
    };
  
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
  }

  function updateViewState(viewName) {
    viewerState.trackState = presenter.getTrackballPosition();
    viewerAnnotations.views[viewName].state = structuredClone(viewerState);
    storeAnnotations();
    bsAlert(`${viewName} updated to current state.`, 'success', 3000);
  }

  function updateViewText(viewName, value) {
    viewerAnnotations.views[viewName].text = value;
    storeAnnotations();
  }

  function deleteView(viewName) {
    confirmAction('A view is being deleted, are you sure?', () => {
      delete viewerAnnotations.views[viewName];
      displayViews();
      storeAnnotations();
    });
  }

  function addSpot() {
    if (spotPicking) return;
    btSpotToggle();
    measureTool.stopMeasure();
    if(selectedSpot) {
      unselectSpot(selectedSpot);
    }
    spotPicking = true;
    let spotIndex = 1;
    while(viewerAnnotations.spots["Spot "+spotIndex]) { spotIndex++; }
    spotPickingName = "Spot "+spotIndex;
    viewerEl.canvas.style.cursor = "crosshair";
    presenter._onEndPickingPoint = onSpotPick;
    presenter.enablePickpointMode(true);
  }

  function btSpotToggle() {
    const btAddSpot = document.getElementById('btAddSpot');
    const btStopSpot = document.getElementById('btStopSpot');
    if(btAddSpot) btAddSpot.classList.toggle('d-none');
    if(btStopSpot) btStopSpot.classList.toggle('d-none');
  }

  function onSpotPick(point) { 
    viewerAnnotations.spots[spotPickingName] = {
      point: point,
      trackballPosition: presenter.getTrackballPosition(),
      text: "",
      url: ""
    };
    spotPickEnd();
    displaySpots();
    storeAnnotations();
  }

  function spotPickEnd() {
    viewerEl.canvas.style.cursor = "default";
    presenter.enablePickpointMode(false);
    spotPicking = false;
    spotPickingName = "";
    btSpotToggle();
  }

  function displaySpots() {
    const listDiv = document.querySelector("#spotsListDiv");
    if(!listDiv) return;
    
    listDiv.innerHTML = "";
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    listDiv.appendChild(ul);

    for (let spot in viewerAnnotations.spots) {
      const li = document.createElement('li');
      li.className = 'list-group-item viewListItem';
      li.dataset.spotName = spot; // Aggiungi data attribute per identificare l'elemento
      
      // Se questo spot è selezionato, aggiungi la classe active
      if(selectedSpot === spot) {
        li.classList.add('active');
      }

      const point = viewerAnnotations.spots[spot].point;
      const clampTo = getDecimalPlaces();
      const title = document.createElement('span');
      title.className = 'fw-bold';
      title.textContent = `${spot} - [${point[0].toFixed(clampTo)}, ${point[1].toFixed(clampTo)}, ${point[2].toFixed(clampTo)}]`;
      
      const textArea = document.createElement('textarea');
      textArea.rows = 2;
      textArea.classList.add('form-control', 'my-2');
      textArea.placeholder = 'spot notes';
      textArea.value = viewerAnnotations.spots[spot].text;
      textArea.addEventListener('change', function() { 
        updateSpotText(spot, this.value); 
      });

      // Contenitore per i pulsanti
      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';
      btnGroup.role = 'group';

      // Pulsante Select
      const btnSelect = document.createElement('button');
      btnSelect.type = 'button';
      btnSelect.className = 'btn btn-secondary btSelectSpot';
      btnSelect.title = 'Select spot';
      btnSelect.innerHTML = "<span class='mdi mdi-cursor-default-click'></span>";
      btnSelect.addEventListener('click', function() { selectSpot(spot); });
      if(selectedSpot === spot) { btnSelect.classList.add('d-none'); }

      // Pulsante Unselect
      const btnUnselect = document.createElement('button');
      btnUnselect.type = 'button';
      btnUnselect.className = 'btn btn-secondary btUnselectSpot';
      btnUnselect.title = 'Unselect spot';
      btnUnselect.innerHTML = "<span class='mdi mdi-close'></span>";
      btnUnselect.addEventListener('click', function() { unselectSpot(spot); });
      if(selectedSpot !== spot) { btnUnselect.classList.add('d-none'); }

      const btnDelSpot = document.createElement('button');
      btnDelSpot.type = 'button';
      btnDelSpot.className = 'btn btn-sm btn-danger btDelSpot float-end';
      btnDelSpot.title = 'Delete spot';
      btnDelSpot.innerHTML = "<span class='mdi mdi-delete-forever'></span>";
      btnDelSpot.addEventListener('click', function() { deleteSpot(spot); });
      btnGroup.append(btnSelect, btnUnselect, btnDelSpot);
      li.append(title, textArea, btnGroup);
      ul.appendChild(li);
    }

    if(!presenter._scene) return;
    presenter._scene.spots = {};
    presenter._spotsProgressiveID = 10;

    for (let spot in viewerAnnotations.spots) {
      const radius = 2.5;
      const opoint = [
        viewerAnnotations.spots[spot].point[0], 
        viewerAnnotations.spots[spot].point[1], 
        viewerAnnotations.spots[spot].point[2], 
        1.0
      ];
      const tpoint = SglMat4.mul4(presenter._scene.modelInstances["mesh_0"].transform.matrix, opoint);
      const spotColor = (selectedSpot === spot) ? [1.0, 1.0, 0.0] : [1.0, 0.0, 1.0];

      const newSpot = {
        mesh: "sphere",
        color: spotColor,
        alpha: 0.7,
        transform: { 
          translation: [tpoint[0], tpoint[1], tpoint[2]],
          scale: [radius, radius, radius],
        },
        visible: true,
      };
      presenter._scene.spots[spot] = presenter._parseSpot(newSpot);	
      presenter._scene.spots[spot].rendermode = "FILL";
    }  
    presenter.repaint();
  }

  function updateSpotText(spotName, value) {
    viewerAnnotations.spots[spotName].text = value;
    storeAnnotations();
  }

  function deleteSpot(spotName) {
    confirmAction('A spot is being deleted, are you sure?', () => {
      if(selectedSpot === spotName) {
        selectedSpot = null;
      }
      delete viewerAnnotations.spots[spotName];
      displaySpots();
      storeAnnotations();      
    });
  }

  function validateAnnotations(action) {
    return true;
  }

  function exportAnnotations() {
    if(!validateAnnotations("export")) return;
    
    const [year, month, day] = getDateString();
    viewerAnnotations.time = new Date().toISOString();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(viewerAnnotations, null, 2)));
    element.setAttribute('download', `${year}-${month}-${day}_DynColl_artifact_${artifactId}annotations.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function importAnnotations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', getJSON);
    input.click();
  }

  function getJSON(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = importJSON;
    reader.readAsText(file);
  }

  function importJSON(event) {
    try {
      const newAnn = JSON.parse(event.target.result);
      
      if(newAnn.object != artifactId) {
        bsAlert(`Cannot import annotations: artifact ID mismatch!\nCurrent artifact: ${artifactId}\nImported file: ${newAnn.object}`, 'danger', 5000);
        return;
      }

      if(newAnn.views) {
        for(let viewName in newAnn.views) {
          if(!viewerAnnotations.views[viewName]) {
            viewerAnnotations.views[viewName] = newAnn.views[viewName];
          }
        }
      }

      if(newAnn.spots) {
        for(let spotName in newAnn.spots) {
          if(!viewerAnnotations.spots[spotName]) {
            viewerAnnotations.spots[spotName] = newAnn.spots[spotName];
          }
        }
      }

      if(newAnn.notes && newAnn.notes.text) {
        if(viewerAnnotations.notes.text) {
          viewerAnnotations.notes.text += "\n---\n" + newAnn.notes.text;
        } else {
          viewerAnnotations.notes.text = newAnn.notes.text;
        }
      }

      viewerAnnotations.user = viewerAnnotations.user;
      storeAnnotations();
      displayViews();
      displaySpots();
      displayNotes();
      bsAlert('Annotations imported successfully!', 'success', 3000);
    } catch(error) {
      bsAlert('Error importing annotations: ' + error.message, 'danger', 5000);
      console.error(error);
    }
  }

  function clearAnnotations() {
    if(!validateAnnotations("clear")) return;

    confirmAction('All annotations will be deleted, are you sure?', () => {
      selectedSpot = null;
      viewerAnnotations.views = {};
      viewerAnnotations.spots = {};
      viewerAnnotations.notes = { text: "" };
      
      storeAnnotations();
      
      displayNotes();
      displayViews();
      displaySpots();
      presenter.repaint();
    });
  }

  function getDecimalPlaces() { return measure_unit === "m" ? 3 : 2; }

  startupAnnotations();
  initListeners();

  return {
    addSpot,
    btSpotToggle,
    clearAnnotations,
    exportAnnotations,
    importAnnotations,
    spotPickEnd,
    storeView,
    updateNotes,
    displayViews,
    displaySpots,
    displayNotes,
    applyView,
    updateViewState,
    deleteView,
    updateSpotText,
    deleteSpot
  };
}