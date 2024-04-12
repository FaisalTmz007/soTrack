from flask import Flask, request, jsonify
import os
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import nltk
nltk.download('punkt')
nltk.download('wordnet')
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from dotenv import load_dotenv

app = Flask(__name__)

# Lower casing, removing punctuation, and whitespace
def preprocess_text(text):
    emoji_pattern = re.compile("["
          u"\U0001F600-\U0001F64F"  # emoticons
          u"\U0001F300-\U0001F5FF"  # symbols & pictographs
          u"\U0001F680-\U0001F6FF"  # transport & map symbols
          u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                            "]+", flags=re.UNICODE)
    
    # Remove emojis
    text = emoji_pattern.sub(r'', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Strip leading and trailing whitespace
    text = text.strip()
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuations
    punctuations = '''!()-[]{};:'"\,<>./?@#$%^&*_~'''
    for x in text:
        if x in punctuations:
            text = text.replace(x, "")
    
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = word_tokenize(text)
    filtered_tokens = [word for word in tokens if word not in stop_words]
    
    # Stemming
    stemmer = PorterStemmer()
    stemmed_tokens = [stemmer.stem(word) for word in filtered_tokens]
    
    # Lemmatization
    lemmatizer = WordNetLemmatizer()
    lemmatized_tokens = [lemmatizer.lemmatize(word) for word in stemmed_tokens]

    # Join tokens back into a single string
    text = " ".join(lemmatized_tokens)

    return text

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
    headline = preprocess_text(headline)
    text = m.transform([headline]).toarray()
    prediction = model.predict(text)[0]
    return jsonify({'prediction': prediction, 'headline': headline})

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
