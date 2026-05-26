import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfirmProvider } from './components/ConfirmProvider';
import { ToastProvider } from './components/ToastProvider';
import { LocaleProvider } from './i18n';
import { router } from './router';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LocaleProvider>
      <ToastProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </ToastProvider>
    </LocaleProvider>
  </React.StrictMode>
);
