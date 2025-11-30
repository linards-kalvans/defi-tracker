"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import Ticker from '@/components/Dashboard/Ticker';
import AssetManager from '@/components/Dashboard/AssetManager';
import SparklineSelector from '@/components/Dashboard/SparklineSelector';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getApiUrl, getWsUrl } from '@/utils/config';

export default function Home() {
  const [assets, setAssets] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [timeframe, setTimeframe] = useState('24h');
  const [trendIndicator, setTrendIndicator] = useState('period');
  const timeframeRef = useRef(timeframe);
  const router = useRouter();

  // State to hold API URLs initialized on client-side
  const [apiUrl, setApiUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');

  // Initialize URLs on mount
  useEffect(() => {
    setApiUrl(getApiUrl());
    setWsUrl(getWsUrl());
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);

  const fetchAssets = useCallback(() => {
    const apiUrl = getApiUrl();
    if (!apiUrl) return; // Wait for API URL to be ready

    fetch(`${apiUrl}/api/assets`)
      .then(res => res.json())
      .then(data => {
        setAssets(data);
        // Fetch price history for each asset
        data.forEach(asset => {
          fetchPriceHistory(asset.symbol);
        });
      })
      .catch(err => console.error("Failed to fetch assets:", err));
  }, [apiUrl]); // Depend on apiUrl

  const getTimeframeLimit = (timeframe) => {
    // Calculate how many data points to show based on timeframe
    // Assuming data comes every minute
    const limits = {
      '1h': 60,    // 1 hour = 60 minutes
      '24h': 1440, // 24 hours = 1440 minutes
      '7d': 10080, // 7 days = 10080 minutes (but we'll limit to last 100 points for performance)
      '30d': 43200, // 30 days = 43200 minutes (but we'll limit to last 200 points)
    };
    return limits[timeframe] || 1440;
  };

  const fetchPriceHistory = useCallback((symbol) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) return; // Wait for API URL

    const encodedSymbol = encodeURIComponent(symbol);
    fetch(`${apiUrl}/api/history/${encodedSymbol}`)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn(`History data for ${symbol} is not an array:`, data);
          return;
        }

        // Transform data for sparkline: { time, value }
        // Backend returns { timestamp, price } in UTC with 'Z' suffix
        let formatted = data
          .map(d => {
            // Parse timestamp as UTC - backend now returns ISO strings with 'Z' suffix
            const timestamp = d.timestamp;
            let time;
            if (typeof timestamp === 'string') {
              // Backend returns ISO strings with 'Z' (UTC), parse directly
              const date = new Date(timestamp);
              time = Math.floor(date.getTime() / 1000); // Convert to UTC Unix timestamp (seconds)
            } else if (typeof timestamp === 'number') {
              // If it's already a Unix timestamp, use it directly
              time = timestamp;
            } else {
              // Fallback
              time = Math.floor(new Date(timestamp).getTime() / 1000);
            }
            return {
              time: time,
              value: d.price,
            };
          })
          .filter(d => d.value != null && !isNaN(d.value) && !isNaN(d.time))
          .sort((a, b) => a.time - b.time);

        // Ensure max 1 point per minute - group by minute and keep the latest point
        const minuteMap = new Map();
        formatted.forEach(point => {
          const minuteKey = Math.floor(point.time / 60); // Round down to minute
          const existing = minuteMap.get(minuteKey);
          if (!existing || point.time > existing.time) {
            minuteMap.set(minuteKey, point);
          }
        });
        formatted = Array.from(minuteMap.values()).sort((a, b) => a.time - b.time);

        // Apply timeframe limit - use ref to get current timeframe
        const currentTimeframe = timeframeRef.current;
        const limit = getTimeframeLimit(currentTimeframe);
        // For longer timeframes, sample data points for better performance
        if (currentTimeframe === '7d' || currentTimeframe === '30d') {
          const sampleSize = currentTimeframe === '7d' ? 100 : 200;
          const step = Math.max(1, Math.floor(formatted.length / sampleSize));
          formatted = formatted.filter((_, index) => index % step === 0 || index === formatted.length - 1);
        } else {
          formatted = formatted.slice(-limit);
        }

        setPriceHistory(prev => ({
          ...prev,
          [symbol]: formatted,
        }));
      })
      .catch(err => console.error(`Failed to fetch history for ${symbol}:`, err));
  }, [apiUrl]); // Depend on apiUrl

  useEffect(() => {
    // Fetch initial assets only when API URL is ready
    if (apiUrl) {
      fetchAssets();
    }
  }, [apiUrl, fetchAssets]);

  useEffect(() => {
    // Refetch history when timeframe changes
    if (assets.length > 0 && apiUrl) {
      assets.forEach(asset => {
        fetchPriceHistory(asset.symbol);
      });
    }
  }, [timeframe, assets, fetchPriceHistory, apiUrl]);

  useEffect(() => {
    if (!wsUrl) return;

    // Connect to WebSocket
    const ws = new WebSocket(`${wsUrl}/ws/prices`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrices(prev => ({ ...prev, ...data }));

      // Update sparkline data with latest price
      // Use ref to access current timeframe value without adding it to dependencies
      setPriceHistory(prev => {
        const updated = { ...prev };
        Object.keys(data).forEach(symbol => {
          const price = data[symbol];
          if (price) {
            const existing = prev[symbol] || [];
            // Use UTC time (Date.now() already returns UTC milliseconds)
            const now = Math.floor(Date.now() / 1000); // UTC Unix timestamp in seconds
            const newPoint = {
              time: now,
              value: price,
            };
            // Remove old points beyond timeframe using ref
            const currentTimeframe = timeframeRef.current;
            const timeframeSeconds = {
              '1h': 3600,
              '24h': 86400,
              '7d': 604800,
              '30d': 2592000,
            };
            const cutoff = now - (timeframeSeconds[currentTimeframe] || 86400);
            const filteredByTimeframe = existing.filter(point => point.time >= cutoff);

            // Ensure max 1 point per minute - check if we already have a point for this minute
            const currentMinute = Math.floor(now / 60);
            const hasPointThisMinute = filteredByTimeframe.some(point =>
              Math.floor(point.time / 60) === currentMinute
            );

            let updatedPoints;
            if (hasPointThisMinute) {
              // Replace the existing point in this minute with the new one
              updatedPoints = filteredByTimeframe.map(point => {
                if (Math.floor(point.time / 60) === currentMinute) {
                  return newPoint;
                }
                return point;
              });
            } else {
              // Add new point
              updatedPoints = [...filteredByTimeframe, newPoint];
            }

            // Final deduplication pass to ensure max 1 point per minute (handles edge cases)
            const minuteMap = new Map();
            updatedPoints.forEach(point => {
              const minuteKey = Math.floor(point.time / 60);
              const existing = minuteMap.get(minuteKey);
              if (!existing || point.time > existing.time) {
                minuteMap.set(minuteKey, point);
              }
            });
            const filtered = Array.from(minuteMap.values()).sort((a, b) => a.time - b.time);
            updated[symbol] = filtered;
          }
        });
        return updated;
      });
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]); // Re-connect only if wsUrl changes

  useEffect(() => {
    // Refresh price history every 5 minutes for all assets
    if (assets.length === 0 || !apiUrl) return;

    const historyInterval = setInterval(() => {
      assets.forEach(asset => {
        fetchPriceHistory(asset.symbol);
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(historyInterval);
    };
  }, [assets, fetchPriceHistory, apiUrl]);

  const handleAssetAdded = (newAsset) => {
    setAssets(prev => [...prev, newAsset]);
    // Fetch price history for the new asset
    fetchPriceHistory(newAsset.symbol);
  };

  const handleAssetRemoved = (assetId) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  return (
    <main className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={`${styles.title} text-gradient`}>Crypto Tracker</h1>
          <p className={styles.subtitle}>Real-time prices and alerts</p>
        </header>

        <AssetManager
          assets={assets}
          onAssetAdded={handleAssetAdded}
          onAssetRemoved={handleAssetRemoved}
        />

        <SparklineSelector
          timeframe={timeframe}
          trendIndicator={trendIndicator}
          onTimeframeChange={setTimeframe}
          onTrendIndicatorChange={setTrendIndicator}
        />

        <div className={`grid-dashboard ${styles.dashboardGrid}`}>
          {assets.map(asset => {
            const currentPrice = prices[asset.symbol] || 0;
            const history = priceHistory[asset.symbol] || [];

            // Calculate change based on trend indicator
            let change24h = 0;
            if (history.length >= 2) {
              const newest = history[history.length - 1].value;

              if (trendIndicator === 'period') {
                // Change over the selected period
                const oldest = history[0].value;
                if (oldest > 0) {
                  change24h = ((newest - oldest) / oldest) * 100;
                }
              } else if (trendIndicator === 'start') {
                // Change from the first data point
                const start = history[0].value;
                if (start > 0) {
                  change24h = ((newest - start) / start) * 100;
                }
              } else if (trendIndicator === 'previous') {
                // Change from previous period (e.g., if 24h selected, compare to previous 24h)
                // For simplicity, we'll use the midpoint as "previous"
                const midpoint = Math.floor(history.length / 2);
                const previous = history[midpoint]?.value;
                if (previous > 0) {
                  change24h = ((newest - previous) / previous) * 100;
                }
              }
            } else {
              // Fallback to mock if no history
              change24h = (Math.random() * 10) - 5;
            }

            return (
              <Ticker
                key={asset.id}
                symbol={asset.symbol}
                name={asset.name}
                price={currentPrice}
                change24h={change24h}
                sparklineData={history}
                onClick={() => router.push(`/asset/${encodeURIComponent(asset.symbol)}`)}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
