async function buildStat() {
  try {
    const formData = new FormData();
    formData.append('trigger', 'statIndex');
    
    const response = await fetch(API + "stats.php", {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    artifactsTot = data.artifact.tot;
    cronoData.push(['chronology', 'tot', 'start', 'end']);
    institutionData.push(['Institution', 'Artifact stored', 'color']);
    
    data.typeChronologicalDistribution.forEach((v) => {
      cronoData.push([v.crono, v.tot, v.start, v.end]);
    });
    data.institutionDistribution.forEach((v) => {
      institutionData.push([v.name, v.tot, v.color]);
    });
    
    document.querySelector("#artifactTot > h2").textContent = data.artifact.tot;
    document.querySelector("#modelTot > h2").textContent = data.model.tot;
    document.querySelector("#institutionTot > h2").textContent = data.institution.tot;
    document.querySelector("#filesTot > h2").textContent = data.files.tot;

    google.charts.setOnLoadCallback(cronoChart);
    google.charts.setOnLoadCallback(institutionChart);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function institutionChart(institutionData) {
  var data = google.visualization.arrayToDataTable(institutionData);
  var slices = [];
  for (var i = 0; i < data.getNumberOfRows(); i++) {
    slices.push({color: data.getValue(i, 2)});
  }
  var options = {
    title: 'Total artifacts by institution',
    chartArea: {width: '100%', height: '300px'},
    pieHole: 0.4,
    slices: slices,
    width: '100%',
    height: '300px'
  };
  var chart = new google.visualization.PieChart(document.getElementById('institution_chart'));
  
  google.visualization.events.addListener(chart, 'select', function() {
    var selection = chart.getSelection();
    
    if (selection.length > 0) {
      var selectedItem = selection[0];
      if (selectedItem.row !== null) {
        var institutionName = data.getValue(selectedItem.row, 0);
        var artifactCount = data.getValue(selectedItem.row, 1);
        var institutionId = getInstitutionIdByName(institutionName);
        
        if (institutionId) {
          byInstitution.value = institutionId;
          getFilter();
        }
      }
    }
  });
  
  chart.draw(data, options);
}

function cronoChart(cronoData) {
  // Crea la DataTable solo con le colonne che servono per la visualizzazione
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'chronology');
  data.addColumn('number', 'tot');
  
  // Aggiungi solo le prime due colonne per la visualizzazione
  for (let i = 1; i < cronoData.length; i++) {
    data.addRow([cronoData[i][0], cronoData[i][1]]);
  }

  var options = {
    title: 'Chronological distribution',
    chartArea: {width: '70%', height: '80%', top: 60, left: 100, right: 20, bottom: 60},
    legend: {position: 'top'},
    width: '100%',
    height: '400px',
    hAxis: {
      title: 'Total',
      titleTextStyle: {color: '#333'}
    },
    vAxis: {
      minValue: 0,
      textStyle: {
        fontSize: 12
      }
    }
  };
  var chart = new google.visualization.BarChart(document.getElementById('crono_chart'));

  google.visualization.events.addListener(chart, 'select', function() {
    var selection = chart.getSelection();
    
    if (selection.length > 0) {
      var selectedItem = selection[0];
      if (selectedItem.row !== null) {
        // Accedi direttamente ai dati originali usando l'indice della riga selezionata
        var rowIndex = selectedItem.row + 1; // +1 perché saltiamo la prima riga (header)
        var chronologyName = cronoData[rowIndex][0];
        var artifactCount = cronoData[rowIndex][1];
        var startValue = cronoData[rowIndex][2];
        var endValue = cronoData[rowIndex][3];
        
        if (startValue && endValue) {
          byStart.value = startValue;
          byEnd.value = endValue;
          getFilter();
        }
      }
    }
  });

  chart.draw(data, options);
}


function getInstitutionIdByName(name) {
  for (let i = 1; i < institutionData.length; i++) { 
    if (institutionData[i][0] === name) {
      break;
    }
  }
  
  const option = Array.from(byInstitution.options).find(opt => opt.textContent === name);
  return option ? option.value : null;
}