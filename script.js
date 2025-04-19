document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.querySelector('.close-modal');
    const applySettings = document.getElementById('applySettings');
    
    // Real-time price updates simulation
    const priceElement = document.querySelector('.price');
    const currentPriceElements = document.querySelectorAll('.current-position');
    let basePrice = 1.07842;
    
    // Open settings modal
    settingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'block';
    });
    
    // Close settings modal
    closeModal.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Apply settings
    applySettings.addEventListener('click', function() {
        // Here you would implement the code to apply the selected settings
        // For now, we'll just close the modal
        settingsModal.style.display = 'none';
        
        // Show a notification
        showNotification('Settings applied successfully');
    });
    
    // Currency pair selection
    const currencyPair = document.getElementById('currencyPair');
    const settingsPair = document.getElementById('settingsPair');
    
    currencyPair.addEventListener('change', function() {
        // Update both dropdowns to stay in sync
        settingsPair.value = currencyPair.value;
        
        // Update the title-bar heading
        document.querySelector('.title-bar h2').textContent = `${currencyPair.value} 4H`;
        
        // Show a loading state
        showLoadingState();
        
        // Simulate data loading
        setTimeout(function() {
            hideLoadingState();
            showNotification(`Switched to ${currencyPair.value} successfully`);
        }, 1500);
    });
    
    settingsPair.addEventListener('change', function() {
        currencyPair.value = settingsPair.value;
    });
    
    // Action buttons in the signals table
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const pair = row.cells[1].textContent;
            const type = row.cells[2].textContent.trim();
            
            if (this.textContent === 'Close') {
                // Simulate closing a position
                this.textContent = 'Closed';
                this.disabled = true;
                this.style.backgroundColor = '#607d8b';
                row.cells[6].innerHTML = '<span class="positive">+12 pips</span>';
                
                showNotification(`${type} position on ${pair} closed with profit`);
            } else if (this.textContent === 'Details') {
                // Simulate showing details
                showNotification(`Showing details for ${type} position on ${pair}`);
            }
        });
    });
    
    // Simulate real-time price updates
    function updatePrices() {
        // Random price fluctuation within small range
        const change = (Math.random() - 0.5) * 0.0010;
        basePrice += change;
        const formattedPrice = basePrice.toFixed(5);
        
        // Update main price display
        const percentChange = (change > 0 ? '+' : '') + (change * 100).toFixed(2) + '%';
        priceElement.innerHTML = `${formattedPrice} <span class="${change >= 0 ? 'positive' : 'negative'}">${percentChange}</span>`;
        
        // Update current positions relative to range high/low
        const highValue = 1.08254;
        const lowValue = 1.07625;
        
        // Update high position
        const pipsDiffHigh = ((basePrice - highValue) * 10000).toFixed(1);
        currentPriceElements[0].innerHTML = `Current: ${formattedPrice} (${pipsDiffHigh} pips from high)`;
        currentPriceElements[0].className = 'current-position ' + (pipsDiffHigh >= 0 ? 'positive' : 'negative');
        
        // Update low position
        const pipsDiffLow = ((basePrice - lowValue) * 10000).toFixed(1);
        currentPriceElements[1].innerHTML = `Current: ${formattedPrice} (${pipsDiffLow > 0 ? '+' : ''}${pipsDiffLow} pips from low)`;
        currentPriceElements[1].className = 'current-position ' + (pipsDiffLow >= 0 ? 'positive' : 'negative');
        
        // Update position in range
        const rangeWidth = highValue - lowValue;
        const positionInRange = ((basePrice - lowValue) / rangeWidth * 100).toFixed(1);
        document.querySelector('.range-width span:last-child').textContent = `Position in Range: ${positionInRange}% from bottom`;
        
        // Update progress marker
        document.querySelector('.progress-marker').style.left = `${positionInRange}%`;
    }
    
    // Start price updates
    setInterval(updatePrices, 3000);
    
    // Initial price update
    updatePrices();
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Styling
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = var(--accent-color, '#3385ff');
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            // Remove from DOM after animation
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Loading state functions
    function showLoadingState() {
        document.body.classList.add('loading');
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.border = '5px solid rgba(255,255,255,0.3)';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTop = '5px solid var(--accent-color, #3385ff)';
        spinner.style.animation = 'spin 1s linear infinite';
        
        // Add keyframes for spinner
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);
    }
    
    function hideLoadingState() {
        document.body.classList.remove('loading');
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }
    
    // Range identification simulation
    const rangeStatus = document.querySelectorAll('.status-item .status');
    
    // Simulate changing statuses
    setTimeout(() => {
        // Change liquidity sweep to "Detected"
        rangeStatus[2].textContent = 'Detected';
        rangeStatus[2].className = 'status yes';
        showNotification('Liquidity sweep detected at range low');
    }, 10000);
    
    setTimeout(() => {
        // Change CISD to "Confirmed"
        rangeStatus[3].textContent = 'Confirmed';
        rangeStatus[3].className = 'status yes';
        showNotification('CISD confirmed - potential reversal setup');
    }, 20000);
    
    setTimeout(() => {
        // Change Entry Zone to "Ready"
        rangeStatus[4].textContent = 'Ready';
        rangeStatus[4].className = 'status yes';
        showNotification('Entry zone ready - check potential setups');
    }, 30000);
});
