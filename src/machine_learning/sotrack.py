from flask import Flask, request, jsonify
import os
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from dotenv import load_dotenv

app = Flask(__name__)

def preprocess_text(text):
    # Remove emojis
    text = re.sub(r'[^\w\s,]', '', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Strip leading and trailing whitespace
    text = text.strip()
    
    # Convert to lowercase
    text = text.lower()
    
    # Tokenize text
    tokens = word_tokenize(text)
    
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    filtered_tokens = [word for word in tokens if word not in stop_words]
    
    # Lemmatization
    lemmatizer = WordNetLemmatizer()
    lemmatized_tokens = [lemmatizer.lemmatize(word) for word in filtered_tokens]
    
    # Join tokens back into a single string
    text = " ".join(lemmatized_tokens)

    return text

def categorize_sentiment(score):
    if score > 0.5:
        return "Positive"
    else:
        return "Negative"

data = pd.read_csv('type_of_crime_data.csv')

fig = plt.figure(figsize=(15, 9))
sns.barplot(x=data['type'].value_counts().values, y=data['type'].value_counts().index)

df = data[['headline', 'type']]

x = np.array(df['headline'])
y = np.array(df['type'])

m = CountVectorizer()
x = m.fit_transform(x)

xtrain, xtest, ytrain, ytest = train_test_split(x, y, test_size=0.20)

model = MultinomialNB()
model.fit(xtrain, ytrain)

@app.route('/ml')
def index():
    return jsonify({'message': 'Welcome to the machine learning API!'})

@app.route('/ml/predict', methods=['POST'])
def predict():
    data = request.get_json()
    headline = data['headline']
    processed_text = preprocess_text(headline)
    text = m.transform([processed_text]).toarray()
    prediction = model.predict(text)[0]
    return jsonify({'prediction': prediction, 'headline': headline, 'processed_text': processed_text})

@app.route('/ml/sentiment', methods=['POST'])
def sentiment():
    data = request.get_json()
    headlines = data['headlines']
    
    sentiments = []
    for headline in headlines:
        processed_text = preprocess_text(headline)
        sa = SentimentIntensityAnalyzer()
        dd = sa.polarity_scores(processed_text)
        compound = round((1 + dd['compound']) / 2, 2)
        sentiment_category = categorize_sentiment(compound)
        
        sentiments.append({
            'headline': headline,
            'processed_text': processed_text,
            'category': sentiment_category,
            'compound': compound
        })
    
    return jsonify({'sentiments': sentiments})


# Error analysis
@app.route('/ml/error-analysis')
def error_analysis():
    misclassified_examples = []

    for i in range(len(xtest)):
        headline = xtest[i]
        true_label = ytest[i]
        predicted_label = model.predict([headline])[0]

        if true_label != predicted_label:
            misclassified_examples.append({
                'headline': m.inverse_transform(headline)[0],
                'true_label': true_label,
                'predicted_label': predicted_label
            })

    return jsonify({'misclassified_examples': misclassified_examples})

if __name__ == '__main__':
    dotenv_path = './.env'
    load_dotenv(dotenv_path)
    PORT = os.getenv('PORT') or 5000
    app.run(debug=True, port=PORT)
