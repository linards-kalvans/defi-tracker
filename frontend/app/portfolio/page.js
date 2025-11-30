"use client";

import { useEffect, useState, useCallback } from 'react';
import { getApiUrl } from '@/utils/config';
import styles from './page.module.css';
import PortfolioSummary from '@/components/Portfolio/PortfolioSummary';
import Link from 'next/link';
import SetPortfolioModal from '@/components/Portfolio/SetPortfolioModal';
import AddTransactionModal from '@/components/Portfolio/AddTransactionModal';

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [assets, setAssets] = useState({}); // id -> asset map
    const [loading, setLoading] = useState(true);

    const [isSetPortfolioOpen, setIsSetPortfolioOpen] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

    const fetchData = useCallback(async () => {
        const apiUrl = getApiUrl();
        if (!apiUrl) return;

        try {
            const [portfolioRes, txRes, assetsRes] = await Promise.all([
                fetch(`${apiUrl}/api/portfolio`),
                fetch(`${apiUrl}/api/transactions`),
                fetch(`${apiUrl}/api/assets`)
            ]);

            const portfolioData = await portfolioRes.json();
            const txData = await txRes.json();
            const assetsData = await assetsRes.json();

            setHoldings(portfolioData);
            setTransactions(txData);

            const assetsMap = {};
            assetsData.forEach(a => assetsMap[a.id] = a);
            setAssets(assetsMap);

        } catch (err) {
            console.error("Failed to fetch portfolio data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSetPortfolio = async (items) => {
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/api/portfolio/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            if (res.ok) {
                setIsSetPortfolioOpen(false);
                fetchData();
            } else {
                console.error("Failed to set portfolio");
            }
        } catch (err) {
            console.error("Error setting portfolio", err);
        }
    };

    const handleAddTransaction = async (tx) => {
        const apiUrl = getApiUrl();
        try {
            const res = await fetch(`${apiUrl}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
            });
            if (res.ok) {
                setIsAddTransactionOpen(false);
                fetchData();
            } else {
                console.error("Failed to add transaction");
            }
        } catch (err) {
            console.error("Error adding transaction", err);
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <main className={styles.main}>
            <SetPortfolioModal
                isOpen={isSetPortfolioOpen}
                onClose={() => setIsSetPortfolioOpen(false)}
                assets={assets}
                onSave={handleSetPortfolio}
            />
            <AddTransactionModal
                isOpen={isAddTransactionOpen}
                onClose={() => setIsAddTransactionOpen(false)}
                assets={assets}
                onSave={handleAddTransaction}
            />

            <div className="container">
                <Link href="/" className="btn-primary" style={{ display: 'inline-block', marginBottom: '20px', textDecoration: 'none' }}>
                    &larr; Back to Dashboard
                </Link>

                <header className={styles.header}>
                    <div>
                        <h1 className={`${styles.title} text-gradient`}>Portfolio</h1>
                        <p className={styles.subtitle}>Track your crypto assets</p>
                    </div>
                    <div className={styles.actions}>
                        <button className="btn-primary" onClick={() => setIsAddTransactionOpen(true)}>Add Transaction</button>
                        <button className="btn-primary" onClick={() => setIsSetPortfolioOpen(true)}>Set Initial Portfolio</button>
                    </div>
                </header>

                <PortfolioSummary holdings={holdings} />

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Holdings</h2>
                    {holdings.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No holdings yet. Set your initial portfolio or add a transaction.
                        </div>
                    ) : (
                        <div className={`glass-panel ${styles.tableContainer}`}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Amount</th>
                                        <th>Avg Price</th>
                                        <th>Current Price</th>
                                        <th>Value</th>
                                        <th>PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(item => (
                                        <tr key={item.asset_id}>
                                            <td>{item.name} <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8em' }}>({item.symbol})</span></td>
                                            <td>{item.amount.toLocaleString()}</td>
                                            <td>€{item.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>€{item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>€{item.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className={item.pnl >= 0 ? styles.positive : styles.negative}>
                                                €{item.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({item.pnl_percent.toFixed(2)}%)
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Transaction History</h2>
                    {transactions.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No transactions found.
                        </div>
                    ) : (
                        <div className={`glass-panel ${styles.tableContainer}`}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Asset</th>
                                        <th>Amount</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                        <th>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{new Date(tx.timestamp).toLocaleString()}</td>
                                            <td className={tx.type === 'BUY' ? styles.positive : styles.negative}>{tx.type}</td>
                                            <td>{assets[tx.asset_id]?.symbol || tx.asset_id}</td>
                                            <td>{tx.amount}</td>
                                            <td>€{tx.price.toLocaleString()}</td>
                                            <td>€{(tx.amount * tx.price).toLocaleString()}</td>
                                            <td>{tx.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

