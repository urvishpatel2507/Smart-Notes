# Smart Notes - AI-Powered Note Taking App

A modern, feature-rich notes application built with React, TypeScript, and AI-powered features. Create, edit, and organize your notes with advanced capabilities including encryption, AI analysis, and responsive design.

## ✨ Features

- 📝 **Rich Text Editor** - Full-featured text editor with formatting capabilities
- 🤖 **AI-Powered Analysis** - Automatic note analysis, summaries, and tag suggestions
- 🔒 **End-to-End Encryption** - Secure notes with password protection
- 🌍 **Multi-language Translation** - Translate notes to multiple languages
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🎨 **Light/Dark Theme** - Beautiful themes with system preference detection
- 🔍 **Smart Search** - Find notes quickly with intelligent search
- 📌 **Pin & Organize** - Pin important notes and organize with tags
- 💾 **Auto-save** - Never lose your work with automatic saving
- ⌨️ **Keyboard Shortcuts** - Efficient list editing with keyboard shortcuts

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_REPO_URL>
   cd smart-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application.

## 🛠️ Built With

- **Frontend**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React hooks with custom hooks
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Theme**: next-themes for light/dark mode

## 📱 Usage

### Creating Notes
- Click the "+" button in the sidebar to create a new note
- Use the encryption button to create password-protected notes
- Start typing to begin writing your note

### AI Features
- Click the "AI Analyze" button to get automatic analysis
- View AI-generated summaries and suggested tags
- Use the translation feature to translate notes to other languages

### Organization
- Pin important notes using the pin button
- Search through all your notes using the search bar
- Use tags to categorize and organize your notes

### Mobile Usage
- On mobile devices, tap the menu button to access the sidebar
- All features work seamlessly on touch devices
- Responsive design adapts to your screen size

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── NotesApp.tsx    # Main application component
│   ├── RichTextEditor.tsx # Text editor component
│   └── NotesSidebar.tsx   # Sidebar component
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── pages/              # Route components
└── lib/                # Library utilities
```

## 🔒 Security

- Notes are encrypted using Web Crypto API with AES-GCM
- Passwords are hashed using PBKDF2 with 100,000 iterations
- All encryption happens client-side for maximum security
- No data is sent to external servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Lucide](https://lucide.dev) for the amazing icons
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Vite](https://vitejs.dev) for the fast build tool