# QuickCart Frontend

This is the frontend implementation for the QuickCart e-commerce application built with React, Vite, and Tailwind CSS.

## Features

- User authentication (login/register)
- Product listing with filters and search
- Product details view
- Cart management
- Responsive design for all devices

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios for API calls
- React Hook Form for form management
- Heroicons for icons

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Backend API running (see quickcart-backend)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quickcart.git
   cd quickcart/quickcart-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or with yarn
   yarn install
   ```

3. Create a `.env` file with your backend API URL:
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or with yarn
   yarn dev
   ```

5. Open your browser and visit:
   ```
   http://localhost:5173
   ```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   # or with yarn
   yarn build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   # or with yarn
   yarn preview
   ```

## Project Structure

- `src/`: Source code directory
  - `assets/`: Static assets like images
  - `components/`: Reusable UI components
    - `ui/`: Generic UI components
    - `product/`: Product-specific components
  - `contexts/`: React contexts (CartContext, AuthContext)
  - `hooks/`: Custom React hooks
  - `pages/`: Route-based page components
    - `auth/`: Authentication pages
    - `products/`: Product pages
    - `cart/`: Cart and checkout pages
  - `services/`: API service layer
  - `utils/`: Utility functions

## License

MIT
