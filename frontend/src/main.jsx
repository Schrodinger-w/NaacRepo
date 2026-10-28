// <React.StrictMode> is deliberately absent: in development it runs every effect twice, which
// would send each request twice and fill the audit log with duplicates.
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(<App />);
