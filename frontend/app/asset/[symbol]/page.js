"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CandleChart from '@/components/Charts/CandleChart';
import AlertForm from '@/components/Alerts/AlertForm';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/utils/priceFormatter';
import styles from './page.module.css';

export default function AssetDetail() {
    const { symbol } = useParams(); // Note: symbol will be URL encoded, e.g., BTC%2FUSDT
    const decodedSymbol = decodeURIComponent(symbol);
    const router = useRouter();

    const [history, setHistory] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);

    useEffect(() => {
        // Fetch history
        fetch(`http://127.0.0.1:8000/api/history/${symbol}`)
            .then(res => res.json())
            .then(data => {
                // Transform data for lightweight-charts
                // Backend returns { timestamp, price }
                // Chart expects { time, open, high, low, close } or just line data { time, value }
                // Since we only have single price points per minute, we can use a LineSeries or AreaSeries, 
                // OR mock OHLC if we really want candles. For now, let's switch CandleChart to accept line data or just use close price.
                // Actually, let's map it to a simple candle where O=H=L=C = price to keep it simple, or modify CandleChart.
                // Better: Let's modify CandleChart to be more generic or just pass data that fits.
                // For this MVP, let's assume we want to show a line chart or simple candles.
                // Let's format as candles with 0 spread for simplicity or just use the price.
                const formatted = data.map(d => ({
                    time: new Date(d.timestamp).getTime() / 1000,
                    open: d.price,
                    high: d.price,
                    low: d.price,
                    close: d.price,
                })).sort((a, b) => a.time - b.time);

                setHistory(formatted);
                if (formatted.length > 0) {
                    setCurrentPrice(formatted[formatted.length - 1].close);
                }
            })
            .catch(err => console.error("Failed to fetch history:", err));
    }, [symbol]);

    return (
        <main className={styles.main}>
            <div className="container">
                <button
                    onClick={() => router.back()}
                    className={styles.backButton}
                >
                    <ArrowLeft size={20} className={styles.backButtonIcon} /> Back to Dashboard
                </button>

                <div className={styles.layout}>
                    <div className={styles.mainContent}>
                        <div className={`glass-panel ${styles.priceCard}`}>
                            <h1 className={styles.symbolTitle}>{decodedSymbol}</h1>
                            <p className={styles.price}>€{formatPrice(currentPrice)}</p>
                        </div>

                        <div className={`glass-panel ${styles.chartCard}`}>
                            <h2 className={styles.chartTitle}>Price History</h2>
                            <CandleChart data={history} />
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <AlertForm symbol={decodedSymbol} currentPrice={currentPrice} />
                    </div>
                </div>
            </div>
        </main>
    );
}
