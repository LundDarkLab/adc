import { timelineAvailable } from "../components/timelineAvailable.js";
import { timelineCreate } from "../components/timelineEditor.js";

export async function initTimelinePage() {
  const newTimelineBtn = document.getElementById('newTimeLineBtn');
  if (newTimelineBtn) {
    newTimelineBtn.addEventListener('click', () => timelineCreate());
  }

  await Promise.all([
    timelineAvailable()
  ]);
}
