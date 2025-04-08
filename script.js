// DOM Elements
const cryptoList = document.getElementById('cryptoList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const favoritesList = document.getElementById('favoritesList');

// Variables
let cryptoData = [];
let favorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
let refreshInterval;

// API URL
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h';

// Initialize the app
function init() {
    loadTheme();
    fetchCryptoData();
    setupEventListeners();
    displayFavorites();
    initChartFunctionality();
    
    // Set up auto refresh every 60 seconds
    refreshInterval = setInterval(fetchCryptoData, 60000);
}

// Fetch cryptocurrency data from API
async function fetchCryptoData() {
    try {
        cryptoList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading cryptocurrency data...</p>
            </div>
        `;
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        cryptoData = await response.json();
        displayCryptoData(cryptoData);
        updateFavorites();
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        cryptoList.innerHTML = `
            <div class="error">
                <p>Failed to load cryptocurrency data. Please try again later.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Display cryptocurrency data
function displayCryptoData(data) {
    if (data.length === 0) {
        cryptoList.innerHTML = `
            <div class="error">
                <p>No cryptocurrencies found.</p>
            </div>
        `;
        return;
    }
    
    cryptoList.innerHTML = '';
    
    data.forEach(coin => {
        const isPositive = coin.price_change_percentage_24h > 0;
        const isFavorite = favorites.includes(coin.id);
        
        // Create sparkline chart data
        const sparklineData = coin.sparkline_in_7d?.price || [];
        const sparklinePoints = generateSparklinePoints(sparklineData);
        
        const coinElement = document.createElement('div');
        coinElement.className = 'crypto-card';
        coinElement.setAttribute('data-id', coin.id);
        coinElement.innerHTML = `
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${coin.id}">
                <i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>
            </button>
            <h3>
                <img src="${coin.image}" alt="${coin.name}" width="24" height="24">
                ${coin.name} <span class="symbol">${coin.symbol.toUpperCase()}</span>
            </h3>
            <p class="price">$${coin.current_price.toLocaleString()}</p>
            <p class="change ${isPositive ? 'positive' : 'negative'}">
                <i class="fas fa-${isPositive ? 'caret-up' : 'caret-down'}"></i>
                ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </p>
            <svg class="sparkline" width="100%" height="60" viewBox="0 0 100 30">
                <path d="${sparklinePoints}" fill="none" stroke="${isPositive ? 'var(--success-color)' : 'var(--danger-color)'}" stroke-width="1"></path>
            </svg>
            <button class="view-chart-btn" aria-label="View price chart">
                <i class="fas fa-chart-line"></i> View Chart
            </button>
        `;
        
        cryptoList.appendChild(coinElement);
        
        // Add event listener to favorite button
        const favoriteBtn = coinElement.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering card click
            toggleFavorite(coin.id);
        });
        
        // Add event listener to view chart button
        const viewChartBtn = coinElement.querySelector('.view-chart-btn');
        viewChartBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering card click
            showCoinChart(coin);
        });
        
        // Make the entire card clickable
        coinElement.addEventListener('click', () => {
            showCoinChart(coin);
        });

        // Function to show coin chart
        function showCoinChart(coin) {
            openChart(coin);
            addMarketData(coin);
        }
    });
}

// Generate sparkline SVG path points
function generateSparklinePoints(data) {
    if (!data || data.length === 0) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    // Normalize data to fit in the SVG viewBox
    const normalizedData = data.map(price => {
        return 30 - ((price - min) / range * 25);
    });
    
    // Generate SVG path
    let path = `M 0,${normalizedData[0]}`;
    
    normalizedData.forEach((point, index) => {
        const x = index * (100 / (normalizedData.length - 1));
        path += ` L ${x},${point}`;
    });
    
    return path;
}

// Toggle favorite status for a coin
function toggleFavorite(coinId) {
    const index = favorites.indexOf(coinId);
    
    if (index === -1) {
        favorites.push(coinId);
    } else {
        favorites.splice(index, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
    
    // Update UI
    updateFavorites();
    displayFavorites();
}

// Update favorite buttons in the main list
function updateFavorites() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const coinId = btn.getAttribute('data-id');
        const isFavorite = favorites.includes(coinId);
        
        btn.classList.toggle('active', isFavorite);
        btn.innerHTML = `<i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>`;
    });
}

// Display favorite cryptocurrencies
function displayFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-favorites">No favorites added yet</p>';
        return;
    }
    
    favoritesList.innerHTML = '';
    
    const favoritesData = cryptoData.filter(coin => favorites.includes(coin.id));
    
    favoritesData.forEach(coin => {
        const isPositive = coin.price_change_percentage_24h > 0;
        
        const coinElement = document.createElement('div');
        coinElement.className = 'crypto-card';
        coinElement.setAttribute('data-id', coin.id);
        coinElement.innerHTML = `
            <button class="favorite-btn active" data-id="${coin.id}">
                <i class="fas fa-star"></i>
            </button>
            <h3>
                <img src="${coin.image}" alt="${coin.name}" width="24" height="24">
                ${coin.name} <span class="symbol">${coin.symbol.toUpperCase()}</span>
            </h3>
            <p class="price">$${coin.current_price.toLocaleString()}</p>
            <p class="change ${isPositive ? 'positive' : 'negative'}">
                <i class="fas fa-${isPositive ? 'caret-up' : 'caret-down'}"></i>
                ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </p>
            <button class="view-chart-btn" aria-label="View price chart">
                <i class="fas fa-chart-line"></i> View Chart
            </button>
        `;
        
        favoritesList.appendChild(coinElement);
        
        // Add event listener to favorite button
        const favoriteBtn = coinElement.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering card click
            toggleFavorite(coin.id);
        });
        
        // Add event listener to view chart button
        const viewChartBtn = coinElement.querySelector('.view-chart-btn');
        viewChartBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering card click
            showCoinChart(coin);
        });
        
        // Make the entire card clickable
        coinElement.addEventListener('click', () => {
            showCoinChart(coin);
        });

        // Function to show coin chart
        function showCoinChart(coin) {
            openChart(coin);
            addMarketData(coin);
        }
    });
}

// Search functionality
function searchCrypto() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayCryptoData(cryptoData);
        return;
    }
    
    const filteredData = cryptoData.filter(coin => {
        return coin.name.toLowerCase().includes(searchTerm) || 
               coin.symbol.toLowerCase().includes(searchTerm);
    });
    
    displayCryptoData(filteredData);
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
}

// Set up event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', searchCrypto);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchCrypto();
        }
    });
    themeToggle.addEventListener('click', toggleTheme);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);