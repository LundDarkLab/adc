import { bsAlert } from "../../../components/bsComponents.js";
import { fetchTimelineList } from "../api/timelineApi.js";
import { timelineDetails } from "./timelineDetails.js";

export async function timelineAvailable() {
  const timelineAvailableOutput = document.getElementById('timelineAvailableOutput');
  try{
    const timelineList = await fetchTimelineList();
    if (timelineList.error === 1) {
      throw new Error(timelineList.message);
    }
    if (timelineList.error === 0 && timelineList.data.length === 0){
      bsAlert('No available timeline<br>create a new one', 'info');
      return false;
    }
    
    timelineAvailableOutput.textContent = `${timelineList.data.length} timeline${timelineList.data.length > 1 ? 's' : ''} available`;
  
    buildTimelineList(timelineList.data);
    
  }catch(error){
    bsAlert(`Error fetching timeline list: ${error.message}`, 'danger');
    return false;
  }
}

function buildTimelineList(timelineList){
  const timelineAvailableContainer = document.getElementById('timelineAvailableContainer');
  timelineAvailableContainer.innerHTML = '';
  timelineList.forEach(timeline => {
    const color = timeline.state === 'draft' ? 'text-danger' : 'text-success';
    const timelineItem = document.createElement('button');
    timelineItem.classList.add('dropdown-item', color);
    timelineItem.textContent = `${timeline.definition} (${timeline.state})`;
    timelineAvailableContainer.appendChild(timelineItem);

    timelineItem.addEventListener('click', () => {
      timelineDetails(timeline.id);
    });
  });
}