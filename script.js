// Your Twelve Data API key
const TWELVE_DATA_API_KEY = '163589e76d9a46bcac9dbb3a4c3295d9'; // Replace with your actual API key

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentPair = 'EUR/USD';
    let basePrice = 0;
    let rangeHigh = 0;
    let rangeLow = 0;
    let tradingViewWidget = null;
    
    // DOM Elements
    const currencyPair = document.getElementById('currencyPair');
    const settingsPair = document.getElementById('settingsPair');
    const pairTitle = document.getElementById('pairTitle');
    const pairStatus = document.getElementById('pairStatus');
    const currentPrice = document.getElementById('currentPrice');
    
    // Modal functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.querySelector('.close-modal');
    const applySettings = document.getElementById('applySettings');
    
    // Initialize TradingView widget
    function initTradingViewWidget(symbol) {
        // Convert forex pair to TradingView format (EUR/USD -> FX:EURUSD)
        const tvSymbol = 'FX:' + symbol.replace('/', '');
        
        if (tradingViewWidget) {
            tradingViewWidget.remove();
        }
        
        tradingViewWidget = new TradingView.widget({
            "width": "100%",
            "height": 400,
            "symbol": tvSymbol,
            "interval": "240", // 4H timeframe
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#1a2235",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "tradingview_chart",
            "studies": [
                { id: "MAExp@tv-basicstudies", inputs: { length: 200 } }, // 200 EMA
                { id: "MAExp@tv-basicstudies", inputs: { length: 50 } }   // 50 EMA
            ]
        });
    }
    
    // Initialize the widget with default pair
    setTimeout(() => {
        initTradingViewWidget(currentPair);
    }, 500);
    
    // Fetch real market data from Twelve Data API
    async function fetchMarketData(symbol) {
        showLoadingState();
        
        try {
            // Format symbol for API (EUR/USD -> EUR/USD)
            const apiSymbol = symbol;
            
            // Get current price
            const priceResponse = await fetch(`https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`);
            const priceData = await priceResponse.json();
            
            if (priceData.code) {
                // API returned an error
                throw new Error(priceData.message || 'API Error');
            }
            
            // Get 4-hour candles data
            const candlesResponse = await fetch(`https://api.twelvedata.com/time_series?symbol=${apiSymbol}&interval=4h&outputsize=30&apikey=${TWELVE_DATA_API_KEY}`);
            const candlesData = await candlesResponse.json();
            
            if (candlesData.code) {
                throw new Error(candlesData.message || 'API Error');
            }
            
            // Process the data
            basePrice = parseFloat(priceData.price);
            
            // Calculate range high and low from recent candles
            const candles = candlesData.values.slice(0, 6); // Last 24 hours (6 x 4h)
            const highs = candles.map(candle => parseFloat(candle.high));
            const lows = candles.map(candle => parseFloat(candle.low));
            
            rangeHigh = Math.max(...highs);
            rangeLow = Math.min(...lows);
            
            // Update UI with the data
            updateUIWithMarketData();
            hideLoadingState();
            
            return true;
        } catch (error) {
            console.error('Error fetching market data:', error);
            hideLoadingState();
            showNotification('Failed to fetch market data: ' + error.message, 'error');
            
            // If API fails, use simulated data as fallback
            simulateFallbackData();
            return false;
        }
    }
    
    // Fallback to simulated data if API fails
    function simulateFallbackData() {
        basePrice = 1.07842;
        rangeHigh = 1.08254;
        rangeLow = 1.07625;
        updateUIWithMarketData();
        showNotification('Using simulated data due to API limitations', 'warning');
    }
    
    // Update the UI with market data
    function updateUIWithMarketData() {
        // Format numbers
        const formattedPrice = basePrice.toFixed(5);
        const formattedHigh = rangeHigh.toFixed(5);
        const formattedLow = rangeLow.toFixed(5);
        
        // Calculate pips from high and low
        const pipsDiffHigh = ((basePrice - rangeHigh) * 10000).toFixed(1);
        const pipsDiffLow = ((basePrice - rangeLow) * 10000).toFixed(1);
        
        // Calculate position in range
        const rangeWidth = rangeHigh - rangeLow;
        const pipRangeWidth = (rangeWidth * 10000).toFixed(1);
        const positionInRange = ((basePrice - rangeLow) / rangeWidth * 100).toFixed(1);
        
        // Update price display
        currentPrice.innerHTML = `${formattedPrice} <span class="positive">LIVE</span>`;
        
        // Update range analysis
        document.getElementById('rangeHigh').textContent = formattedHigh;
        document.getElementById('rangeLow').textContent = formattedLow;
        
        // Update positions
        document.getElementById('highPosition').innerHTML = `Current: ${formattedPrice} (${pipsDiffHigh} pips from high)`;
        document.getElementById('highPosition').className = 'current-position ' + (pipsDiffHigh >= 0 ? 'positive' : 'negative');
        
        document.getElementById('lowPosition').innerHTML = `Current: ${formattedPrice} (${pipsDiffLow > 0 ? '+' : ''}${pipsDiffLow} pips from low)`;
        document.getElementById('lowPosition').className = 'current-position ' + (pipsDiffLow >= 0 ? 'positive' : 'negative');
        
        // Update range metrics
        document.getElementById('rangeWidth').textContent = `Range Width: ${pipRangeWidth} pips`;
        document.getElementById('rangePosition').textContent = `Position in Range: ${positionInRange}% from bottom`;
        
        // Update progress marker
        document.getElementById('positionMarker').style.left = `${positionInRange}%`;
        
        // Calculate potential setups
        calculatePotentialSetups();
    }
    
    // Calculate and update potential trade setups
    function calculatePotentialSetups() {
        // BUY setup
        const buyEntry = (rangeLow + 0.00020).toFixed(5); // 2 pips above low
        const buySL = (rangeLow - 0.00045).toFixed(5); // 4.5 pips below low
        const buyTP = (parseFloat(buyEntry) + (parseFloat(buyEntry) - parseFloat(buySL)) * 3).toFixed(5); // 3:1 risk reward
        
        // SELL setup
        const sellEntry = (rangeHigh - 0.00020).toFixed(5); // 2 pips below high
        const sellSL = (rangeHigh + 0.00045).toFixed(5); // 4.5 pips above high
        const sellTP = (parseFloat(sellEntry) - (parseFloat(sellSL) - parseFloat(sellEntry)) * 3).toFixed(5); // 3:1 risk reward
        
        // Update the setup displays
        document.getElementById('buyEntry').textContent = buyEntry;
        document.getElementById('buySL').textContent = buySL;
        document.getElementById('buyTP').textContent = buyTP;
        
        document.getElementById('sellEntry').textContent = sellEntry;
        document.getElementById('sellSL').textContent = sellSL;
        document.getElementById('sellTP').textContent = sellTP;
    }
    
    // Poll for price updates (limited to avoid hitting API limits)
    function startPriceUpdates() {
        // Update every 60 seconds (free API has limits)
        setInterval(async () => {
            try {
                const response = await fetch(`https://api.twelvedata.com/price?symbol=${currentPair}&apikey=${TWELVE_DATA_API_KEY}`);
                const data = await response.json();
                
                if (!data.code) { // No error
                    basePrice = parseFloat(data.price);
                    updateUIWithMarketData();
                }
            } catch (error) {
                console.error('Error updating price:', error);
                // Silently fail - we'll try again in the next interval
            }
        }, 60000); // Every 60 seconds
    }
    
    // Initial market data fetch and start updates
    fetchMarketData(currentPair).then(success => {
        if (success) {
            startPriceUpdates();
        }
    });
    
    // Handle currency pair changes
    currencyPair.addEventListener('change', function() {
        currentPair = currencyPair.value;
        settingsPair.value = currentPair;
        
        // Update display elements
        pairTitle.textContent = `${currentPair} 4H`;
        pairStatus.textContent = `${currentPair} - Sweep Detection`;
        
        // Update TradingView chart
        initTradingViewWidget(currentPair);
        
        // Fetch new data for this pair
        fetchMarketData(currentPair);
    });
    
    // Keep pairs in sync
    settingsPair.addEventListener('change', function() {
        currencyPair.value = settingsPair.value;
    });
    
    // Modal functionality
    settingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Apply settings button
    applySettings.addEventListener('click', function() {
        settingsModal.style.display = 'none';
        showNotification('Settings applied successfully');
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
                showNotification(`Showing details for ${type} position on ${pair}`);
            }
        });
    });
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Styling
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        
        // Set color based on notification type
        if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#ff9800';
            notification.style.color = 'black';
        } else {
            notification.style.backgroundColor = '#3385ff';
            notification.style.color = 'white';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    // Loading state functions
    function showLoadingState() {
        // Create loading overlay if it doesn't exist
        if (!document.querySelector('.loading-overlay')) {
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
            spinner.style.borderTop = '5px solid #3385ff';
            spinner.style.animation = 'spin 1s linear infinite';
            
            // Add keyframes for spinner
            if (!document.querySelector('#spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            overlay.appendChild(spinner);
            document.body.appendChild(overlay);
        }
    }
    
    function hideLoadingState() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }
    
    // Simulate ICT pattern detection
    function simulateICTPatterns() {
        setTimeout(() => {
            // Change liquidity sweep to "Detected"
            document.getElementById('liquidityStatus').textContent = 'Detected';
            document.getElementById('liquidityStatus').className = 'status yes';
            showNotification('Liquidity sweep detected at range low');
        }, 15000);
        
        setTimeout(() => {
            // Change CISD to "Confirmed"
            document.getElementById('cisdStatus').textContent = 'Confirmed';
            document.getElementById('cisdStatus').className = 'status yes';
            showNotification('CISD confirmed - potential reversal setup');
        }, 30000);
        
        setTimeout(() => {
            // Change Entry Zone to "Ready"
            document.getElementById('entryStatus').textContent = 'Ready';
            document.getElementById('entryStatus').className = 'status yes';
            showNotification('Entry zone ready - check potential setups');
        }, 45000);
    }
    
    // Start ICT pattern simulation
    simulateICTPatterns();
});
