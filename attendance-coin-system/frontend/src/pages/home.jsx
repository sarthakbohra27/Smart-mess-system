import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';

// Floating Particles Component with optimized cursor tracking
const FloatingParticles = () => {
    const [particles, setParticles] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        // Generate random particles
        const generatedParticles = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.5 + 0.1, // Increased opacity slightly
            speed: (Math.random() - 0.5) * 40 + 20, // Random speed and direction factor
        }));
        setParticles(generatedParticles);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;

            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            // Update CSS variables for smooth performance
            containerRef.current.style.setProperty('--mouse-x', x);
            containerRef.current.style.setProperty('--mouse-y', y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 overflow-hidden pointer-events-none"
            style={{ '--mouse-x': 0, '--mouse-y': 0 }}
        >
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-blue-500 transition-transform duration-100 ease-out"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        opacity: particle.opacity,
                        // Combine float animation with mouse parallax
                        // We use CSS calc() to multiply the mouse position by the particle's speed factor
                        transform: `translate(calc(var(--mouse-x) * ${particle.speed}px), calc(var(--mouse-y) * ${particle.speed}px))`,
                    }}
                />
            ))}
        </div>
    );
};

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center">
            {/* Floating Particles Background */}
            <FloatingParticles />

            {/* Main Content - Centered */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-2xl mb-8 shadow-lg">
                    <Coins className="w-12 h-12 text-white" />
                </div>

                {/* Main Heading */}
                <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                    Welcome to <span className="text-blue-600">AttendanceCoin</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light">
                    Your smart solution to manage attendance, earn rewards, and track activities effortlessly.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[180px]"
                    >
                        Sign Up
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[180px]"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
