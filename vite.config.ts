import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite only serves the frontend. All data is stored in the browser (IndexedDB).
// strictPort: IndexedDB data belongs to the exact address http://localhost:5173 –
// if the port silently changed, your saved tournament would "disappear".
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } })
