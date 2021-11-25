import React from 'react';
import { ThemeProvider, theme } from '@blockstack/ui';
import { Routes } from '@components/routes';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col h-full font-sans">
        <Routes />
      </div>
    </ThemeProvider>
  );
};
