import React, { useState } from 'react';
import { Settings, CheckCircle, XCircle, DollarSign, Users, TrendingUp } from 'lucide-react';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('redemptions');
    const [rates, setRates] = useState({
        coinToRupee: 1.0,
        coinsPerAttendance: 10,
        minRedemption: 50
    });

    const [redemptions, setRedemptions] = useState([
        { id: 1, user: 'John Doe', amount: 100, type: 'Mess Credit', date: '2025-12-01', status: 'pending' },
        { id: 2, user: 'Jane Smith', amount: 50, type: 'Voucher', date: '2025-12-01', status: 'pending' },
        { id: 3, user: 'Mike Johnson', amount: 200, type: 'Mess Credit', date: '2025-11-30', status: 'approved' },
    ]);

    const handleApprove = (id) => {
        setRedemptions(redemptions.map(r =>
            r.id === id ? { ...r, status: 'approved' } : r
        ));
    };

    const handleReject = (id) => {
        setRedemptions(redemptions.map(r =>
            r.id === id ? { ...r, status: 'rejected' } : r
        ));
    };

    const handleRateUpdate = (e) => {
        e.preventDefault();
        alert('System rates updated successfully!');
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
                <p className="text-gray-600">Manage system settings and requests</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Pending Requests</h3>
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {redemptions.filter(r => r.status === 'pending').length}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Coins Circulating</h3>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">12,450</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Current Exchange Rate</h3>
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">₹{rates.coinToRupee}</div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6 px-6">
                        <button
                            onClick={() => setActiveTab('redemptions')}
                            className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'redemptions'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Redemption Requests
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'settings'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            System Settings
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'redemptions' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {redemptions.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 font-medium text-gray-900">{request.user}</td>
                                            <td className="px-4 py-4 text-gray-600">{request.amount} Coins</td>
                                            <td className="px-4 py-4 text-gray-600">{request.type}</td>
                                            <td className="px-4 py-4 text-gray-500 text-sm">{request.date}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {request.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <form onSubmit={handleRateUpdate} className="max-w-2xl">
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                    <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                        <Settings className="w-5 h-5" /> Configuration
                                    </h3>
                                    <p className="text-blue-600 text-sm mt-1">
                                        These settings affect the entire system immediately.
                                    </p>
                                </div>

                                <div className="grid gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Coin to Rupee Exchange Rate
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={rates.coinToRupee}
                                                onChange={(e) => setRates({ ...rates, coinToRupee: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Value of 1 Coin in Rupees</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Coins Per Attendance
                                        </label>
                                        <input
                                            type="number"
                                            value={rates.coinsPerAttendance}
                                            onChange={(e) => setRates({ ...rates, coinsPerAttendance: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Coins credited for each day of attendance</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Minimum Redemption Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={rates.minRedemption}
                                            onChange={(e) => setRates({ ...rates, minRedemption: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimum coins required to request redemption</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
