import { deleteArtifact } from '../api/artifactApi.js';
import { bsAlert } from '../../../components/bsComponents.js';
import { confirmAction } from '../../../helpers/helper.js';
import { resizeCanvas } from '../../../3dhop_function.js';
import { initViewPageMap } from '../components/artifactViewMap.js';

// Tracks the user's manual expanded preference in wide (> 700px) mode
let wideExpanded = false;
const narrowMq = window.matchMedia('(max-width: 700px)');

export function applyOrientationClass() {
  const mainContent = document.getElementById('mainContent');
  if (mainContent) mainContent.classList.toggle('expanded', narrowMq.matches);
}

export function initListener(artifactData) {
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById("fullScreenImg");
    if (e.key === "Escape" && modal?.classList.contains('is-active')) {
      modal.classList.remove('is-active');
      document.body.classList.remove('no-scroll');
    }
  });

  const deleteBtn = document.getElementById('delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      await confirmAction(
        'Are you sure you want to delete this artifact? This action cannot be undone.',
        async () => {
          const response = await deleteArtifact(domEl.artifactId.value);
          if (response.error === 1) {
            bsAlert(response.message, 'danger');
          } else {
            bsAlert(response.data.message, 'success', 3000, () => {
              window.location.href = 'dashboard.php';
            });
          }
        }
      );
    });
  }

  const btWidescreen = document.getElementById('btWidescreen');
  if (btWidescreen) {
    btWidescreen.addEventListener('click', () => {
      const mainContent = document.getElementById('mainContent');
      
      const hopEl = document.getElementById('3dhop');
      // Reset PRIMA del toggle: il browser ricalcola #model con la nuova
      // grid column già libera da interferenze del figlio
      hopEl.style.width  = '';
      hopEl.style.height = '';
      
      mainContent.classList.toggle('expanded');
      if (!narrowMq.matches) {
        wideExpanded = mainContent.classList.contains('expanded');
      }
      initViewPageMap(artifactData.artifact_findplace);
      setTimeout(() => {
        resizeCanvas();
      }, 500);
    });
  }

  narrowMq.addEventListener('change', (e) => {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    if (e.matches) {
      mainContent.classList.add('expanded');
    } else {
      mainContent.classList.toggle('expanded', wideExpanded);
    }
    // dvh on mobile settles after the viewport resize completes —
    // rAF is too early; a short timeout lets the browser finish
    setTimeout(() => {
      initViewPageMap(artifactData.artifact_findplace);
    }, 200);
  });
}