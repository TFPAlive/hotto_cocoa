// Currency formatting utility for Japanese Yen
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

export function formatPrice(amount: number): string {
    return `¥${Math.round(amount).toLocaleString('ja-JP')}`
}