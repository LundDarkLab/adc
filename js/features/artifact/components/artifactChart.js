import { fetchApi } from "../../../shared/utils/fetch.js";
import { renderAll } from "../../../components/chart/initChart.js";

export async function initArtifactStats(classId,classType) {
  const [cronoDataRaw, institutionData] = await Promise.all([
    fetchApi({ body: { class: 'Stats', action: 'typeChronologicalDistribution', id: classId} }),
    fetchApi({ body: { class: 'Stats', action: 'institutionDistribution', filter: [`a.category_class = ${classId}`] } })
  ]);
  const cronoData = [
    ['chronology', 'tot'],
    ...cronoDataRaw.data.map(({ crono, tot }) => [crono, Number(tot)])
  ];
  const cronoMeta = cronoDataRaw.data.map(({ crono, start, end }) => ({ crono, start, end }));

  await renderAll([
    {
      type: 'line',
      containerId: 'lineChart',
      title: `${classType} Chronological distribution`,
      data: cronoData,
      onSelect: ({ value }) => {
        const meta = cronoMeta.find(m => m.crono === value);
        if (meta) console.log('Selected:', meta);
      }
    },
    {
      type: 'column',
      containerId: 'columnChart',
      title: `Number of ${classType} by Institution`,
      data: institutionData.data,
    }
  ]);
}