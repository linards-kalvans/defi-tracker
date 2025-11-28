"use client";

import styles from './SparklineSelector.module.css';

export default function SparklineSelector({ timeframe, trendIndicator, onTimeframeChange, onTrendIndicatorChange }) {
    return (
        <div className={styles.selectorContainer}>
            <div className={styles.selectorGroup}>
                <label className={styles.label}>Timeframe</label>
                <select 
                    value={timeframe} 
                    onChange={(e) => onTimeframeChange(e.target.value)}
                    className={styles.select}
                >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                </select>
            </div>
            
            <div className={styles.selectorGroup}>
                <label className={styles.label}>Trend</label>
                <select 
                    value={trendIndicator} 
                    onChange={(e) => onTrendIndicatorChange(e.target.value)}
                    className={styles.select}
                >
                    <option value="period">Period Change</option>
                    <option value="start">From Start</option>
                    <option value="previous">From Previous</option>
                </select>
            </div>
        </div>
    );
}

