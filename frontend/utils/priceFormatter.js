/**
 * Formats a price to show at least 2 decimal digits and at least 4 significant digits
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export function formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return '0.00';
    }

    const numPrice = Number(price);
    
    if (numPrice === 0) {
        return '0.00';
    }

    // Calculate the number of significant digits needed
    // We want at least 4 significant digits
    
    // For numbers >= 1, count integer digits
    if (numPrice >= 1) {
        const integerPart = Math.floor(numPrice);
        const integerDigits = integerPart.toString().replace(/,/g, '').length;
        
        if (integerDigits >= 4) {
            // Already has 4+ significant digits in integer part, show 2 decimals
            return numPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            // Need more decimal places to reach 4 significant digits total
            // If we have 3 integer digits, we need 1 more from decimals (but min 2)
            // If we have 2 integer digits, we need 2 more from decimals (but min 2)
            // If we have 1 integer digit, we need 3 more from decimals (but min 2)
            const neededDecimals = Math.max(2, 4 - integerDigits);
            return numPrice.toLocaleString(undefined, {
                minimumFractionDigits: neededDecimals,
                maximumFractionDigits: neededDecimals
            });
        }
    } else {
        // For prices < 1, use scientific notation approach to find magnitude
        const absPrice = Math.abs(numPrice);
        if (absPrice === 0) return '0.00';
        
        // Find the order of magnitude (will be negative for numbers < 1)
        const magnitude = Math.floor(Math.log10(absPrice));
        
        // To show 4 significant digits, we need |magnitude| + 3 decimal places
        // Example: 0.001234 has magnitude -3, so we need 3 + 3 = 6 decimal places
        const neededDecimals = Math.max(2, Math.abs(magnitude) + 3);
        
        // Cap at 8 decimal places for readability
        const decimals = Math.min(neededDecimals, 8);
        
        return numPrice.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
}

