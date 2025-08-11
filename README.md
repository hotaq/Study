# Grind & Glow - Study Productivity App

<div align="center">

![Grind & Glow](https://img.shields.io/badge/Grind%20%26%20Glow-Study%20Productivity-blueviolet)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.19-green)
![Supabase](https://img.shields.io/badge/Supabase-2.54.0-orange)

</div>

Grind & Glow is a modern study productivity application designed to help students and professionals track their study sessions, set goals, and visualize their progress through comprehensive analytics.

## ✨ Features

- **Study Rooms**: Create and join study rooms to focus on your work
- **Pomodoro Timer**: Use the built-in timer with customizable settings
  - Pomodoro mode
  - Unlimited mode
  - Custom time settings
- **Goal Setting**: Set and track different types of study goals
  - Time-based goals
  - Session-based goals
  - Score-based goals
- **Analytics Dashboard**: Visualize your study habits with detailed charts
  - Daily, weekly, monthly, and yearly views
  - Track total study time, sessions completed, and more
  - Study streak tracking
- **User Authentication**: Secure login and signup with Supabase
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/hotaq/Study.git

# Navigate to the project directory
cd Study

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`

## 🛠️ Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - React Router
  - Tailwind CSS
  - shadcn/ui components
  - Recharts for data visualization
  - date-fns for date manipulation

- **Backend**:
  - Supabase for authentication and database
  - React Query for data fetching

## 📊 Database Schema

The application uses Supabase with the following main tables:

- **users**: User authentication and profile information
- **rooms**: Study room details and settings
- **study_sessions**: Records of completed study sessions

## 🧩 Project Structure

```
/src
  /components      # UI components
  /contexts        # React contexts (Auth, etc.)
  /hooks           # Custom React hooks
  /lib             # Utility functions and libraries
  /pages           # Main application pages
  App.tsx          # Main application component
  index.css        # Global styles
  main.tsx         # Application entry point
```

## 🔒 Authentication

The application uses Supabase for authentication with the following features:

- Email/password authentication
- Protected routes for authenticated users
- User profile management

## 🎯 Future Enhancements

- Social features to connect with study partners
- Integration with calendar applications
- Advanced statistics and insights
- Customizable study themes
- Mobile application

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend services
- [Recharts](https://recharts.org/) for the data visualization
- [Lucide Icons](https://lucide.dev/) for the icon set
