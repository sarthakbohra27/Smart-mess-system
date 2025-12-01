// frontend/src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Wallet, History, Gift, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function StudentDashboard() {
    const [wallet, setWallet] = useState({ coin_balance: 0, mess_balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                setUser(storedUser);

                if (storedUser) {
                    const response = await api.get(`/wallets/users/${storedUser.id}/wallet`);
                    setWallet(response.data.wallet || { coin_balance: 0, mess_balance: 0 });

                    const coinTx = (response.data.coin_transactions?.recent || []).map(tx => ({
                        ...tx,
                        type: tx.amount > 0 ? 'credit' : 'debit',
                        category: 'coin',
                        description: tx.description || (tx.amount > 0 ? 'Coin Credit' : 'Coin Debit')
                    }));

                    const messTx = (response.data.mess_transactions?.recent || []).map(tx => ({
                        ...tx,
                        type: tx.amount > 0 ? 'credit' : 'debit',
                        category: 'mess',
                        description: tx.description || (tx.amount > 0 ? 'Mess Credit' : 'Mess Debit')
                    }));

                    const allTx = [...coinTx, ...messTx].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setTransactions(allTx);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleRedeem = async (e) => {
        e.preventDefault();
        try {
            await api.post('/wallets/redeem', {
                coins_to_redeem: parseInt(redeemAmount, 10),
                redemption_type: 'mess_credit'
            });

            alert(`Redemption request for ${redeemAmount} coins submitted!`);
            setRedeemAmount('');

            const storedUser = JSON.parse(localStorage.getItem('user'));
            const response = await api.get(`/wallets/users/${storedUser.id}/wallet`);
            setWallet(response.data.wallet);
        } catch (error) {
            alert(error.response?.data?.error || 'Redemption failed');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            {/* Center container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Student Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.full_name || 'Student'}</p>
                </header>

                {/* Wallet cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="rounded-2xl p-6 shadow-sm bg-white border">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Wallet className="w-5 h-5" /> Coin Balance
                                </h3>
                                <p className="mt-3 text-3xl font-bold text-gray-900">{wallet.coin_balance} <span className="text-base font-medium">Coins</span></p>
                                <p className="text-sm text-gray-500 mt-1">Earned from attendance</p>
                            </div>
                            <div className="self-start text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">Active</div>
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 shadow-sm bg-white border">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Wallet className="w-5 h-5" /> Mess Balance
                                </h3>
                                <p className="mt-3 text-3xl font-bold text-gray-900">₹{wallet.mess_balance}</p>
                                <p className="text-sm text-gray-500 mt-1">Available for meals</p>
                            </div>
                            <div className="self-start text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Prepaid</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity (span 2 cols on large) */}
                    <div className="lg:col-span-2 bg-white border rounded-xl p-4 shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Recent Activity</h4>
                        <div className="space-y-3">
                            {transactions.length === 0 ? (
                                <p className="text-gray-500 py-6 text-center">No recent transactions</p>
                            ) : (
                                transactions.map((tx, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{tx.description}</div>
                                                <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()} • {tx.category === 'coin' ? 'Coin Wallet' : 'Mess Wallet'}</div>
                                            </div>
                                        </div>
                                        <div className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : ''}{tx.amount} {tx.category === 'coin' ? 'Coins' : '₹'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Redeem coins */}
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2"><Gift className="w-5 h-5" /> Redeem Coins</h4>
                        <form onSubmit={handleRedeem} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Redeem</label>
                                <input
                                    type="number"
                                    value={redeemAmount}
                                    onChange={(e) => setRedeemAmount(e.target.value)}
                                    placeholder="Enter coins..."
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                    min="1"
                                    max={wallet.coin_balance}
                                />
                            </div>

                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                <p>Conversion Rate: 1 Coin = ₹1.00</p>
                                <p className="mt-1 font-medium">You will receive: ₹{redeemAmount ? redeemAmount : 0}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={!redeemAmount || redeemAmount > wallet.coin_balance}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
                            >
                                Request Redemption
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
