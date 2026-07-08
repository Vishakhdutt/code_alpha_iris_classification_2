/**
 * Show a floating Toast Notification
 * @param {string} message 
 * @param {'info' | 'success' | 'warning' | 'error'} type 
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon select based on type
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

/**
 * Validate numeric inputs against defined metadata limits
 * @param {number} val 
 * @param {object} bounds {min, max, displayName}
 * @returns {string|null} Error message or null if valid
 */
export function validateInput(val, bounds) {
  if (val === undefined || val === null || isNaN(val)) {
    return `${bounds.displayName} is required and must be a number.`;
  }
  if (val < bounds.min || val > bounds.max) {
    return `${bounds.displayName} must be between ${bounds.min} and ${bounds.max} cm.`;
  }
  return null;
}

/**
 * Load Prediction History from LocalStorage
 * @returns {Array} List of historical prediction items
 */
export function loadHistory() {
  try {
    const history = localStorage.getItem('iris_prediction_history');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Failed to load prediction history', e);
    return [];
  }
}

/**
 * Save a new prediction to LocalStorage History (limit to 10 items)
 * @param {object} item 
 */
export function saveHistory(item) {
  try {
    const history = loadHistory();
    history.unshift(item);
    // Limit to 10 entries
    if (history.length > 10) history.pop();
    localStorage.setItem('iris_prediction_history', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save prediction history', e);
  }
}

/**
 * Clear LocalStorage History
 */
export function clearHistory() {
  localStorage.removeItem('iris_prediction_history');
}

/**
 * Copy text to clipboard
 * @param {string} text 
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

/**
 * Download object as JSON file
 * @param {object} obj 
 * @param {string} filename 
 */
export function downloadJSON(obj, filename) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Predefined Iris flower samples for demonstration
 */
export const SAMPLE_PRESETS = [
  { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: "Iris-setosa" },
  { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: "Iris-setosa" },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5, species: "Iris-versicolor" },
  { sepal_length: 5.7, sepal_width: 2.8, petal_length: 4.1, petal_width: 1.3, species: "Iris-versicolor" },
  { sepal_length: 7.2, sepal_width: 3.6, petal_length: 6.1, petal_width: 2.5, species: "Iris-virginica" },
  { sepal_length: 6.3, sepal_width: 3.4, petal_length: 5.6, petal_width: 2.4, species: "Iris-virginica" }
];

/**
 * Generate a random input dataset within valid range
 * @param {Array} inputFeatures 
 * @returns {object} Map of feature name to random value
 */
export function generateRandomInputs(inputFeatures) {
  const inputs = {};
  inputFeatures.forEach(feature => {
    // Generate value between min and max, rounded to 1 decimal place
    const val = feature.min + Math.random() * (feature.max - feature.min);
    inputs[feature.name] = Math.round(val * 10) / 10;
  });
  return inputs;
}
