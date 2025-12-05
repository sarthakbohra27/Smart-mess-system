import { useRef, useEffect } from 'react';

/**
 * Hook to trigger animations when an element enters the viewport.
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Delay in milliseconds before animation starts
 * @param {string} options.animationClass - Tailwind animation class to apply (default: 'animate-fade-in-up')
 * @returns {React.RefObject} - Ref to attach to the element
 */
export const useAnimatedRef = ({ delay = 0, animationClass = 'animate-fade-in-up' } = {}) => {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Ensure the element is initially hidden and ready for animation
        element.style.opacity = '0';
        element.style.animationFillMode = 'forwards';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Use setTimeout to handle the delay logic
                    setTimeout(() => {
                        // Reset opacity to allow animation to control it (or keep it handled by keyframes)
                        // But since standard fade-in-up goes from opacity 0 to 1, removing the inline opacity style is safer
                        // right before adding current class, OR just let the class handle it.
                        // Our 'fade-in-up' keyframes start at opacity: 0.
                        element.classList.add(animationClass);
                        element.style.opacity = '';
                    }, delay);
                    observer.unobserve(element);
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [delay, animationClass]);

    return ref;
};

// No global provider state needed for this simple intersection logic, but we export a placeholder just in case the architecture expects it.
export const AnimationProvider = ({ children }) => children;
