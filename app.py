import os
import json
import logging
from flask import Flask, render_template, request, jsonify, abort

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
PASSWORD = os.getenv("PASSWORD")

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong", "status": "ok"})

@app.route('/')
def index():
    token = request.headers.get("X-ACCESS-TOKEN")
    if token != PASSWORD:
        abort(403)

    """Render the main game page"""
    return render_template('index.html')

@app.route('/analyze_gameplay', methods=['POST'])
def analyze_gameplay():
    """
    Process gameplay metrics and generate a risk profile using OpenAI
    """
    token = request.headers.get("X-ACCESS-TOKEN")
    if token != PASSWORD:
        abort(403)


    try:
        # Get gameplay metrics from the request
        gameplay_data = request.json
        logging.debug(f"Received gameplay data: {gameplay_data}")
        
        # Process the gameplay metrics
        metrics = gameplay_data.get('metrics', {})
        
        # Calculate a risk score manually first
        score = metrics.get('score', 0)
        game_duration = metrics.get('gameDuration', 0)
        unnecessary_turns = metrics.get('unnecessaryTurns', 0)
        wall_proximity = metrics.get('wallProximityPercentage', 0)
        risky_movements = metrics.get('riskyBodyMovements', 0)
        near_misses = metrics.get('nearMisses', 0)
        avg_decision_time = metrics.get('avgDecisionTime', 0)
        
        # Calculate normalized metrics based on game duration and other factors
        turns_per_minute = 0 if game_duration == 0 else (unnecessary_turns / game_duration) * 60
        movements_per_second = 0 if game_duration == 0 else risky_movements / game_duration
        
        # Calculate risk score components
        turn_factor = min(100, turns_per_minute * 2)
        wall_factor = min(100, wall_proximity * 1.2)
        movement_factor = min(100, movements_per_second * 10)
        miss_factor = min(100, near_misses * 5)
        decision_factor = 0
        if avg_decision_time > 0:
            # Faster decisions under 250ms or very slow decisions over 1000ms might be risky
            if avg_decision_time < 250:
                decision_factor = 70
            elif avg_decision_time > 1000:
                decision_factor = 60
            else:
                decision_factor = 30
        
        # Weighted risk score
        calculated_risk_score = (
            turn_factor * 0.2 +
            wall_factor * 0.25 +
            movement_factor * 0.3 +
            miss_factor * 0.15 +
            decision_factor * 0.1
        )
        
        # Round to nearest integer
        risk_score = round(calculated_risk_score)
        
        # Determine risk profile based on score
        risk_profile = "Cautious"
        if risk_score > 33 and risk_score <= 66:
            risk_profile = "Average"
        elif risk_score > 66:
            risk_profile = "Reckless"
        
        # Create a prompt for OpenAI with our calculated score as a guide
        prompt = f"""
        Analyze the following Snake game player metrics and create a risk profile:
        
        - Game Score: {score}
        - Game Duration (seconds): {game_duration}
        - Unnecessary Turns: {unnecessary_turns}
        - Wall Proximity Time (percentage): {wall_proximity}
        - Risky Body Movements: {risky_movements}
        - Near Misses: {near_misses}
        - Average Decision Time (ms): {avg_decision_time}
        
        Based on these metrics, the player has been given a risk score of {risk_score} out of 100.

        If the score is 0-33, classify the player as "Cautious".
        If the score is 34-66, classify the player as "Average".
        If the score is 67-100, classify the player as "Reckless".
        
        Return your analysis in JSON format with these fields:
        - riskScore: {risk_score} (use this exact number)
        - riskProfile: string ("{risk_profile}" - use this exact classification)
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
