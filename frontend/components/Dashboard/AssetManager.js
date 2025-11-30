"use client";

import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './AssetManager.module.css';
import { API_BASE_URL } from '@/utils/config';

export default function AssetManager({ assets, onAssetAdded, onAssetRemoved }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [availablePairs, setAvailablePairs] = useState([]);
    const [selectedPair, setSelectedPair] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [loadingPairs, setLoadingPairs] = useState(false);

    useEffect(() => {
        if (isOpen && availablePairs.length === 0) {
            fetchAvailablePairs();
        }
    }, [isOpen]);

    const fetchAvailablePairs = async () => {
        setLoadingPairs(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/available-pairs`);
            if (res.ok) {
                const pairs = await res.json();
                setAvailablePairs(pairs);
            }
        } catch (err) {
            console.error('Failed to fetch available pairs:', err);
        } finally {
            setLoadingPairs(false);
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        if (!selectedPair) return;

        setLoading(true);
        setMessage('');

        const pair = availablePairs.find(p => p.symbol === selectedPair);
        if (!pair) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: pair.symbol,
                    name: pair.name
                }),
            });

            if (res.ok) {
                const newAsset = await res.json();
                setMessage('Asset added successfully!');
                setSelectedPair('');
                onAssetAdded(newAsset);
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage('');
                }, 1500);
            } else {
                const error = await res.json();
                setMessage(error.detail || 'Failed to add asset.');
            }
        } catch (err) {
            setMessage('Error adding asset.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAsset = async (assetId) => {
        if (!confirm('Are you sure you want to remove this asset?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                onAssetRemoved(assetId);
            } else {
                alert('Failed to remove asset.');
            }
        } catch (err) {
            alert('Error removing asset.');
        }
    };

    return (
        <div className={styles.wrapper}>
            <div
                className={`glass-panel ${styles.card}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h2 className={styles.title}>Manage Assets</h2>
                        <p className={styles.subtitle}>{assets.length} asset{assets.length !== 1 ? 's' : ''} tracked</p>
                    </div>
                    <button className={styles.toggleButton}>
                        {isExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
                    </button>
                </div>

                {isExpanded && (
                    <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.assetsHeader}>
                            <h3 className={styles.assetsTitle}>Your Assets</h3>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={styles.addButton}
                            >
                                <Plus size={18} />
                                Add New Asset
                            </button>
                        </div>

                        {isOpen && (
                            <div className={`glass-badge ${styles.formContainer}`}>
                                <h4 className={styles.formTitle}>Add New Asset</h4>
                                <form onSubmit={handleAddAsset} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>
                                            Select EUR Trading Pair
                                        </label>
                                        {loadingPairs ? (
                                            <div className={styles.loadingText}>Loading available pairs...</div>
                                        ) : (
                                            <select
                                                value={selectedPair}
                                                onChange={(e) => setSelectedPair(e.target.value)}
                                                className={styles.select}
                                                required
                                            >
                                                <option value="">-- Select a pair --</option>
                                                {availablePairs.map(pair => (
                                                    <option key={pair.symbol} value={pair.symbol}>
                                                        {pair.symbol} ({pair.name})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className={styles.buttonGroup}>
                                        <button
                                            type="submit"
                                            disabled={loading || !selectedPair}
                                            className={styles.submitButton}
                                        >
                                            {loading ? 'Adding...' : 'Add Asset'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className={styles.cancelButton}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {message && (
                                        <p className={`${styles.message} ${message.includes('success') ? styles.messageSuccess : styles.messageError}`}>
                                            {message}
                                        </p>
                                    )}
                                </form>
                            </div>
                        )}

                        <div className={styles.assetsList}>
                            {assets.map(asset => (
                                <div
                                    key={asset.id}
                                    className={`glass-badge ${styles.assetBadge}`}
                                >
                                    <span className={styles.assetSymbol}>{asset.symbol}</span>
                                    <button
                                        onClick={() => handleRemoveAsset(asset.id)}
                                        className={styles.removeButton}
                                        title="Remove asset"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
