export function formatPrice(amount) {
    const price = Number(amount) || 0;

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(price);
}
