import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import joblib

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "Iris.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)
BEST_MODEL_PATH = os.path.join(MODEL_DIR, "best_model.joblib")

print("--- Step 1: Loading Dataset ---")
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)
print(f"Dataset loaded successfully. Shape: {df.shape}")

# EDA Summary
print("\n--- Exploratory Data Analysis Summary ---")
print("Columns:", df.columns.tolist())
print(df.info())
print("\nClass distribution:")
print(df['Species'].value_counts())

# Preprocessing
print("\n--- Preprocessing Data ---")
# Drop Id column
if 'Id' in df.columns:
    df = df.drop('Id', axis=1)

X = df.drop('Species', axis=1)
y = df['Species']

# Map string labels to integers
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
classes_map = {int(i): str(name) for i, name in enumerate(label_encoder.classes_)}
print("Classes Mapping:", classes_map)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
print(f"Training set: {X_train.shape[0]} samples, Testing set: {X_test.shape[0]} samples")

# Models to compare
models = {
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
    "Logistic Regression": LogisticRegression(max_iter=200, random_state=42),
    "Support Vector Machine": SVC(probability=True, random_state=42),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5)
}

results = {}

print("\n--- Training and Evaluating Models ---")
for name, model in models.items():
    # Cross validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5)
    mean_cv = np.mean(cv_scores)
    
    # Train
    model.fit(X_train, y_train)
    
    # Predict
    y_pred = model.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    
    # Metrics
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')
    cm = confusion_matrix(y_test, y_pred)
    
    results[name] = {
        "model": model,
        "cv_accuracy": float(mean_cv),
        "test_accuracy": float(test_acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist()
    }
    
    print(f"\n{name}:")
    print(f"  5-Fold CV Accuracy: {mean_cv:.4f}")
    print(f"  Test Accuracy:     {test_acc:.4f}")
    print(f"  Precision (macro):  {precision:.4f}")
    print(f"  Recall (macro):     {recall:.4f}")
    print(f"  F1 Score (macro):   {f1:.4f}")

# Select best model
best_name = max(results, key=lambda k: results[k]["test_accuracy"])
best_model_info = results[best_name]
print(f"\n---> Best Model Selected: {best_name} (Test Accuracy: {best_model_info['test_accuracy']:.4f})")

# Save the best model
joblib.dump(best_model_info["model"], BEST_MODEL_PATH)
print(f"Saved best model to {BEST_MODEL_PATH}")

# Save comparison data for conversion step
comparison_data = {
    "best_algorithm": best_name,
    "classes": classes_map,
    "feature_names": X.columns.tolist(),
    "dataset_info": {
        "total_samples": int(len(df)),
        "num_features": int(X.shape[1]),
        "num_classes": int(len(label_encoder.classes_)),
        "class_distribution": df['Species'].value_counts().to_dict()
    },
    "comparison": {
        name: {
            "cv_accuracy": info["cv_accuracy"],
            "test_accuracy": info["test_accuracy"],
            "precision": info["precision"],
            "recall": info["recall"],
            "f1_score": info["f1_score"]
        } for name, info in results.items()
    },
    "best_model_metrics": {
        "cv_accuracy": best_model_info["cv_accuracy"],
        "test_accuracy": best_model_info["test_accuracy"],
        "precision": best_model_info["precision"],
        "recall": best_model_info["recall"],
        "f1_score": best_model_info["f1_score"],
        "confusion_matrix": best_model_info["confusion_matrix"]
    }
}

joblib.dump(comparison_data, os.path.join(MODEL_DIR, "comparison_data.joblib"))
print("Saved model comparison and metadata workspace data.")
