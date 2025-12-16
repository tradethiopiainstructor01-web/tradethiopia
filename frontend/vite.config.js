import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure that we're correctly aliasing react-tsparticles
      'react-tsparticles': 'react-tsparticles'
    }
  },
  server: {
    host: 'localhost',
    port: 3002,             // Changed to port 3002 to avoid conflicts
    open: true              // Automatically opens the browser when the server starts (optional)
  }
});