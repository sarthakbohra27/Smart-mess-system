import React, { useState } from 'react';
import { Calendar, Check, X, Clock, Save } from 'lucide-react';

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
            case 'present': return 'bg-green-100 text-green-700 border-green-200';
            case 'absent': return 'bg-red-100 text-red-700 border-red-200';
            case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Mark Attendance</h1>
                    <p className="text-gray-600">Computer Science - Section A</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="outline-none text-gray-700 font-medium"
                    />
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {student.rollNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.status)} capitalize`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'present')}
                                                className={`p-2 rounded-lg transition-colors ${student.status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
                                                title="Mark Present"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                                className={`p-2 rounded-lg transition-colors ${student.status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
                                                title="Mark Absent"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'late')}
                                                className={`p-2 rounded-lg transition-colors ${student.status === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'}`}
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

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                        <Save className="w-4 h-4" /> Save Attendance
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyAttendance;
