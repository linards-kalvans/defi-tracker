"use client";

import { useEffect, useState, use } from 'react';
import { getApiUrl } from '@/utils/config';
import CandleChart from '@/components/Charts/CandleChart';
import Link from 'next/link';

export default function AssetPage({ params }) {
    // Use React.use() to unwrap the params promise
    const resolvedParams = use(params);
    const symbol = decodeURIComponent(resolvedParams.symbol);

    const [history, setHistory] = useState([]);
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('24h');

    useEffect(() => {
        const fetchHistory = async () => {
            const apiUrl = getApiUrl();
            if (!apiUrl) return;

            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}/api/history/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
                if (!res.ok) throw new Error('Failed to fetch history');
                const data = await res.json();

                // Transform data for chart
                const chartData = data
                    .map(d => ({
                        time: typeof d.timestamp === 'string'
                            ? Math.floor(new Date(d.timestamp).getTime() / 1000)
                            : d.timestamp,
                        value: d.price
                    }))
                    .sort((a, b) => a.time - b.time);

                setHistory(chartData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [symbol, timeframe]);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    &larr; Back
                </Link>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['1h', '24h', '7d', '30d', '1y', 'all'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className="glass-badge"
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                cursor: 'pointer',
                                background: timeframe === tf ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.5)',
                                color: timeframe === tf ? 'white' : 'var(--color-text-primary)',
                                fontWeight: timeframe === tf ? 'bold' : 'normal',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            {tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{symbol}</h1>

            {loading ? (
                <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Loading data...
                </div>
            ) : (
                <div className="glass-panel" style={{ height: '500px', padding: '1rem' }}>
                    {history.length > 0 ? (
                        <CandleChart data={history} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                            No data available for this timeframe
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

