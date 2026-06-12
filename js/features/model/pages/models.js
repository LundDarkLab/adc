import { getArtifactName, connectToArtifact } from "../utils/helpers.js";
import { modelsGallery } from "../components/modelsGallery.js";
import { bsAlert } from "../../../components/bsComponents.js";


const artifact = document.getElementById("item").value;

const modelsPageConfig = {
  fields: [
    { label: 'Name',        key: 'name' },
    { label: 'Author',      key: 'author' },
    { label: 'Institution', key: 'institution' },
    { label: 'Description', key: 'description' },
  ],
  buttons: [
    { label: 'Add to artifact', onClick: (model) => connectToArtifact(model.id, artifact) },
    { label: 'View model',      href: (model) => `model_view.php?item=${model.id}` }
  ]
};


export async function initPage() {
  if (!artifact) {
    bsAlert('No artifact selected', 'danger');
    return;
  }
  await setName(artifact);
  await modelsGallery(modelsPageConfig);
  initToggleFilters(); 
}

async function setName(artifact){
  const name = await getArtifactName(artifact);
  const artifactNameH3 = document.getElementById("artifactName");
  artifactNameH3.textContent = name;
}

function initToggleFilters() {
  const btn = document.getElementById('toggleFiltersBtn');
  const galleryWrap = document.getElementById('galleryWrap');

  btn.addEventListener('click', () => {
    galleryWrap.classList.toggle('filters-hidden');

    // aggiorna l'icona in base allo stato
    const icon = btn.querySelector('i');
    const isHidden = galleryWrap.classList.contains('filters-hidden');
    icon.className = isHidden ? 'mdi mdi-menu-close' : 'mdi mdi-menu-open';
  });
}