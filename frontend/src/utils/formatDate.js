export function formatDate(date) {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date unavailable';
    }

    return parsedDate.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}
