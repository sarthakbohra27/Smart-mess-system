import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Wallet, History, Gift, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard, UserCheck, AlertCircle } from 'lucide-react';
import { useAnimatedRef } from '../contexts/AnimationProvider'; // <-- Animation hook

export default function StudentDashboard() {
    const [wallet, setWallet] = useState({ coin_balance: 0, mess_balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [user, setUser] = useState(null);
    // Mock attendance data - In a real app, this would come from the API
    const attendance = { percentage: 87, total_classes: 120, attended: 104 };

    // Animated refs
    const headerTitleRef = useAnimatedRef({ delay: 40 });
    const dateRef = useAnimatedRef({ delay: 160 });
    const coinCardRef = useAnimatedRef({ delay: 200 });
    const messCardRef = useAnimatedRef({ delay: 320 });
    const attendanceCardRef = useAnimatedRef({ delay: 440 });
    const redeemBoxRef = useAnimatedRef({ delay: 560 });

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    // Subcomponent for transaction row that uses its own animated ref
    function TransactionItem({ tx, idx }) {
        // Safe to call hook per item since this component is called consistently for each item
        const txRef = useAnimatedRef({ delay: idx * 80 });
        return (
            <div
                ref={txRef}
                className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.2)] border border-white/5 ${tx.type === 'credit'
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/30'
                        : 'bg-rose-950/50 text-rose-400 border-rose-900/30'
                        }`}>
                        {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {tx.description}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="capitalize text-slate-400">{tx.category} Wallet</span>
                        </div>
                    </div>
                </div>
                <div className={`font-bold text-base bg-clip-text text-transparent ${tx.type === 'credit' ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-rose-400 to-red-500'
                    }`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount} <span className="text-xs font-medium text-slate-500">{tx.category === 'coin' ? 'C' : '₹'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 transition-colors duration-300 selection:bg-cyan-500 selection:text-white">
            {/* Top decorative gradient - Adjusted for dark theme */}
            <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 h-48 sm:h-64 sticky top-0 z-0 opacity-80"></div>

            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/20 blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-violet-600/20 blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Main content container - Full Width */}
            <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-12 -mt-32 sm:-mt-40 pb-12">

                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between">
                    <div>
                        <p className="text-purple-300 font-medium mb-1">Welcome back,</p>
                        <h1
                            ref={headerTitleRef}
                            className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform origin-left duration-300"
                        >
                            {user?.full_name || 'Student'}
                        </h1>
                    </div>
                    <div
                        ref={dateRef}
                        className="mt-4 md:mt-0 text-purple-100 text-sm font-medium bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-colors animate-pulse"
                    >
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                {/* Balance & Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Coin Wallet Card */}
                    <div
                        ref={coinCardRef}
                        className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.1)] border border-slate-800 relative overflow-hidden group hover:shadow-[0_0_50px_rgba(139,92,246,0.2)] hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer active:scale-105 active:shadow-[0_0_60px_rgba(139,92,246,0.4)] z-0 active:z-50"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <Wallet size={120} className="text-violet-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-violet-950/50 rounded-2xl text-violet-400 border border-violet-900/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] animate-float">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-violet-100">Attendance Coins</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">{wallet.coin_balance}</span>
                                <span className="text-lg font-medium text-slate-400">coins</span>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-sm">
                                <span className="text-slate-400 font-medium">Available Balance</span>
                                <span className="text-emerald-400 flex items-center gap-1 font-semibold bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    <ArrowUpRight className="w-3 h-3" /> Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mess Balance Card */}
                    <div
                        ref={messCardRef}
                        className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-indigo-900/50 relative overflow-hidden group hover:shadow-[0_0_50px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer active:scale-105 active:shadow-[0_0_60px_rgba(99,102,241,0.4)] z-0 active:z-50"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <CreditCard size={120} className="text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-950/50 backdrop-blur-md rounded-2xl text-indigo-300 border border-indigo-800 animate-float animation-delay-2000">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-indigo-100">Mess Credit</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">₹{wallet.mess_balance}</span>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-sm">
                                <span className="text-slate-400 font-medium">Prepaid Balance</span>
                                <span className="text-indigo-300 flex items-center gap-1 font-semibold bg-indigo-900/40 px-2 py-1 rounded-full border border-indigo-500/30">
                                    <ArrowUpRight className="w-3 h-3" /> Ready to use
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Current Attendance Card */}
                    <div
                        ref={attendanceCardRef}
                        className="bg-gradient-to-br from-fuchsia-950 to-slate-900 rounded-3xl p-6 shadow-[0_0_30px_rgba(192,38,211,0.15)] border border-fuchsia-900/50 relative overflow-hidden group hover:shadow-[0_0_50px_rgba(192,38,211,0.3)] hover:border-fuchsia-500/50 transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1 cursor-pointer active:scale-105 active:shadow-[0_0_60px_rgba(192,38,211,0.4)] z-0 active:z-50"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                            <UserCheck size={120} className="text-fuchsia-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-fuchsia-950/50 backdrop-blur-md rounded-2xl text-fuchsia-300 border border-fuchsia-800 animate-float animation-delay-4000">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-fuchsia-100">Current Attendance</h3>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_20px_rgba(192,38,211,0.4)]">{attendance.percentage}%</span>
                                <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden self-center">
                                    <div className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500" style={{ width: `${attendance.percentage}%` }}></div>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-medium text-xs">Total Classes</span>
                                    <span className="text-white font-bold">{attendance.total_classes}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-slate-400 font-medium text-xs">Attended</span>
                                    <span className="text-fuchsia-200 font-bold">{attendance.attended}</span>
                                </div>
                                <span className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-full border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${attendance.percentage >= 75
                                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
                                    : 'bg-rose-950/30 text-rose-400 border-rose-900/50'
                                    }`}>
                                    {attendance.percentage >= 75 ? <UserCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    {attendance.percentage >= 75 ? 'Safe' : 'Low'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Activity Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-lg border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-purple-400" />
                                    Recent Activity
                                </h4>
                                <button className="text-sm font-medium text-purple-400 hover:text-purple-300 hover:underline transition-colors">View All</button>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                        <History className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No recent transactions found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-800">
                                        {transactions.map((tx, idx) => (
                                            <TransactionItem key={idx} tx={tx} idx={idx} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Redemption Section */}
                    <div className="lg:col-span-1">
                        <div ref={redeemBoxRef} className="bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-lg border border-slate-800 p-6 sticky top-24">
                            <div className="mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(167,139,250,0.4)] border border-white/10">
                                    <Gift className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-white">Redeem Coins</h4>
                                <p className="text-slate-400 text-sm mt-1">Convert your attendance coins into mess credit instantly.</p>
                            </div>

                            <form onSubmit={handleRedeem} className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-slate-300 ml-1">Amount to Redeem</label>
                                        <span className="text-xs text-slate-500 font-medium">Balance: <span className="text-white">{wallet.coin_balance}</span></span>
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={redeemAmount}
                                            onChange={(e) => setRedeemAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-4 pr-20 py-4 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all font-bold text-2xl text-white placeholder:text-slate-700 shadow-inner tracking-wide"
                                            min="1"
                                            max={wallet.coin_balance}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 tracking-wider">COINS</span>
                                            <button
                                                type="button"
                                                onClick={() => setRedeemAmount(wallet.coin_balance)}
                                                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-1 rounded-md border border-cyan-500/20 transition-colors uppercase tracking-wider"
                                            >
                                                Max
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preset Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {[50, 100, 200, 500].map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => setRedeemAmount(amount)}
                                                disabled={wallet.coin_balance < amount}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${wallet.coin_balance < amount
                                                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed hidden sm:block'
                                                    : redeemAmount == amount
                                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                                    }`}
                                            >
                                                {amount}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-700/50 rounded-xl p-4 relative overflow-hidden">
                                        {/* Decorative background element */}
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-3xl"></div>

                                        <div className="relative z-10 flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Exchange Rate</span>
                                            <span className="text-xs font-bold text-indigo-300 bg-indigo-950/50 px-2 py-1 rounded-md border border-indigo-500/20">1 Coin = ₹1.00</span>
                                        </div>
                                        <div className="relative z-10 flex justify-between items-end pt-3">
                                            <span className="text-sm font-medium text-slate-400 pb-1">You receive</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">₹{redeemAmount ? parseInt(redeemAmount).toLocaleString() : '0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!redeemAmount || redeemAmount <= 0 || redeemAmount > wallet.coin_balance}
                                        className="w-full group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                        <span className={`flex items-center justify-center gap-2 ${!redeemAmount || redeemAmount <= 0 || redeemAmount > wallet.coin_balance ? 'opacity-50' : ''}`}>
                                            Confirm Redemption
                                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

            {/* Custom scrollbar styles would ideally go in a CSS file, but for now we rely on browser defaults or Tailwind plugins if available */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #63287eff;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #8235eeff;
                }
            `}</style>
        </div>
    );
}