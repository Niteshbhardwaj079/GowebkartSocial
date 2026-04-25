import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ── Dev mode mein unhandled 404/network errors ka overlay band karo ──
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    // 404 ya network error pe React dev overlay mat dikho
    if (
      msg.includes('404') ||
      msg.includes('Network Error') ||
      msg.includes('Request failed with status code 404') ||
      msg.includes('ERR_CONNECTION_REFUSED')
    ) {
      event.preventDefault();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);