import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import PortalScreen from './src/screens/PortalScreen';
import { appConfig } from './src/config/appConfig';

export default function App() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return unsubscribe;
  }, []);

  const sourceUrl = appConfig.loginUrl || 'https://tradeethiopia.com/login';

  return (
    <>
      <StatusBar style="light" />
      <PortalScreen sourceUrl={sourceUrl} isOnline={isOnline} />
    </>
  );
}

