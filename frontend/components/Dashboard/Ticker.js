"use client";

import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatPrice } from '@/utils/priceFormatter';
import Sparkline from '@/components/Charts/Sparkline';
import styles from './Ticker.module.css';

export default function Ticker({ symbol, name, price, change24h, onClick, sparklineData }) {
    const isPositive = change24h >= 0;

    return (
        <div
            onClick={onClick}
            className={`glass-panel ${styles.card}`}
        >
            <div className={styles.header}>
                <div className={styles.symbolContainer}>
                    <h3 className={styles.symbol}>{symbol}</h3>
                    <p className={styles.name}>{name}</p>
                </div>
                <div className={`${styles.changeIndicator} ${isPositive ? styles.changePositive : styles.changeNegative}`}>
                    {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className={styles.changeValue}>{Math.abs(change24h).toFixed(2)}%</span>
                </div>
            </div>

            {/* Sparkline chart */}
            <div className={styles.chartContainer}>
                <Sparkline data={sparklineData} isPositive={isPositive} />
            </div>

            <div className={styles.priceSection}>
                <div className={styles.priceContainer}>
                    <div className={styles.price}>
                        €{formatPrice(price)}
                    </div>
                    <div className={styles.priceLabel}>Current Price</div>
                </div>
            </div>
        </div>
    );
}
