import React, { useState } from 'react';
import { Calendar, Check, X, Clock, Save, Users } from 'lucide-react';

const FacultyAttendance = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([
        { id: 1, name: 'John Doe', rollNo: 'CS101', status: 'present' },
        { id: 2, name: 'Jane Smith', rollNo: 'CS102', status: 'present' },
        { id: 3, name: 'Mike Johnson', rollNo: 'CS103', status: 'absent' },
        { id: 4, name: 'Sarah Williams', rollNo: 'CS104', status: 'present' },
        { id: 5, name: 'Robert Brown', rollNo: 'CS105', status: 'late' },
    ]);

    const handleStatusChange = (id, newStatus) => {
        setStudents(students.map(student =>
            student.id === id ? { ...student, status: newStatus } : student
        ));
    };

    const handleSubmit = () => {
        // In a real app, this would send data to POST /api/attendance/mark-bulk
        console.log('Submitting attendance for:', date, students);
        alert('Attendance marked successfully!');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
            case 'absent': return 'bg-rose-950/30 text-rose-400 border-rose-900/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
            case 'late': return 'bg-amber-950/30 text-amber-400 border-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
            default: return 'bg-slate-800/50 text-slate-400 border-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 transition-colors duration-300 selection:bg-cyan-500 selection:text-white">
            {/* Top decorative gradient */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 h-48 sm:h-64 sticky top-0 z-0 opacity-80"></div>

            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-600/10 blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-12 -mt-32 sm:-mt-40 pb-12">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-cyan-300 font-medium mb-1">Faculty Portal</p>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform origin-left duration-300">Mark Attendance</h1>
                        <p className="text-slate-400 mt-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-400" />
                            Computer Science - Section A
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl p-2.5 rounded-2xl border border-slate-700 shadow-lg group hover:border-cyan-500/50 transition-colors">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 group-hover:text-cyan-400 transition-colors">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent outline-none text-white font-medium focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>
                </header>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-[0_0_30px_rgba(56,189,248,0.1)] border border-slate-800 overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full">
                            <thead className="bg-slate-950/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Student Info</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {students.map((student, idx) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-slate-800/50 transition-colors group animate-fade-in-up opacity-0"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">
                                            {student.rollNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(student.status)} capitalize inline-flex items-center gap-1.5`}>
                                                {student.status === 'present' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                                                {student.status === 'absent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>}
                                                {student.status === 'late' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'present')}
                                                    className={`p-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 ${student.status === 'present'
                                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                                            : 'bg-slate-800 text-slate-500 hover:bg-emerald-950/50 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30'
                                                        }`}
                                                    title="Mark Present"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                                    className={`p-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 ${student.status === 'absent'
                                                            ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30'
                                                            : 'bg-slate-800 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 border border-transparent hover:border-rose-500/30'
                                                        }`}
                                                    title="Mark Absent"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'late')}
                                                    className={`p-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 ${student.status === 'late'
                                                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                                            : 'bg-slate-800 text-slate-500 hover:bg-amber-950/50 hover:text-amber-400 border border-transparent hover:border-amber-500/30'
                                                        }`}
                                                    title="Mark Late"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                        >
                            <Save className="w-5 h-5" />
                            <span>Save Attendance</span>
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #334155;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #475569;
                }
            `}</style>
        </div>
    );
};

export default FacultyAttendance;
