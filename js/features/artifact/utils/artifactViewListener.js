import { deleteArtifact } from '../api/artifactApi.js';
import { bsAlert } from '../../../components/bsComponents.js';
import { confirmAction } from '../../../helpers/helper.js';

export function initListener() {
  document.getElementById('delete').addEventListener('click', async () => {
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