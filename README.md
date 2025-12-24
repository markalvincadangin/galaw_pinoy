# Galaw Pinoy

> **Move Your Body. Rediscover Filipino Culture.**

Galaw Pinoy is a health and fitness advocacy platform that uses traditional Filipino games as a medium to encourage physical movement, cultural appreciation, and digital engagement. The application transforms classic Filipino games into interactive web experiences using pose detection technology.

## 🎯 About

Galaw Pinoy addresses two important issues:
- **Sedentary Lifestyles**: Many Filipino youth today live sedentary lifestyles due to prolonged screen time and limited physical activity.
- **Cultural Preservation**: Traditional Filipino games are slowly being forgotten.

By using technology as a tool for movement and cultural awareness, Galaw Pinoy bridges the gap between modern digital engagement and traditional Filipino culture.

## ✨ Features

### 🎮 Interactive Games
- **Luksong Tinik**: Jump over hurdles with proper timing and stamina management
- **Patintero**: Dodge blockers by moving left or right
- **Langit Lupa**: Squat and stand based on commands
- **Piko**: Balance on one leg and hop to target cells
- **Agawan Base**: Run in place with high knees to reach the enemy base

### 🎯 Core Features
- **Pose Detection**: Real-time body movement tracking using MediaPipe and TensorFlow.js
- **User Authentication**: Google OAuth via Supabase
- **Score Tracking**: Personal scores and game history
- **Profile System**: Track games played, calories burned, and achievements
- **Visual Feedback**: Screen flashes, shakes, and popup feedback for game actions
- **Sound Effects**: Immersive audio feedback for different game events
- **Tutorial System**: Interactive tutorials with Lottie animations for each game
- **Admin Panel**: Administrative interface for managing the platform

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lottie React** - Animation rendering

### Backend & Services
- **Supabase** - Authentication and database
- **PostgreSQL** - Database (via Supabase)
- **Drizzle ORM** - Type-safe database queries

### AI & Computer Vision
- **MediaPipe Pose** - Pose estimation
- **TensorFlow.js** - Machine learning runtime
- **KNN Classifier** - Movement classification

### Additional Libraries
- **React Webcam** - Camera access
- **use-sound** - Sound effects management
- **Lucide React** - Icon library

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase Account** - For authentication and database
- **PostgreSQL Database** - Configured via Supabase
- **Webcam/Camera** - Required for pose detection games
- **Modern Browser** - Chrome, Firefox, Safari, or Edge with WebGL support

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd galaw-pinoy
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Connection (PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@host:port/database

# Admin Access (comma-separated list of admin email addresses)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### 4. Database Setup

Run database migrations using Drizzle:

```bash
# Generate migrations (if needed)
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

The database schema includes:
- **users** - User profiles and statistics
- **scores** - Game score history
- **reflections** - User reflections and feedback

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
galaw-pinoy/
├── public/
│   └── sounds/          # Game sound effects
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── play/        # Game pages
│   │   ├── api/         # API routes
│   │   └── ...
│   ├── components/
│   │   ├── games/       # Game components
│   │   ├── game/        # Shared game UI components
│   │   ├── home/        # Home page components
│   │   └── ui/          # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   │   ├── usePoseDetection.ts
│   │   ├── useGameSound.ts
│   │   └── useGameFeedback.tsx
│   ├── lib/             # Utility libraries
│   │   └── supabase/    # Supabase client configuration
│   ├── db/              # Database schema and configuration
│   └── utils/           # Utility functions
│       └── posePhysics.ts
└── ...
```

## 🎮 Available Games

### Luksong Tinik
Jump over hurdles with proper timing. Features stamina management and combo system.

### Patintero
Dodge blockers by moving left or right. Includes power-ups and adaptive difficulty.

### Langit Lupa
Squat for "Lupa" (Earth) and stand for "Langit" (Heaven). Tests reaction time.

### Piko (Hopscotch)
Balance on one leg and hop to target cells. Requires balance and coordination.

### Agawan Base
Run in place with high knees to reach the enemy base. Builds endurance.

## 🔧 Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🎯 Key Features Explained

### Pose Detection
The application uses MediaPipe Pose for real-time body landmark detection. Movement is tracked through key points (joints) and analyzed using physics calculations to determine game actions.

### Authentication
Users authenticate via Google OAuth through Supabase. Session management is handled securely using cookies and server-side validation.

### Game Feedback System
- **Visual Feedback**: Screen flashes (gold for perfect, green for good, red for miss)
- **Haptic Feedback**: Screen shake effects
- **Audio Feedback**: Different sound effects for different actions
- **Popup Feedback**: Animated text feedback ("PERFECT!", "GOOD!", "MISS!")

## 🤝 Contributing

This is a private project. For questions or contributions, please contact the project maintainers.

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Traditional Filipino games that inspired this project
- MediaPipe team for pose detection technology
- Supabase for authentication and database infrastructure

---

**Galaw Pinoy** - *Preserving culture through movement*
