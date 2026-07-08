# Iris Flower Classification AI Web App (Local Browser Inference)

A premium, production-quality, fully static AI-powered web application that predicts the species of Iris flowers entirely inside the user's browser. Powered by **ONNX Runtime Web**, **Chart.js**, and **Scikit-learn**, it executes client-side inference locally without requiring a backend server or external API calls.

## 🌟 Key Features

* **Local Browser Inference**: Runs prediction models in the browser using ONNX Runtime Web.
* **Trained Multi-Model Comparison**: Evaluated Random Forest, Logistic Regression, Decision Tree, Support Vector Machine, and K-Nearest Neighbors in Python. Automatically selected the champion model (K-Nearest Neighbors, **100% Test Accuracy**).
* **Interactive Visualizations**: Powered by Chart.js:
  * Dynamic probability distribution updates on prediction.
  * Model feature importance graph.
  * Accuracies and cross-validation score comparison across classifiers.
* **Premium Glassmorphic UI**: High-fidelity theme offering:
  * Full dark & light mode support with settings persistence.
  * Soft shadows, blur overlays, and responsive mobile-first layouts.
  * Swaying dynamic SVG flower illustrations custom-colored to match predicted species.
* **Utility Features**:
  * Copy report to clipboard & download output as JSON.
  * Local Storage Prediction History (stores and reloads last 10 predictions).
  * Random sample data generator and preset examples.
  * Input range validations with real-time UI warnings.
  * Full keyboard shortcuts (`Ctrl + Enter` to predict, `Ctrl + R` for random samples).

---

## 📁 Project Structure

```
iris-classifier/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD Action
├── css/
│   └── animations.css          # CSS keyframe micro-animations
├── js/
│   ├── charts.js               # Chart.js initialization and updates
│   └── utils.js                # Validation, clipboard, LocalStorage helpers
├── model/
│   ├── best_model.joblib       # Serialized Python scikit-learn model
│   ├── comparison_data.joblib  # Metrics for model benchmark comparisons
│   ├── metadata.json           # Model info, evaluation metrics & class maps
│   └── model.onnx              # Exported ONNX model used in JavaScript
├── app.js                      # Core orchestrator and event listener binding
├── convert_to_onnx.py          # ONNX conversion and metadata generation script
├── index.html                  # Main static HTML5 page
├── LICENSE                     # MIT License
├── README.md                   # Documentation guide
├── requirements.txt            # Python dependencies checklist
├── style.css                   # Premium CSS design styles
└── train_model.py              # Model training, comparison and selection script
```

---

## 🚀 Running Locally (Static Server)

No compilation or complex build step is needed for the frontend. Simply host it using a basic local web server:

### Option 1: Python HTTP Server (Recommended)
Open your terminal inside the `iris-classifier/` directory and run:
```bash
python -m http.server 8000
```
Then open your browser and navigate to: `http://localhost:8000`

### Option 2: Node.js (http-server)
If you have npm installed, run:
```bash
npx http-server ./
```

---

## 🐍 Model Training & Conversion (Python)

If you wish to retrain the classifiers or re-export the ONNX models:

### 1. Install Dependencies
Ensure you have Python 3.8+ installed, then install packages:
```bash
pip install -r requirements.txt
```

### 2. Train and Select Champion Model
Run the classifier evaluation:
```bash
python train_model.py
```
This loads `Iris.csv`, trains 5 models, selects the highest performing model (in this case, KNN), and stores it to `model/best_model.joblib`.

### 3. Convert to ONNX Format
Convert the serialized model and output frontend configuration details:
```bash
python convert_to_onnx.py
```
This writes `model/model.onnx` and `model/metadata.json` mapping parameters (such as feature importance and evaluation metrics) for Chart.js rendering.

---

## ☁️ Deployment on GitHub Pages

This project is fully ready for zero-cost static hosting platforms.

To deploy on **GitHub Pages**:
1. Push this repository to GitHub.
2. In your repository settings:
   * Go to **Settings > Pages**.
   * Under **Build and deployment**, select **GitHub Actions** as the source.
3. The included workflow `.github/workflows/deploy.yml` will automatically build and deploy the `iris-classifier` subfolder when pushes land on the `main` branch.

---

## 🛠️ Technologies Used

* **Frontend**: HTML5, CSS3 (variables, grid/flex, glassmorphism), Vanilla ES6 JavaScript modules.
* **Machine Learning**: Scikit-learn (classifiers & metrics), Joblib, ONNX, Skl2onnx converter.
* **Inference**: ONNX Runtime Web.
* **Visualization**: Chart.js.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
