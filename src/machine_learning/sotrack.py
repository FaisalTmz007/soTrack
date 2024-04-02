from flask import Flask, request, jsonify
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from dotenv import load_dotenv

app = Flask(__name__)

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

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    headline = data['headline']
    text = m.transform([headline]).toarray()
    prediction = model.predict(text)[0]
    return jsonify({'prediction': prediction})

# Error analysis
@app.route('/error-analysis')
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
