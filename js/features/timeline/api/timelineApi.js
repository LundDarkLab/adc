import { fetchApi } from "../../../shared/utils/fetch.js";

const payload = {class: 'Timeline'};

export async function fetchTimelineList() {
  try {
    payload.action = 'getTimelineList';
    const response = await fetchApi({ body: payload });
    return response;
  } catch (error) {
    console.error('Error fetching timeline list:', error);
    throw error;
  }
}

export async function fetchTimelineDetails(timelineId) {
  try {
    payload.action = 'getTimeline';
    payload.timeline_id = timelineId;
    const response = await fetchApi({ body: payload });
    return response;
  } catch (error) {
    console.error('Error fetching timeline details:', error);
    throw error;
  }
}

export async function getTimelineChronoGroups(timelineId){
  try {
    payload.action = 'getTimelineChronoGroups';
    payload.timelineId = timelineId;
    const response = await fetchApi({ body: payload });
    if (response.error === 1){
      throw new Error(`Error fetching Timeline chrono groups data`);
    }
    return response.data;
  } catch (error) {
    console.error(`getTimelineChronoGroups error:`, error);
    return false;
  }
}

export async function getMacroList(){
  try {
    const response = await fetchApi({ body: { class: 'Timeline', action: 'getMacroList' } });
    if (response.error === 1){
      throw new Error('Error fetching macro list');
    }
    return response.data;
  } catch (error) {
    console.error('getMacroList error:', error);
    return false;
  }
}

export async function checkTimelineName(name){
  try {
    const response = await fetchApi({ body: { class: 'Timeline', action: 'checkTimelineName', name } });
    if (response.error === 1){
      throw new Error('Error checking timeline name');
    }
    return response.data; // { error: 0|1, message }
  } catch (error) {
    console.error('checkTimelineName error:', error);
    return { error: 1, message: error.message };
  }
}

export async function saveTimeline({ name, state, tree }){
  try {
    const response = await fetchApi({ body: { class: 'Timeline', action: 'saveTimeline', name, state, tree } });
    if (response.error === 1){
      throw new Error(response.message || 'Error saving timeline');
    }
    return response.data; // { error: 0|1, message }
  } catch (error) {
    console.error('saveTimeline error:', error);
    return { error: 1, message: error.message };
  }
}

export async function updateTimeline({ timelineId, name, state, tree }){
  try {
    const response = await fetchApi({ body: { class: 'Timeline', action: 'updateTimeline', timelineId, name, state, tree } });
    if (response.error === 1){
      throw new Error(response.message || 'Error updating timeline');
    }
    return response.data; // { error: 0|1, message }
  } catch (error) {
    console.error('updateTimeline error:', error);
    return { error: 1, message: error.message };
  }
}

export async function deleteTimeline(timelineId){
  try {
    const response = await fetchApi({ body: { class: 'Timeline', action: 'deleteTimeline', timelineId } });
    if (response.error === 1){
      throw new Error(response.message || 'Error deleting timeline');
    }
    return response.data; // { error: 0|1, message }
  } catch (error) {
    console.error('deleteTimeline error:', error);
    return { error: 1, message: error.message };
  }
}