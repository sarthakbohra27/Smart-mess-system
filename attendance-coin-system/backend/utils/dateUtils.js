/**
 * Utility functions for date calculations and weekly credit processing
 */

/**
 * Get the start and end dates of the current week (Monday to Sunday)
 * @returns {Object} { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
 */
function getCurrentWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Get Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Get Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
        start_date: formatDate(monday),
        end_date: formatDate(sunday)
    };
}

/**
 * Get the start and end dates of the previous week
 * @returns {Object} { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
 */
function getPreviousWeek() {
    const currentWeek = getCurrentWeek();
    const startDate = new Date(currentWeek.start_date);

    // Go back 7 days to get previous Monday
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate)
    };
}

/**
 * Get week dates for a specific date
 * @param {string|Date} date - Date to get week for
 * @returns {Object} { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
 */
function getWeekForDate(date) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Calculate days to subtract to get to Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Get Monday of that week
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Get Sunday of that week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
        start_date: formatDate(monday),
        end_date: formatDate(sunday)
    };
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getToday() {
    return formatDate(new Date());
}

/**
 * Calculate number of days between two dates
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Number of days
 */
function daysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Check if a date is within a week range
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @param {string} weekStart - Week start date (YYYY-MM-DD)
 * @param {string} weekEnd - Week end date (YYYY-MM-DD)
 * @returns {boolean} True if date is within the week
 */
function isDateInWeek(date, weekStart, weekEnd) {
    const checkDate = new Date(date);
    const start = new Date(weekStart);
    const end = new Date(weekEnd);

    return checkDate >= start && checkDate <= end;
}

/**
 * Get all weeks in a month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Array} Array of week objects with start_date and end_date
 */
function getWeeksInMonth(year, month) {
    const weeks = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
        const week = getWeekForDate(currentDate);

        // Only add if week hasn't been added yet
        if (!weeks.some(w => w.start_date === week.start_date)) {
            weeks.push(week);
        }

        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
}

/**
 * Get week number in year (ISO 8601)
 * @param {string|Date} date - Date
 * @returns {number} Week number
 */
function getWeekNumber(date) {
    const targetDate = new Date(date);
    const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
    const days = Math.floor((targetDate - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

module.exports = {
    getCurrentWeek,
    getPreviousWeek,
    getWeekForDate,
    formatDate,
    getToday,
    daysBetween,
    isDateInWeek,
    getWeeksInMonth,
    getWeekNumber
};
