# Xenon AI Frontend

Modern React TypeScript frontend for Xenon AI Learning Platform.

## Features

- 🎨 Modern Material-UI design
- 🔐 Authentication system
- 📚 Course management
- 📖 Interactive lessons with quizzes
- 👨‍🏫 Teacher dashboard
- 📱 Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server (Vite):
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production (Vite)
- `npm run preview` - Preview production build
- `npm run type-check` - TypeScript check

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── layout/         # Layout components
│   └── common/         # Common components
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── course/         # Course pages
│   ├── student/        # Student pages
│   └── teacher/        # Teacher pages
├── services/           # API services
├── contexts/           # React contexts
├── types/              # TypeScript types
├── hooks/              # Custom hooks
└── utils/              # Utility functions
```

## Key Components

### Authentication
- Login page with demo accounts
- Protected routes based on user roles
- Auth context for state management

### Dashboard
- Overview of courses and progress
- Quick actions for common tasks

### Course Management
- Browse available courses
- Detailed course view with modules and lessons
- Search and filtering capabilities

### Learning Interface
- Interactive lesson content
- Quiz system with immediate feedback
- Progress tracking

### Teacher Interface
- Course creation with resource upload
- Course editing and management
- Student progress monitoring

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Query** - Data fetching and caching

## Demo Accounts

The application includes demo accounts for testing:

- **Student**: student@example.com / password
- **Teacher**: teacher@example.com / password

## API Integration

The frontend is designed to work with the Xenon AI backend API:

- **AI Service**: Document ingestion and search
- **Core Service**: Course and user management (planned)
- **Real-time**: WebSocket support (planned)

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write meaningful commit messages
4. Test your changes thoroughly

## License

MIT License
