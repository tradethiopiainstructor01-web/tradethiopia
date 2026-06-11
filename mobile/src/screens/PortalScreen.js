import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import BrandHeader from '../components/BrandHeader';
import { theme } from '../theme/theme';

export default function PortalScreen({ sourceUrl, isOnline }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    console.log('PortalScreen sourceUrl:', sourceUrl);
  }, [sourceUrl]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const injectedMobileViewport = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
      document.documentElement.classList.add('tradethiopia-native-mobile');
      true;
    })();
  `;

  if (!isOnline) {
    return (
      <LinearGradient colors={[theme.colors.navyDeep, theme.colors.navy]} style={styles.offlineRoot}>
        <SafeAreaView style={styles.offlineSafe}>
          <BrandHeader compact />
          <View style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Portal needs internet</Text>
            <Text style={styles.offlineBody}>
              Your web app requires an internet connection. Connect to the network and reopen the app.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!sourceUrl) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>URL not available</Text>
          <Text style={styles.errorBody}>The app could not determine the website address to load.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <WebView
        ref={webViewRef}
        source={{ uri: sourceUrl }}
        startInLoadingState
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        injectedJavaScript={injectedMobileViewport}
        onNavigationStateChange={(navState) => setCanGoBack(Boolean(navState.canGoBack))}
        onLoadStart={() => {
          setLoading(true);
          setLoadError(null);
          setErrorDetails(null);
        }}
        onLoadEnd={() => setLoading(false)}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.gold} size="large" />
            <Text style={styles.loaderText}>Opening website...</Text>
          </View>
        )}
        onError={({ nativeEvent }) => {
          setLoading(false);
          setLoadError(nativeEvent.description || 'WebView failed to load');
          setErrorDetails(JSON.stringify(nativeEvent));
          console.log('WebView onError:', nativeEvent);
        }}
        onHttpError={({ nativeEvent }) => {
          setLoading(false);
          setLoadError(`HTTP ${nativeEvent.statusCode}`);
          setErrorDetails(JSON.stringify(nativeEvent));
          console.log('WebView onHttpError:', nativeEvent);
        }}
        style={styles.webview}
      />

      {loading && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator color={theme.colors.gold} size="large" />
        </View>
      )}

      {loadError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Could not load page</Text>
          <Text style={styles.errorBody}>{loadError}</Text>
          {errorDetails && <Text style={styles.errorDetails}>{errorDetails}</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.page
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.page
  },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.page
  },
  loaderText: {
    marginTop: 10,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,251,253,0.62)'
  },
  offlineRoot: {
    flex: 1
  },
  offlineSafe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 34
  },
  offlineCard: {
    marginTop: 60,
    borderRadius: 22,
    padding: 20,
    backgroundColor: theme.colors.white
  },
  offlineTitle: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  offlineBody: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700'
  },
  errorCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.page
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)'
  },
  errorTitle: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorBody: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8
  },
  errorDetails: {
    color: theme.colors.navy,
    fontSize: 12,
    textAlign: 'center'
  }
});
