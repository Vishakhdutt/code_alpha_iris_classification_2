/**
 * Helper to get theme-appropriate font and grid colors
 * @returns {object} Theme color configurations
 */
function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    primary: '#2563eb',
    secondary: '#dc2626',
    accent: '#16a34a',
    classes: ['#2563eb', '#3b82f6', '#16a34a']
  };
}

let probChart = null;
let importanceChart = null;
let comparisonChart = null;

/**
 * Initialize all charts
 * @param {object} metadata Model metadata file output
 */
export function initCharts(metadata) {
  const colors = getThemeColors();
  
  // 1. Probability Distribution Chart (Placeholder/Empty init)
  const ctxProb = document.getElementById('probChart').getContext('2d');
  probChart = new Chart(ctxProb, {
    type: 'bar',
    data: {
      labels: Object.values(metadata.output_classes),
      datasets: [{
        label: 'Probability (%)',
        data: [0, 0, 0],
        backgroundColor: colors.classes,
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: colors.grid },
          ticks: { color: colors.text, font: { family: 'Inter' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: colors.text, font: { family: 'Inter', weight: 'bold' } }
        }
      }
    }
  });

  // 2. Feature Importance Chart (Static from Metadata)
  const ctxImp = document.getElementById('importanceChart').getContext('2d');
  const impData = metadata.feature_importances;
  const impLabels = Object.keys(impData).map(name => {
    // Map feature key to human readable
    const match = metadata.input_features.find(f => f.name === name || name.toLowerCase().includes(f.name));
    return match ? match.displayName : name;
  });
  
  importanceChart = new Chart(ctxImp, {
    type: 'bar',
    data: {
      labels: impLabels,
      datasets: [{
        label: 'Importance',
        data: Object.values(impData),
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        hoverBackgroundColor: 'rgba(37, 99, 235, 0.95)',
        borderRadius: 4,
        indexAxis: 'y'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: colors.grid },
          ticks: { color: colors.text }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.text, font: { family: 'Inter', weight: '600' } }
        }
      }
    }
  });

  // 3. Model Comparison Chart (From Metadata)
  const ctxComp = document.getElementById('comparisonChart').getContext('2d');
  const compData = metadata.model_comparison;
  const compModels = Object.keys(compData);
  const compAcc = compModels.map(m => compData[m].test_accuracy * 100);
  const compCV = compModels.map(m => compData[m].cv_accuracy * 100);
  
  comparisonChart = new Chart(ctxComp, {
    type: 'bar',
    data: {
      labels: compModels,
      datasets: [
        {
          label: 'Test Accuracy (%)',
          data: compAcc,
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderRadius: 4
        },
        {
          label: 'CV Accuracy (%)',
          data: compCV,
          backgroundColor: 'rgba(37, 99, 235, 0.5)',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: colors.text, font: { family: 'Inter', size: 11 } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: colors.grid },
          ticks: { color: colors.text }
        },
        x: {
          grid: { display: false },
          ticks: { color: colors.text, font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}

/**
 * Update the probability distribution values
 * @param {Array<number>} probabilities List of probabilities e.g. [0.95, 0.05, 0.0]
 */
export function updateProbabilityChart(probabilities) {
  if (!probChart) return;
  
  // Convert fractions to percentages
  const percentages = probabilities.map(p => p * 100);
  probChart.data.datasets[0].data = percentages;
  probChart.update();
}

/**
 * Re-color chart gridlines and text labels when theme toggles
 */
export function updateChartThemes() {
  const colors = getThemeColors();
  const charts = [probChart, importanceChart, comparisonChart];
  
  charts.forEach(chart => {
    if (!chart) return;
    
    // Update ticks and grids
    if (chart.options.scales.x) {
      if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = colors.text;
      if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = colors.grid;
    }
    if (chart.options.scales.y) {
      if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = colors.text;
      if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = colors.grid;
    }
    
    // Update legends
    if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
      chart.options.plugins.legend.labels.color = colors.text;
    }
    
    // Update dataset colors if they depend on theme
    if (chart === probChart) {
      chart.data.datasets[0].backgroundColor = colors.classes;
    }
    
    chart.update();
  });
}
