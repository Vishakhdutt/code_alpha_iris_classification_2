import { 
  showToast, 
  validateInput, 
  loadHistory, 
  saveHistory, 
  clearHistory, 
  copyToClipboard, 
  downloadJSON, 
  SAMPLE_PRESETS, 
  generateRandomInputs 
} from './js/utils.js';

import { 
  initCharts, 
  updateProbabilityChart, 
  updateChartThemes 
} from './js/charts.js';

// Global variables
let ortSession = null;
let modelMetadata = null;
let currentPrediction = null;

// Species Details for Display Card
const SPECIES_DETAILS = {
  "Iris-setosa": {
    scientificName: "Iris setosa",
    description: "Known for its short, narrow petals (sepal-like) and rich purple-blue flowers. It is highly resilient and grows native to arctic regions.",
    characteristics: ["Short, narrow petals", "Resilient to cold climates", "Vibrant dark purple/blue hues"],
    class: "badge-setosa"
  },
  "Iris-versicolor": {
    scientificName: "Iris versicolor",
    description: "Also called the Blue Flag, it features medium-sized blue-purple flowers with yellow bases. Native to wetlands and meadows.",
    characteristics: ["Moderate petal/sepal size ratio", "Yellow guidelines at petal base", "Commonly found in marshes"],
    class: "badge-versicolor"
  },
  "Iris-virginica": {
    scientificName: "Iris virginica",
    description: "Known as the Virginia Iris, it has large petals, slightly drooping sepals, and tall stalks. Thrives in warm coastal wetlands.",
    characteristics: ["Long, wide petals & sepals", "Tall leafy stems", "Prefers humid coastal climates"]
  }
};

// Safe setter helper to avoid TypeErrors
function safeSetText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = text;
  } else {
    console.warn(`Element with ID "${id}" was not found in the DOM.`);
  }
}

// Elements mapping container
let el = {};

function initElements() {
  el = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    predictionForm: document.getElementById('prediction-form'),
    predictBtn: document.getElementById('predict-btn'),
    resetBtn: document.getElementById('reset-btn'),
    randomBtn: document.getElementById('random-btn'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    historyList: document.getElementById('history-list'),
    loaderOverlay: document.getElementById('loader-overlay'),
    emptyResult: document.getElementById('empty-result-placeholder'),
    predictionCard: document.getElementById('prediction-card'),
    speciesTitle: document.getElementById('species-title'),
    speciesSci: document.getElementById('species-sci'),
    confidenceVal: document.getElementById('confidence-val'),
    confidenceBar: document.getElementById('confidence-bar'),
    speciesDesc: document.getElementById('species-desc'),
    speciesDetailsList: document.getElementById('species-details-list'),
    resultBadge: document.getElementById('result-badge'),
    timestampVal: document.getElementById('timestamp-val'),
    sliderGroup: document.getElementById('slider-group'),
    presetContainer: document.getElementById('preset-container')
  };
}

// Safe localStorage wrappers to prevent crashing in sandboxed or private browsing environments
function getStorageItem(key, defaultValue) {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    console.warn('localStorage read blocked:', e);
    return defaultValue;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage write blocked:', e);
  }
}

// Initialize Application
async function init() {
  setupTheme();
  
  try {
    showLoader(true);
    
    // 1. Fetch Metadata
    const response = await fetch('./model/metadata.json');
    if (!response.ok) throw new Error('Failed to load model metadata.');
    modelMetadata = await response.json();
    
    // Populate stats, inputs, charts
    populateModelDetails(modelMetadata);
    generateInputControls(modelMetadata.input_features);
    initCharts(modelMetadata);
    generatePresetButtons();
    renderHistory();
    
    showToast('Backend AI Model Connected', 'success');
    updateInferenceMetrics(modelMetadata);
    showLoader(false);
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize AI connection', 'error');
    showLoader(false);
  }
}

// Show/Hide Loader overlay
function showLoader(show) {
  if (el.loaderOverlay) {
    el.loaderOverlay.style.display = show ? 'flex' : 'none';
  }
}

// Setup Theme System
function setupTheme() {
  const savedTheme = getStorageItem('theme', 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (el.themeToggleBtn && el.themeIcon) {
    updateThemeIcon(savedTheme);
    
    el.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      setStorageItem('theme', newTheme);
      updateThemeIcon(newTheme);
      updateChartThemes();
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  } else {
    console.warn('Theme elements are not available in the DOM.');
  }
}

function updateThemeIcon(theme) {
  if (el.themeIcon) {
    if (theme === 'dark') {
      el.themeIcon.innerHTML = `<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/>`;
    } else {
      el.themeIcon.innerHTML = `<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-4v2m0 14v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M3 12h2m14 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
}

// Display static training info
function populateModelDetails(meta) {
  safeSetText('meta-accuracy', `${(meta.metrics.test_accuracy * 100).toFixed(1)}%`);
  safeSetText('meta-algorithm', meta.algorithm);
  safeSetText('stat-samples', meta.dataset_info.total_samples);
  safeSetText('stat-features', meta.dataset_info.num_features);
  safeSetText('stat-classes', meta.dataset_info.num_classes);
  safeSetText('stat-accuracy', `${(meta.metrics.test_accuracy * 100).toFixed(1)}%`);
}

// Display training evaluation metrics
function updateInferenceMetrics(meta) {
  safeSetText('metrics-alg', meta.algorithm);
  safeSetText('metrics-acc', (meta.metrics.test_accuracy * 100).toFixed(1) + '%');
  safeSetText('metrics-cv', (meta.metrics.cv_accuracy * 100).toFixed(1) + '%');
  safeSetText('metrics-precision', (meta.metrics.precision * 100).toFixed(1) + '%');
  safeSetText('metrics-recall', (meta.metrics.recall * 100).toFixed(1) + '%');
  safeSetText('metrics-f1', (meta.metrics.f1_score * 100).toFixed(1) + '%');
  
  // Render confusion matrix
  const matrixBody = document.getElementById('confusion-matrix-body');
  if (matrixBody && meta.metrics.confusion_matrix) {
    matrixBody.innerHTML = '';
    const classNames = Object.values(meta.output_classes);
    meta.metrics.confusion_matrix.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="font-weight: 600; text-align: left;">${classNames[i]}</td>` +
        row.map(val => `<td style="text-align: center; font-family: var(--font-title); font-weight: 600;">${val}</td>`).join('');
      matrixBody.appendChild(tr);
    });
  }
}

// Generate Sliders & Inputs based on metadata.json fields
function generateInputControls(features) {
  el.sliderGroup.innerHTML = '';
  features.forEach(feat => {
    const group = document.createElement('div');
    group.className = 'input-group';
    
    // Clean displayName to standard format
    const step = 0.1;
    const initialVal = ((feat.max + feat.min) / 2).toFixed(1);
    
    group.innerHTML = `
      <div class="input-labels">
        <label for="input-${feat.name}">${feat.displayName}</label>
        <span class="input-val-badge" id="val-${feat.name}">${initialVal} cm</span>
      </div>
      <div class="slider-container">
        <input type="range" 
               id="slider-${feat.name}" 
               min="${feat.min}" 
               max="${feat.max}" 
               step="${step}" 
               value="${initialVal}">
        <input type="number" 
               id="num-${feat.name}" 
               min="${feat.min}" 
               max="${feat.max}" 
               step="${step}" 
               value="${initialVal}">
      </div>
      <div class="error-msg" id="error-${feat.name}"></div>
    `;
    
    el.sliderGroup.appendChild(group);
    
    // Bind listeners to sync slider and number inputs
    const slider = group.querySelector(`#slider-${feat.name}`);
    const num = group.querySelector(`#num-${feat.name}`);
    const badge = group.querySelector(`#val-${feat.name}`);
    
    const syncValues = (val) => {
      const parsedVal = parseFloat(val);
      const err = validateInput(parsedVal, feat);
      const errorDiv = group.querySelector(`#error-${feat.name}`);
      
      if (err) {
        errorDiv.innerText = err;
        errorDiv.style.display = 'block';
        group.classList.add('shake-error');
        setTimeout(() => group.classList.remove('shake-error'), 400);
      } else {
        errorDiv.style.display = 'none';
        badge.innerText = `${parsedVal.toFixed(1)} cm`;
        slider.value = parsedVal;
        num.value = parsedVal;
      }
    };
    
    slider.addEventListener('input', (e) => syncValues(e.target.value));
    num.addEventListener('input', (e) => syncValues(e.target.value));
  });
}

// Generate preset flower items in prediction page
function generatePresetButtons() {
  el.presetContainer.innerHTML = '';
  SAMPLE_PRESETS.forEach((preset, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.padding = '8px 12px';
    btn.style.fontSize = '0.85rem';
    btn.innerText = preset.species.replace('Iris-', '') + ` Preset #${idx + 1}`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setFormInputs(preset);
      runPrediction();
      showToast(`${preset.species} Preset Loaded`, 'info');
    });
    el.presetContainer.appendChild(btn);
  });
}

// Populate input sliders with a given data object
function setFormInputs(data) {
  modelMetadata.input_features.forEach(feat => {
    const value = data[feat.name] !== undefined ? data[feat.name] : data[feat.name + 'Cm'];
    if (value !== undefined) {
      const slider = document.getElementById(`slider-${feat.name}`);
      const num = document.getElementById(`num-${feat.name}`);
      const badge = document.getElementById(`val-${feat.name}`);
      
      if (slider && num && badge) {
        slider.value = value;
        num.value = value;
        badge.innerText = `${parseFloat(value).toFixed(1)} cm`;
      }
    }
  });
}

// Run Prediction via Backend API
async function runPrediction() {
  if (!modelMetadata) {
    showToast('Application is not initialized.', 'error');
    return;
  }
  
  // 1. Gather & validate inputs
  const inputs = [];
  let hasErrors = false;
  
  modelMetadata.input_features.forEach(feat => {
    const numInput = document.getElementById(`num-${feat.name}`);
    const val = parseFloat(numInput.value);
    const err = validateInput(val, feat);
    
    const errorDiv = document.getElementById(`error-${feat.name}`);
    if (err && errorDiv) {
      errorDiv.innerText = err;
      errorDiv.style.display = 'block';
      hasErrors = true;
    }
    inputs.push(val);
  });
  
  if (hasErrors) {
    showToast('Please resolve validation errors first', 'error');
    return;
  }
  
  showLoader(true);
  
  try {
    // Send request to Flask backend API
    const payload = {
      sepal_length: inputs[0],
      sepal_width: inputs[1],
      petal_length: inputs[2],
      petal_width: inputs[3]
    };
    
    const response = await fetch('./api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Backend prediction API returned an error.');
    }
    
    const result = await response.json();
    
    // Create prediction report
    currentPrediction = {
      timestamp: new Date().toLocaleTimeString(),
      inputs: {
        sepal_length: inputs[0],
        sepal_width: inputs[1],
        petal_length: inputs[2],
        petal_width: inputs[3]
      },
      prediction: {
        species: result.species,
        confidence: result.confidence,
        probabilities: result.probabilities
      }
    };
    
    // Display results
    renderPredictionResult(currentPrediction);
    
    // Save to Local History
    saveHistory(currentPrediction);
    renderHistory();
    
    showToast(`Inference Complete: ${result.species}`, 'success');
  } catch (error) {
    console.error('Prediction failed:', error);
    showToast('Prediction API request failed.', 'error');
  } finally {
    showLoader(false);
  }
}

// Render Prediction Outcome to the Dashboard Result card
function renderPredictionResult(pred) {
  // Hide placeholder, display prediction card
  el.emptyResult.style.display = 'none';
  el.predictionCard.style.display = 'flex';
  
  const species = pred.prediction.species;
  const confPercent = (pred.prediction.confidence * 100).toFixed(1);
  const detail = SPECIES_DETAILS[species] || { 
    scientificName: species, 
    description: 'No detailed description available.',
    characteristics: [],
    class: 'badge-setosa' 
  };
  
  // Set values
  el.speciesTitle.innerText = species;
  el.speciesSci.innerText = detail.scientificName;
  el.confidenceVal.innerText = `${confPercent}%`;
  el.confidenceBar.style.width = `${confPercent}%`;
  el.speciesDesc.innerText = detail.description;
  el.timestampVal.innerText = pred.timestamp;
  
  // Color configuration
  const specColors = {
    'Iris-setosa': 'var(--setosa-color)',
    'Iris-versicolor': 'var(--versicolor-color)',
    'Iris-virginica': 'var(--virginica-color)'
  };
  const color = specColors[species] || 'var(--primary-color)';
  
  el.confidenceBar.style.backgroundColor = color;
  
  // Apply species badge formatting class
  el.resultBadge.className = 'confidence-badge';
  if (species === 'Iris-setosa') el.resultBadge.classList.add('badge-setosa');
  if (species === 'Iris-versicolor') el.resultBadge.classList.add('badge-versicolor');
  if (species === 'Iris-virginica') el.resultBadge.classList.add('badge-virginica');
  
  // Set characteristics bullet points
  el.speciesDetailsList.innerHTML = '';
  detail.characteristics.forEach(char => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '8px';
    li.style.marginBottom = '6px';
    li.innerHTML = `<span style="color: ${color}; font-weight: bold;">✓</span> <span>${char}</span>`;
    el.speciesDetailsList.appendChild(li);
  });
  
  // Render SVG Flower graphic dynamically based on species
  renderFlowerGraphic(species, color);
  
  // Update Charts probability values
  const metadataClasses = Object.values(modelMetadata.output_classes);
  const chartProbs = metadataClasses.map(className => pred.prediction.probabilities[className] || 0);
  updateProbabilityChart(chartProbs);
  
  // Enable copy and download buttons
  el.copyBtn.disabled = false;
  el.downloadBtn.disabled = false;
}

// Generate customized SVG flowers in response to prediction output
function renderFlowerGraphic(species, color) {
  const container = document.getElementById('flower-illustration');
  if (!container) return;
  
  let svgContent = '';
  
  // Setosa (Short, small petals, pointing up)
  if (species === 'Iris-setosa') {
    svgContent = `
      <svg class="flower-svg-graphic floating-element" viewBox="0 0 100 100">
        <!-- Stem -->
        <path d="M50,95 Q50,70 50,55" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M50,75 Q38,70 34,62" stroke="#059669" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M50,80 Q62,76 66,68" stroke="#059669" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Leaves -->
        <path d="M34,62 Q25,60 30,55 Q35,55 34,62 Z" fill="#10b981"/>
        <path d="M66,68 Q75,66 70,61 Q65,61 66,68 Z" fill="#10b981"/>
        <!-- Petals Setosa -->
        <circle cx="50" cy="55" r="5" fill="#f59e0b"/>
        <!-- Outer Sepals -->
        <path d="M50,55 C25,40 20,15 42,25 C50,28 50,45 50,55 Z" fill="${color}" opacity="0.85"/>
        <path d="M50,55 C75,40 80,15 58,25 C50,28 50,45 50,55 Z" fill="${color}" opacity="0.85"/>
        <path d="M50,55 C50,80 30,85 45,68 C48,64 49,58 50,55 Z" fill="${color}" opacity="0.85"/>
        <path d="M50,55 C50,80 70,85 55,68 C52,64 51,58 50,55 Z" fill="${color}" opacity="0.85"/>
        <!-- Standards (Petals pointing up) -->
        <path d="M50,55 C42,35 44,15 50,10 C56,15 58,35 50,55 Z" fill="#c084fc" opacity="0.95"/>
        <path d="M50,55 C38,42 35,28 45,24 C50,22 50,45 50,55 Z" fill="#c084fc" opacity="0.9"/>
        <path d="M50,55 C62,42 65,28 55,24 C50,22 50,45 50,55 Z" fill="#c084fc" opacity="0.9"/>
      </svg>
    `;
  }
  // Versicolor (Moderate petals, yellows guide lines)
  else if (species === 'Iris-versicolor') {
    svgContent = `
      <svg class="flower-svg-graphic floating-element" viewBox="0 0 100 100">
        <!-- Stem -->
        <path d="M50,95 Q52,70 50,55" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M51,70 Q60,65 62,56" stroke="#059669" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Leaves -->
        <path d="M62,56 Q72,50 64,46 Q58,48 62,56 Z" fill="#10b981"/>
        <!-- Outer Sepals (falling down with yellow highlights) -->
        <path d="M50,55 C20,50 15,80 32,75 C45,71 48,60 50,55 Z" fill="${color}"/>
        <path d="M50,55 C80,50 85,80 68,75 C55,71 52,60 50,55 Z" fill="${color}"/>
        <!-- Yellow nectar guides -->
        <path d="M50,55 C36,53 32,66 38,65" stroke="#fbbf24" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M50,55 C64,53 68,66 62,65" stroke="#fbbf24" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Standards (pointing up and out) -->
        <path d="M50,55 C35,32 38,12 50,22 C62,12 65,32 50,55 Z" fill="${color}" opacity="0.85"/>
        <path d="M50,55 C45,30 25,25 35,15 C45,15 48,40 50,55 Z" fill="#a78bfa" opacity="0.9"/>
        <path d="M50,55 C55,30 75,25 65,15 C55,15 52,40 50,55 Z" fill="#a78bfa" opacity="0.9"/>
      </svg>
    `;
  }
  // Virginica (Large drooping petals, tall structure)
  else {
    svgContent = `
      <svg class="flower-svg-graphic floating-element" viewBox="0 0 100 100">
        <!-- Stem -->
        <path d="M50,95 Q48,65 50,45" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M49,65 Q38,58 35,46" stroke="#059669" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Leaves -->
        <path d="M35,46 Q22,40 28,34 Q36,36 35,46 Z" fill="#10b981"/>
        <!-- Heavy Drooping Sepals -->
        <path d="M50,45 C15,45 10,85 30,88 C46,90 48,58 50,45 Z" fill="${color}"/>
        <path d="M50,45 C85,45 90,85 70,88 C54,90 52,58 50,45 Z" fill="${color}"/>
        <!-- Yellow nectar guides -->
        <path d="M50,45 C32,45 25,65 30,70" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
        <path d="M50,45 C68,45 75,65 70,70" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
        <!-- Large Standards (Pointing upward) -->
        <path d="M50,45 C40,20 40,5 50,2 C60,5 60,20 50,45 Z" fill="${color}" opacity="0.9"/>
        <path d="M50,45 C30,30 25,12 38,8 C46,8 48,32 50,45 Z" fill="${color}" opacity="0.85"/>
        <path d="M50,45 C70,30 75,12 62,8 C54,8 52,32 50,45 Z" fill="${color}" opacity="0.85"/>
      </svg>
    `;
  }
  
  container.innerHTML = svgContent;
}

// Render Prediction History records
function renderHistory() {
  const history = loadHistory();
  el.historyList.innerHTML = '';
  
  if (history.length === 0) {
    el.historyList.innerHTML = `<tr><td colspan="6" class="history-empty">No prediction records available. Complete a prediction above.</td></tr>`;
    el.clearHistoryBtn.disabled = true;
    return;
  }
  
  el.clearHistoryBtn.disabled = false;
  
  history.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'history-row hover-grow';
    tr.style.cursor = 'pointer';
    
    const species = item.prediction.species;
    const confPercent = (item.prediction.confidence * 100).toFixed(1);
    
    // Add columns
    tr.innerHTML = `
      <td style="font-family: var(--font-title); font-weight: 600;">${item.timestamp}</td>
      <td style="text-align: center;">${item.inputs.sepal_length}</td>
      <td style="text-align: center;">${item.inputs.sepal_width}</td>
      <td style="text-align: center;">${item.inputs.petal_length}</td>
      <td style="text-align: center;">${item.inputs.petal_width}</td>
      <td>
        <span style="font-weight: 700; color: ${
          species === 'Iris-setosa' ? 'var(--setosa-color)' :
          species === 'Iris-versicolor' ? 'var(--versicolor-color)' : 'var(--virginica-color)'
        }">${species}</span>
        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 4px;">(${confPercent}%)</span>
      </td>
    `;
    
    // Bind click to reload inputs
    tr.addEventListener('click', () => {
      setFormInputs(item.inputs);
      renderPredictionResult(item);
      showToast('Loaded prediction details from history', 'info');
    });
    
    el.historyList.appendChild(tr);
  });
}

// Bind Action buttons listeners
function setupListeners() {
  // Predict click
  el.predictionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runPrediction();
  });
  
  // Reset Form
  el.resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    el.predictionForm.reset();
    
    // Sync badge text
    modelMetadata.input_features.forEach(feat => {
      const slider = document.getElementById(`slider-${feat.name}`);
      const badge = document.getElementById(`val-${feat.name}`);
      const errorDiv = document.getElementById(`error-${feat.name}`);
      
      if (slider && badge) {
        badge.innerText = `${parseFloat(slider.value).toFixed(1)} cm`;
      }
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    });
    
    // Hide prediction result card and clear charts
    el.emptyResult.style.display = 'flex';
    el.predictionCard.style.display = 'none';
    updateProbabilityChart([0, 0, 0]);
    el.copyBtn.disabled = true;
    el.downloadBtn.disabled = true;
    currentPrediction = null;
    
    showToast('Form Reset Successful', 'info');
  });
  
  // Random values sample button
  el.randomBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const randomVals = generateRandomInputs(modelMetadata.input_features);
    setFormInputs(randomVals);
    runPrediction();
  });
  
  // Copy to clipboard prediction outputs
  el.copyBtn.addEventListener('click', async () => {
    if (!currentPrediction) return;
    const txt = `Iris Flower Prediction Report
Timestamp: ${currentPrediction.timestamp}
Inputs:
  - Sepal Length: ${currentPrediction.inputs.sepal_length} cm
  - Sepal Width:  ${currentPrediction.inputs.sepal_width} cm
  - Petal Length: ${currentPrediction.inputs.petal_length} cm
  - Petal Width:  ${currentPrediction.inputs.petal_width} cm
Prediction:
  - Selected Species: ${currentPrediction.prediction.species}
  - Inference Confidence: ${(currentPrediction.prediction.confidence * 100).toFixed(1)}%
Model:
  - Algorithm: ${modelMetadata.algorithm} (Local ONNX browser inference)`;
    
    const ok = await copyToClipboard(txt);
    if (ok) showToast('Prediction Copied to Clipboard', 'success');
  });
  
  // Download report as JSON
  el.downloadBtn.addEventListener('click', () => {
    if (!currentPrediction) return;
    const filename = `iris_prediction_${Date.now()}.json`;
    downloadJSON(currentPrediction, filename);
    showToast('Report Downloaded successfully', 'success');
  });
  
  // Delete History
  el.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your prediction history?')) {
      clearHistory();
      renderHistory();
      showToast('History Cleared', 'success');
    }
  });

  // Track mouse coordinates for interactive card gradient lighting (glowing effect)
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glow-hover');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: Predict
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runPrediction();
    }
    // Ctrl + R: Random Sample
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      const randomVals = generateRandomInputs(modelMetadata.input_features);
      setFormInputs(randomVals);
      runPrediction();
    }
  });
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
  initElements();
  init();
  setupListeners();
});
