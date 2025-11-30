import { useState } from 'react';
import styles from './Modal.module.css';

export default function AddTransactionModal({ isOpen, onClose, assets, onSave }) {
    const [formData, setFormData] = useState({
        asset_id: '',
        type: 'BUY',
        amount: '',
        price: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            asset_id: parseInt(formData.asset_id),
            type: formData.type,
            amount: parseFloat(formData.amount),
            price: parseFloat(formData.price)
        });
    };

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`}>
                <h2>Add Transaction</h2>

                <form onSubmit={handleSubmit}>
                    <div className={styles.row}>
                        <label style={{ width: '100px' }}>Asset</label>
                        <select
                            value={formData.asset_id}
                            onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                            required
                        >
                            <option value="">Select Asset</option>
                            {Object.values(assets).map(a => (
                                <option key={a.id} value={a.id}>{a.symbol}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label style={{ width: '100px' }}>Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="BUY">Buy</option>
                            <option value="SELL">Sell</option>
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label style={{ width: '100px' }}>Amount</label>
                        <input
                            type="number" step="any" placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.row}>
                        <label style={{ width: '100px' }}>Price (€)</label>
                        <input
                            type="number" step="any" placeholder="0.00"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles['btn-text']}>Cancel</button>
                        <button type="submit" className="btn-primary">Add Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

