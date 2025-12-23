# Galaw Pinoy - Physical Education Website

A digital advocacy platform that promotes health and fitness by transforming traditional Filipino games (Laro ng Lahi) into interactive physical activities using modern web technology.

## Features

- **Interactive Games**: Virtual versions of traditional Filipino games using webcam-based motion detection
  - Virtual Luksong Tinik (flexibility and coordination)
  - Virtual Patintero (agility and reaction time)
- **Educational Content**: Information about traditional Filipino games and their health benefits
- **Reflection System**: Users can submit reflections about their fitness journey
- **Admin Dashboard**: For viewing submitted reflections
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Pose Detection**: TensorFlow.js with MoveNet model
- **Backend**: Firebase Firestore for data storage
- **Styling**: Custom CSS with modern design system

## Project Structure

```
├── index.html              # Home page
├── about.html              # About the advocacy
├── play.html               # Game selection page
├── laro.html               # Traditional games overview
├── health.html             # Health benefits
├── proof.html              # Documentation
├── join.html               # Reflection submission
├── admin/dashboard.html    # Admin panel
├── css/style.css           # Main stylesheet
├── js/
│   ├── firebase.js         # Firebase configuration
│   ├── luksong-tinik.js    # Virtual Luksong Tinik game
│   ├── patintero.js        # Virtual Patintero game
│   ├── submitProof.js      # Reflection submission
│   └── admin.js            # Admin dashboard logic
└── firebase.json           # Firebase hosting config
```

## Setup Instructions

1. **Clone the repository**
2. **Install Firebase CLI** (if deploying):
   ```bash
   npm install -g firebase-tools
   ```
3. **Configure Firebase**:
   - Create a Firebase project
   - Enable Firestore database
   - Update `js/firebase.js` with your project configuration
4. **Deploy** (optional):
   ```bash
   firebase login
   firebase init
   firebase deploy
   ```

## How It Works

The website uses computer vision through TensorFlow.js and the MoveNet pose detection model to track user movements via webcam. This allows for interactive gameplay that encourages physical activity while preserving cultural heritage.

## Educational Impact

This project serves as a bridge between traditional Filipino culture and modern technology, encouraging youth to engage in physical activity through culturally relevant games.
