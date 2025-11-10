export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function calculateNextReset(lastWeekReset: string): string {
    const resetDate = new Date(lastWeekReset);
    resetDate.setDate(resetDate.getDate() + 7);
    return formatDate(resetDate.toISOString());
}

export function getDaysUntil(dateString: string): string {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If within 24 hours (positive or negative), show hours
    if (Math.abs(diffHours) <= 24) {
        if (diffHours === 0) {
            return 'less than 1 hour';
        } else if (diffHours === 1) {
            return 'in 1 hour';
        } else if (diffHours === -1) {
            return '1 hour ago';
        } else if (diffHours > 0) {
            return `in ${diffHours} hours`;
        } else {
            return `${Math.abs(diffHours)} hours ago`;
        }
    }

    // Otherwise show days
    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'in 1 day';
    } else if (diffDays < 0) {
        return `${Math.abs(diffDays)} days ago`;
    } else {
        return `in ${diffDays} days`;
    }
}
