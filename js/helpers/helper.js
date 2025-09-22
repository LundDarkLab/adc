import { bsConfirm } from "../components/bsComponents.js";
export async function confirmAction(message, onConfirm, onCancel = null) {
  const confirmed = await bsConfirm(message);
  if (confirmed) {
    await onConfirm();
  } else if (onCancel) {
    await onCancel();
  }
}