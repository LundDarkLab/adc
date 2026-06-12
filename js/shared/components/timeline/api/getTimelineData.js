import { fetchApi } from "../../../utils/fetch.js";

export async function getTimelineSeries(state=''){
  try {
    const payload = {
      class: 'Timeline',
      action: 'getTimelineList',
      table:'time_series_complete',
      conditions: { state: state},
      columns: ['timeline_id as id', 'timeline', 'min(start) as `from`', 'max(end) as `to`'],
      groupBy: ['timeline_id', 'timeline'],
      orderBy: { 'timeline': 'ASC' }
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1){
      throw new Error(`Error fetching Timeline series data`);
    }
    return response.data;
  } catch (error) {
    console.error(`getTimelineSeries error:`, error);
    return false;
  }  
}

export async function getBounds(timeline){
  try {
    const payload = {
      class: 'Timeline',
      action: 'getTimelineBounds',
      conditions: { timeline: timeline }
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1){
      throw new Error(`Error fetching Timeline bounds data`);
    }
    return response.data;
  } catch (error) {
    console.error(`getBounds error:`, error);
    return false;
  }
}