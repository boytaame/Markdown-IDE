
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import IdeInterface from './components/IdeInterface';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <IdeInterface />;
};

export default App;
