import React, { useState } from 'react';
import { Search, CreditCard, Utensils, AlertCircle, CheckCircle } from 'lucide-react';

const MessTerminal = () => {
    const [rollNo, setRollNo] = useState('');
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'error' | null

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        setPaymentStatus(null);

        // Simulate API lookup
        setTimeout(() => {
            if (rollNo.trim()) {
                setStudent({
                    name: 'John Doe',
                    rollNo: rollNo,
                    mess_balance: 450.50,
                    image: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
                });
            } else {
                setStudent(null);
            }
            setLoading(false);
        }, 800);
    };

    const handlePayment = (amount) => {
        if (!student) return;

        if (student.mess_balance < amount) {
            setPaymentStatus('error');
            return;
        }

        // Simulate payment API call
        setLoading(true);
        setTimeout(() => {
            setStudent(prev => ({
                ...prev,
                mess_balance: prev.mess_balance - amount
            }));
            setPaymentStatus('success');
            setLoading(false);

            // Reset status after 3 seconds
            setTimeout(() => setPaymentStatus(null), 3000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <Utensils className="w-12 h-12 mx-auto mb-3 opacity-90" />
                    <h1 className="text-2xl font-bold">Mess Terminal</h1>
                    <p className="text-blue-100">Scan or enter roll number</p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                placeholder="Enter Student Roll No"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors text-lg"
                                autoFocus
                            />
                        </div>
                    </form>

                    {loading && !student && (
                        <div className="text-center py-8 text-gray-500">Searching student database...</div>
                    )}

                    {student && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Student Profile */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <img src={student.image} alt={student.name} className="w-16 h-16 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                                    <p className="text-gray-500">{student.rollNo}</p>
                                </div>
                            </div>

                            {/* Balance Display */}
                            <div className="text-center p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-white shadow-lg">
                                <p className="text-gray-400 text-sm mb-1">Current Mess Balance</p>
                                <div className="text-4xl font-bold">₹{student.mess_balance.toFixed(2)}</div>
                            </div>

                            {/* Payment Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handlePayment(50)}
                                    disabled={loading}
                                    className="p-4 bg-white border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all group"
                                >
                                    <div className="text-sm text-gray-500 mb-1">Breakfast</div>
                                    <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">₹50</div>
                                </button>
                                <button
                                    onClick={() => handlePayment(80)}
                                    disabled={loading}
                                    className="p-4 bg-white border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition-all group"
                                >
                                    <div className="text-sm text-gray-500 mb-1">Lunch/Dinner</div>
                                    <div className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">₹80</div>
                                </button>
                            </div>

                            {/* Status Messages */}
                            {paymentStatus === 'success' && (
                                <div className="flex items-center gap-2 p-4 bg-green-100 text-green-700 rounded-xl animate-in zoom-in duration-300">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Payment Successful!</span>
                                </div>
                            )}

                            {paymentStatus === 'error' && (
                                <div className="flex items-center gap-2 p-4 bg-red-100 text-red-700 rounded-xl animate-in zoom-in duration-300">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-medium">Insufficient Balance!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessTerminal;
