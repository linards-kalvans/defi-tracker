import { useState } from 'react';
import styles from './Modal.module.css';

export default function SetPortfolioModal({ isOpen, onClose, assets, onSave }) {
    const [items, setItems] = useState([{ asset_id: '', amount: '', avg_price: '' }]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const validItems = items.filter(i => i.asset_id && i.amount && i.avg_price).map(i => ({
            asset_id: parseInt(i.asset_id),
            amount: parseFloat(i.amount),
            avg_price: parseFloat(i.avg_price)
        }));
        onSave(validItems);
    };

    const addRow = () => {
        setItems([...items, { asset_id: '', amount: '', avg_price: '' }]);
    };

    const updateRow = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const removeRow = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`}>
                <h2>Set Initial Portfolio</h2>
                <p>This will reset your manual portfolio history for the selected assets.</p>

                <form onSubmit={handleSubmit}>
                    {items.map((item, index) => (
                        <div key={index} className={styles.row}>
                            <select
                                value={item.asset_id}
                                onChange={e => updateRow(index, 'asset_id', e.target.value)}
                                required
                            >
                                <option value="">Select Asset</option>
                                {Object.values(assets).map(a => (
                                    <option key={a.id} value={a.id}>{a.symbol}</option>
                                ))}
                            </select>
                            <input
                                type="number" step="any" placeholder="Amount"
                                value={item.amount}
                                onChange={e => updateRow(index, 'amount', e.target.value)}
                                required
                            />
                            <input
                                type="number" step="any" placeholder="Avg Price (€)"
                                value={item.avg_price}
                                onChange={e => updateRow(index, 'avg_price', e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => removeRow(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-destructive)' }}>&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className={styles['btn-secondary']}>+ Add Asset</button>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles['btn-text']}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Portfolio</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

