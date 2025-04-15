import os
import json
import logging
from flask import Flask, render_template, request, jsonify

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

@app.route('/')
def index():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/analyze_gameplay', methods=['POST'])
def analyze_gameplay():
    """
    Process gameplay metrics and generate a risk profile using OpenAI
    """
    try:
        # Get gameplay metrics from the request
        gameplay_data = request.json
        logging.debug(f"Received gameplay data: {gameplay_data}")
        
        # Process the gameplay metrics
        metrics = gameplay_data.get('metrics', {})
        
        # Create a prompt for OpenAI
        prompt = f"""
        Analyze the following Snake game player metrics and create a risk profile:
        
        - Game Score: {metrics.get('score', 0)}
        - Game Duration (seconds): {metrics.get('gameDuration', 0)}
        - Unnecessary Turns: {metrics.get('unnecessaryTurns', 0)}
        - Wall Proximity Time (percentage): {metrics.get('wallProximityPercentage', 0)}
        - Risky Body Movements: {metrics.get('riskyBodyMovements', 0)}
        - Near Misses: {metrics.get('nearMisses', 0)}
        - Average Decision Time (ms): {metrics.get('avgDecisionTime', 0)}
        
        Based on these metrics, determine if the player's style is cautious, average, or reckless.
        Provide a risk score from 0 to 100 (higher means more risky).
        
        Return your analysis in JSON format with these fields:
        - riskScore: number between 0 and 100
        - riskProfile: string ("Cautious", "Average", or "Reckless")
        - analysis: a detailed paragraph explaining the risk assessment
        """
        
        # Call OpenAI API for risk analysis
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert game analyst who specializes in analyzing player behavior and risk profiles."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Extract and return the analysis
        analysis_result = json.loads(response.choices[0].message.content)
        logging.debug(f"OpenAI analysis: {analysis_result}")
        
        return jsonify({
            "success": True,
            "riskProfile": analysis_result
        })
        
    except Exception as e:
        logging.error(f"Error in analyze_gameplay: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
