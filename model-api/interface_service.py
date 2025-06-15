from flask import Flask, request, jsonify
import torch
from torch import nn
from transformers import AutoTokenizer, AutoModel
import re
import numpy as np

app = Flask(__name__)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# === Emotion Labels ===
EMOTIONS = [
    "sadness", "anger", "fear", "shame", "guilt", "loneliness", "confusion",
    "joy", "love", "hope", "pride", "relief"
]

# === Mood Model ===
class MoodBert(nn.Module):
    def __init__(self):
        super().__init__()
        self.bert = AutoModel.from_pretrained("bert-base-uncased")
        self.dropout = nn.Dropout(0.3)
        self.mood_head = nn.Linear(self.bert.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        pooled = self.dropout(self.bert(input_ids=input_ids, attention_mask=attention_mask).pooler_output)
        return torch.sigmoid(self.mood_head(pooled)) * 4 + 1

mood_model = MoodBert().to(device)
mood_model.load_state_dict(torch.load("models/mood_model.pt", map_location=device))
mood_model.eval()

def predict_mood_single(sentence):
    inputs = tokenizer(sentence, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        return round(mood_model(inputs['input_ids'], inputs['attention_mask']).squeeze().item(), 2)

# === Risk Model ===
class RiskBert(nn.Module):
    def __init__(self):
        super().__init__()
        self.bert = AutoModel.from_pretrained("bert-base-uncased")
        self.dropout = nn.Dropout(0.3)
        self.risk_head = nn.Linear(self.bert.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        pooled = self.dropout(self.bert(input_ids=input_ids, attention_mask=attention_mask).pooler_output)
        return torch.sigmoid(self.risk_head(pooled))  # 0 to 1

risk_model = RiskBert().to(device)
risk_model.load_state_dict(torch.load("models/risk_model.pt", map_location=device))
risk_model.eval()

def predict_risk_single(sentence):
    inputs = tokenizer(sentence, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        return round(risk_model(inputs['input_ids'], inputs['attention_mask']).squeeze().item(), 4)

# === Emotion Model ===
class EmotionBert(nn.Module):
    def __init__(self):
        super().__init__()
        self.bert = AutoModel.from_pretrained("bert-base-uncased")
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.bert.config.hidden_size, len(EMOTIONS))

    def forward(self, input_ids, attention_mask):
        pooled = self.dropout(self.bert(input_ids=input_ids, attention_mask=attention_mask).pooler_output)
        return torch.sigmoid(self.classifier(pooled))

emotion_model = EmotionBert().to(device)
emotion_model.load_state_dict(torch.load("models/emotion_model.pt", map_location=device))
emotion_model.eval()

def predict_emotion_single(sentence, threshold=0.5):
    inputs = tokenizer(sentence, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        probs = emotion_model(inputs["input_ids"], inputs["attention_mask"]).squeeze().cpu().numpy()
    scores = {EMOTIONS[i]: round(float(p), 3) for i, p in enumerate(probs)}
    predicted = [emo for emo, score in scores.items() if score > threshold]
    return scores, predicted

# === Paragraph Utils ===
def split_sentences(paragraph):
    return [s for s in re.split(r'(?<=[.!?])\s+', paragraph.strip()) if s]

def analyze_paragraph_mood(moods):
    moods = np.array(moods)
    centered = moods - 3.0
    mean_polarity = np.mean(centered)
    mood_strength = np.sqrt(np.mean(centered ** 2))
    signed_strength = np.sign(mean_polarity) * mood_strength
    return {
        "mean_polarity": round(mean_polarity, 4),
        "mood_strength": round(mood_strength, 4),
        "signed_strength": round(signed_strength, 4)
    }

def paragraph_to_mood_stats(paragraph):
    sentences = split_sentences(paragraph)
    moods = [predict_mood_single(s) for s in sentences]
    stats = analyze_paragraph_mood(moods)
    return {
        "sentences": sentences,
        "moods": moods,
        **stats
    }

def analyze_paragraph_risk(risks):
    risks = np.array(risks)
    mean_risk = np.mean(risks)
    std_risk = np.std(risks)
    max_risk = np.max(risks)
    min_risk = np.min(risks)
    return {
        "mean_risk": round(mean_risk, 4),
        "std_risk": round(std_risk, 4),
        "max_risk": round(max_risk, 4),
        "min_risk": round(min_risk, 4)
    }

def paragraph_to_risk_stats(paragraph):
    sentences = split_sentences(paragraph)
    risk_scores = [predict_risk_single(s) for s in sentences]
    stats = analyze_paragraph_risk(risk_scores)
    return {
        "sentences": sentences,
        "risk_scores": risk_scores,
        **stats
    }

def paragraph_to_emotion_stats(paragraph, threshold=0.5):
    sentences = split_sentences(paragraph)
    results = []

    for s in sentences:
        inputs = tokenizer(s, return_tensors="pt", truncation=True, padding=True).to(device)
        with torch.no_grad():
            probs = emotion_model(inputs["input_ids"], inputs["attention_mask"]).squeeze().cpu().numpy()
        emotion_scores = {EMOTIONS[i]: round(float(probs[i]), 3) for i in range(len(EMOTIONS))}
        predicted = [emo for emo, score in emotion_scores.items() if score >= threshold]
        results.append({
            "sentence": s,
            "emotion_scores": emotion_scores,
            "predicted_emotions": predicted
        })

    return {"per_sentence": results}

# === Flask API ===
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if "text" in data:
        text = data["text"].strip()
        mood = predict_mood_single(text)
        risk = predict_risk_single(text)
        emotion_scores, emotion_labels = predict_emotion_single(text)
        return jsonify({
            "mood_score": mood,
            "risk_score": risk,
            "emotion_scores": emotion_scores,
            "predicted_emotions": emotion_labels
        })

    elif "paragraph" in data:
        paragraph = data["paragraph"].strip()
        if not paragraph:
            return jsonify({"error": "No paragraph provided"})

        mood_stats = paragraph_to_mood_stats(paragraph)
        risk_stats = paragraph_to_risk_stats(paragraph)
        emotion_stats = paragraph_to_emotion_stats(paragraph)

        return jsonify({
            "mood": mood_stats,
            "risk": risk_stats,
            "emotion": emotion_stats
        })

    return jsonify({"error": "No text or paragraph provided"})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
