# 🐍 Snake Risk Analyzer

A classic Snake game with a twist — this version uses gameplay telemetry and an LLM to analyze how **risky** your playstyle is. Are you a cautious strategist or a reckless snake god?

## 🎮 Live Demo
Play it here (password-protected):  
**🔗 https://snakellm.onrender.com/Password
(Send me an email for the password)

---

## 💡 How It Works

- Built with **JavaScript + HTML Canvas** for smooth, responsive gameplay
- Tracks player behavior:
  - Unnecessary turns
  - Wall proximity
  - Risky movements near the snake's own body
  - Decision-making speed
- Sends this telemetry to a **Flask backend**
- The backend uses **OpenAI’s GPT** to analyze your playstyle and return a risk profile
- Displays a **risk meter** and a custom summary at the end of the game

---

## 🧠 Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- LLM: OpenAI API
- Hosting: Render

---

## 🚀 Getting Started (for developers)

```bash
git clone https://github.com/yourusername/snake-risk-analyzer.git
cd snake-risk-analyzer
pip install -r requirements.txt
export OPENAI_API_KEY=your-key-here
export PASSWORD=MYMCATAI
export SESSION_SECRET=anything-random
python app.py