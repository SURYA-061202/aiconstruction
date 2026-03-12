# Setup Guide: Getting Started with BuildGuard

Follow these steps to scaffold a new BuildGuard project and connect it to the RCK Engine validation layer.

## 1. Project Scaffolding

We recommend using **Vite** for a performant React setup.

```bash
# Initialize project
npx create-vite-app buildguard --template react
cd buildguard

# Install core dependencies
npm install axios lucide-react framer-motion
```

## 2. Environment Configuration

Create a `.env` file in your root directory to link your RCK Engine instance.

```env
VITE_RCK_ENGINE_URL=http://localhost:8000
VITE_RCK_API_KEY=your_secure_api_key_here
VITE_AEC_PLUGIN_VERSION=v1.0.0
```

## 3. Directory Structure

For a professional project, we recommend the following structure:

```text
buildguard/
├── src/
│   ├── components/      # UI Components (Cards, Dashboards)
│   ├── hooks/           # useRckEngine.js
│   ├── assets/          # Custom CSS, premium assets
│   ├── utils/           # NSVG mapping logic
│   └── App.jsx
├── docs/                # Project Documentation
└── .env
```

## 4. Connecting to RCK

Ensure your RCK Engine is running locally or accessible via proxy. 

1.  **Test Connection**: Use a tool like Postman to verify `GET /status` on your RCK URL.
2.  **Initialize Hook**: Import `useRckEngine` into your main validation view.
3.  **AEC Check**: Trigger `performValidation()` with a sample architectural PDF.

## 5. Premium UI Polish

To achieve the "Premium" look envisioned for BuildGuard:
- Use **Inter** or **Outfit** fonts.
- Apply subtle glassmorphism to the compliance cards.
- Use `framer-motion` for staggering the compliance list entries.
