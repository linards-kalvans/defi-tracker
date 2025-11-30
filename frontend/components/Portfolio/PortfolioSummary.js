import styles from './PortfolioSummary.module.css';

export default function PortfolioSummary({ holdings }) {
    const totalValue = holdings.reduce((sum, item) => sum + item.current_value, 0);
    const totalCost = holdings.reduce((sum, item) => sum + (item.amount * item.avg_price), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return (
        <div className={styles.container}>
            <div className={`glass-panel ${styles.card}`}>
                <div className={styles.label}>Total Value</div>
                <div className={styles.value}>€{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className={`glass-panel ${styles.card}`}>
                <div className={styles.label}>Total PnL</div>
                <div className={`${styles.value} ${totalPnL >= 0 ? styles.positive : styles.negative}`}>
                    {totalPnL < 0 ? '-' : ''}€{Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className={styles.percent}>
                        ({totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                    </span>
                </div>
            </div>
        </div>
    );
}

