import { deleteArtifact } from '../api/artifactApi.js';
import { bsAlert } from '../../../components/bsComponents.js';
import { confirmAction } from '../../../helpers/helper.js';

export function initListener() {
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById("fullScreenImg");
    if (e.key === "Escape" && modal && modal.classList.contains('is-active')) {
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
      )
    });
  }
}