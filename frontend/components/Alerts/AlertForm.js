"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/utils/config';

export default function AlertForm({ symbol, currentPrice }) {
    const [targetPrice, setTargetPrice] = useState(currentPrice || 0);
    const [condition, setCondition] = useState('above');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    target_price: parseFloat(targetPrice),
                    condition,
                    email
                }),
            });

            if (res.ok) {
                setMessage('Alert set successfully!');
                setEmail('');
            } else {
                setMessage('Failed to set alert.');
            }
        } catch (err) {
            setMessage('Error setting alert.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-white">Set Price Alert</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Price (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Condition</label>
                    <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                    >
                        <option value="above">Price goes above</option>
                        <option value="below">Price goes below</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Email (Optional)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? 'Setting...' : 'Create Alert'}
                </button>

                {message && (
                    <p className={`text-sm text-center ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
