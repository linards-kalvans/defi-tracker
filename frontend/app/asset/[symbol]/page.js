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

    useEffect(() => {
        const fetchHistory = async () => {
            const apiUrl = getApiUrl();
            if (!apiUrl) return;

            try {
                const res = await fetch(`${apiUrl}/api/history/${encodeURIComponent(symbol)}`);
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
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchHistory();
    }, [symbol]);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
                &larr; Back
            </Link>

            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{symbol}</h1>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="glass-panel" style={{ height: '500px', padding: '1rem' }}>
                    <CandleChart data={history} />
                </div>
            )}
        </div>
    );
}

