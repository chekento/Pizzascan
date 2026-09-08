// Wait for the DOM and all resources to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize WebsimSocket for persisted database
    const room = new WebsimSocket();
    
    // Add a failsafe timeout to prevent app from being stuck on loading screen
    const loadingFailsafe = setTimeout(() => {
        hideLoadingMessage();
        showErrorMessage("Loading timed out. Please refresh the page if map data doesn't appear.");
    }, 15000); // 15 second failsafe
    
    // Track app state
    const appState = {
        darkMode: localStorage.getItem('darkMode') === 'true',
        filtersCollapsed: localStorage.getItem('filtersCollapsed') === 'true',
        panelMinimized: localStorage.getItem('panelMinimized') === 'true',
        locationAllowed: localStorage.getItem('locationAllowed'),
        currentTab: localStorage.getItem('currentTab') || 'popular-styles',
        lastLocation: JSON.parse(localStorage.getItem('lastLocation')) || null,
        loadingState: 'loading', // loading, loaded, error
        achievements: JSON.parse(localStorage.getItem('achievements')) || {},
        userProfile: JSON.parse(localStorage.getItem('userProfile')) || {
            favoriteStyle: 'neapolitan',
            favoriteToppings: ['cheese', 'pepperoni'],
            joinDate: new Date().toISOString()
        }
    };
    
    // Apply initial dark mode if set
    if (appState.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Initialize the map
    const map = L.map('map', {
        zoomControl: false, // We'll add zoom control manually to position it better
        attributionControl: true,
        minZoom: 3,
        maxZoom: 19
    });
    
    // Set initial view (will be replaced by user location if allowed)
    if (appState.lastLocation) {
        map.setView([appState.lastLocation.lat, appState.lastLocation.lng], appState.lastLocation.zoom);
    } else {
        map.setView([40.7128, -74.0060], 13); // Default to NYC
    }
    
    // Add zoom control in a better position
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add the OpenStreetMap tile layer
    const lightTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    
    const darkTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>'
    });
    
    // Set active tile layer based on dark mode
    if (appState.darkMode) {
        darkTileLayer.addTo(map);
    } else {
        lightTileLayer.addTo(map);
    }

    // Define UI elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const themeToggle = document.getElementById('theme-toggle');
    const collapseFilters = document.getElementById('collapse-filters');
    const filterContent = document.querySelector('.filter-content');
    const settingsPopupOverlay = document.getElementById('settings-popup-overlay');
    const allowButton = document.getElementById('allow-location');
    const denyButton = document.getElementById('deny-location');
    const closeSettingsButton = document.getElementById('close-settings');

    const filterControls = document.getElementById('filter-controls');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const savedSpotsCheckbox = document.getElementById('saved-spots-checkbox');
    const wantToVisitCheckbox = document.getElementById('want-to-visit-checkbox'); 
    const showClosedCheckbox = document.getElementById('show-closed-checkbox');
    const showVisitedCheckbox = document.getElementById('show-visited-checkbox');
    const mapContainer = document.getElementById('map');

    // AI Search Elements
    const aiSearchButton = document.getElementById('ai-search-button');
    const aiResultsArea = document.getElementById('ai-results-area');
    const aiStatusElement = document.getElementById('ai-status');
    const aiSearchOutput = document.getElementById('ai-search-output');
    const aiSearchActions = document.getElementById('ai-search-actions');
    const saveAllButton = document.getElementById('save-all-spots');
    const closeAiResultsButton = document.getElementById('close-ai-results');

    // AI Recommendation Elements
    const aiRecommendationButton = document.getElementById('ai-recommendation-button');
    const aiRecommendationArea = document.getElementById('ai-recommendation-area');
    const closeAiRecommendationButton = document.getElementById('close-ai-recommendation');
    const generateRecommendationsButton = document.getElementById('generate-recommendations');
    const recommendationsResults = document.getElementById('recommendations-results');

    // Pizza Crawl Elements
    const pizzaCrawlButton = document.getElementById('pizza-crawl-button');
    const pizzaCrawlArea = document.getElementById('pizza-crawl-area');
    const closePizzaCrawlButton = document.getElementById('close-pizza-crawl');
    const generateCrawlButton = document.getElementById('generate-crawl');
    const crawlResults = document.getElementById('crawl-results');
    const crawlActions = document.getElementById('crawl-actions');
    const saveCrawlButton = document.getElementById('save-crawl');
    const shareCrawlButton = document.getElementById('share-crawl');

    // Photo Analyzer Elements
    const photoAnalyzerButton = document.getElementById('photo-analyzer-button');
    const photoAnalyzerArea = document.getElementById('photo-analyzer-area');
    const closePhotoAnalyzerButton = document.getElementById('close-photo-analyzer');
    const dropZone = document.getElementById('drop-zone');
    const photoUpload = document.getElementById('photo-upload');
    const takePhotoButton = document.getElementById('take-photo');
    const photoPreview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    const analyzePhotoButton = document.getElementById('analyze-photo');
    const analysisResults = document.getElementById('analysis-results');

    // Trend Insights Elements
    const trendInsightsButton = document.getElementById('trend-insights-button');
    const trendInsightsArea = document.getElementById('trend-insights-area');
    const closeTrendInsightsButton = document.getElementById('close-trend-insights');
    const insightsTabs = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Saved Spots Elements
    const savedSpotsButton = document.getElementById('saved-spots-button');
    const savedSpotsArea = document.getElementById('saved-spots-area');
    const savedSpotsList = document.getElementById('saved-spots-list');
    const closeSavedSpotsButton = document.getElementById('close-saved-spots');

    // Want to Visit Elements
    const wantToVisitButton = document.getElementById('want-to-visit-button');
    const wantToVisitArea = document.getElementById('want-to-visit-area');
    const wantToVisitListElement = document.getElementById('want-to-visit-list'); 
    const closeWantToVisitButton = document.getElementById('close-want-to-visit');
    const sortDistanceButton = document.getElementById('sort-distance-button');
    const exportJsonButton = document.getElementById('export-json-button');
    const importJsonButton = document.getElementById('import-json-button');
    const importJsonInput = document.getElementById('import-json-input');

    // Visited Places Elements
    const visitedPlacesButton = document.getElementById('visited-places-button');
    const visitedPlacesArea = document.getElementById('visited-places-area');
    const visitedPlacesListElement = document.getElementById('visited-places-list'); 
    const closeVisitedPlacesButton = document.getElementById('close-visited-places');
    const sortVisitedDistanceButton = document.getElementById('sort-visited-distance-button');
    const exportVisitedJsonButton = document.getElementById('export-visited-json-button');
    const importVisitedJsonButton = document.getElementById('import-visited-json-button');
    const importVisitedJsonInput = document.getElementById('import-visited-json-input');

    // Rating Elements
    const ratingPopupOverlay = document.getElementById('rating-popup-overlay');
    const ratingPopupContent = document.getElementById('rating-popup-content');
    const ratingForm = document.getElementById('rating-form');
    const ratingPlaceNameElement = document.getElementById('rating-place-name');
    const ratingPlaceIdInput = document.getElementById('rating-place-id');
    const ratingLatInput = document.getElementById('rating-lat');
    const ratingLngInput = document.getElementById('rating-lng');
    const closeRatingButton = document.getElementById('close-rating');
    const submitRatingButton = document.getElementById('submit-rating');
    const ratingSliders = document.querySelectorAll('#rating-form input[type="range"]');

    // Ratings Database Elements
    const ratingsDatabaseButton = document.getElementById('ratings-database-button');
    const ratingsDatabaseArea = document.getElementById('ratings-database-area');
    const topRatedTable = document.getElementById('top-rated-table');
    const ratingsTable = document.getElementById('ratings-table');
    const ratingSearchInput = document.getElementById('rating-search-input');
    const ratingSortSelect = document.getElementById('rating-sort-select');
    const closeRatingsDatabaseButton = document.getElementById('close-ratings-database');

    const systemTimeDisplay = document.getElementById('system-time-display');
    const mapMessageArea = document.getElementById('map-message-area'); 
    const mapSearchInput = document.getElementById('map-search-input');
    const mapSearchBtn = document.getElementById('map-search-btn');
    const searchbarSuggestions = document.getElementById('searchbar-suggestions');
    const searchbarContainer = document.getElementById('searchbar-container');
    
    const locationButton = document.getElementById('location-button');
    const controlPanel = document.getElementById('control-panel');
    const panelToggleBtn = document.getElementById('panel-toggle-btn');

    let loadedPizzaPlaces = []; 
    let messageTimeout; 
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            appState.darkMode = isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            
            // Update icon
            themeToggle.innerHTML = isDarkMode 
                ? '<i class="fas fa-sun"></i>' 
                : '<i class="fas fa-moon"></i>';
            
            // Switch map tiles
            if (isDarkMode) {
                map.removeLayer(lightTileLayer);
                darkTileLayer.addTo(map);
            } else {
                map.removeLayer(darkTileLayer);
                lightTileLayer.addTo(map);
            }
        });
        
        // Set initial icon
        themeToggle.innerHTML = appState.darkMode 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
    
    // Filter collapse functionality
    if (collapseFilters && filterContent) {
        // Apply initial state
        if (appState.filtersCollapsed) {
            filterContent.style.display = 'none';
            collapseFilters.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
        
        collapseFilters.addEventListener('click', () => {
            appState.filtersCollapsed = !appState.filtersCollapsed;
            localStorage.setItem('filtersCollapsed', appState.filtersCollapsed);
            
            if (appState.filtersCollapsed) {
                filterContent.style.display = 'none';
                collapseFilters.innerHTML = '<i class="fas fa-chevron-down"></i>';
            } else {
                filterContent.style.display = 'block';
                collapseFilters.innerHTML = '<i class="fas fa-chevron-up"></i>';
            }
        });
    }
    
    // Panel toggle functionality
    if (panelToggleBtn && controlPanel) {
        // Apply initial state
        if (appState.panelMinimized) {
            controlPanel.classList.add('minimized');
            panelToggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }
        
        panelToggleBtn.addEventListener('click', () => {
            appState.panelMinimized = !appState.panelMinimized;
            localStorage.setItem('panelMinimized', appState.panelMinimized);
            
            controlPanel.classList.toggle('minimized', appState.panelMinimized);
            panelToggleBtn.innerHTML = appState.panelMinimized 
                ? '<i class="fas fa-chevron-right"></i>' 
                : '<i class="fas fa-chevron-left"></i>';
        });
    }
    
    // Tabs functionality
    if (insightsTabs && tabPanes) {
        insightsTabs.forEach(tab => {
            // Set initial active tab
            if (tab.dataset.tab === appState.currentTab) {
                tab.classList.add('active');
                document.getElementById(appState.currentTab).classList.add('active');
            }
            
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update active tab
                insightsTabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Save current tab
                appState.currentTab = tabId;
                localStorage.setItem('currentTab', tabId);
            });
        });
    }

    function showMapMessage(message, type = 'info', duration = 3000) {
        if (!mapMessageArea) return;
        mapMessageArea.textContent = message;
        mapMessageArea.className = `map-message ${type}`; 
        mapMessageArea.style.display = 'block';
        clearTimeout(messageTimeout);
        if (duration > 0) {
            messageTimeout = setTimeout(() => {
                mapMessageArea.style.display = 'none';
            }, duration);
        }
    }
    function showLoadingMessage(message) { 
        if (loadingMessage) loadingMessage.textContent = message;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        appState.loadingState = 'loading';
        showMapMessage(message, 'loading', 0); 
    }
    
    function hideLoadingMessage() { 
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        appState.loadingState = 'loaded';
        if (mapMessageArea && mapMessageArea.classList.contains('loading')) {
            mapMessageArea.style.display = 'none';
        }
        // Clear the failsafe timeout when loading completes normally
        clearTimeout(loadingFailsafe);
    }
    
    function showErrorMessage(message) { 
        appState.loadingState = 'error';
        showMapMessage(message, 'error', 5000);
    }
    
    function showInfoMessage(message) { 
        showMapMessage(message, 'info', 3000);
    }
    
    function hideInfoMessage() { 
        if (mapMessageArea && mapMessageArea.classList.contains('info')) {
            mapMessageArea.style.display = 'none';
        }
    }

    function updateSystemTime() {
        const now = new Date();
        const options = { 
            weekday: 'short',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true
        };
        if (systemTimeDisplay) {
            systemTimeDisplay.textContent = now.toLocaleString(undefined, options);
        }
    }
    updateSystemTime();
    setInterval(updateSystemTime, 1000);

    const pizzaMarkers = {
        pizzeria: L.layerGroup(), 
        cafe: L.layerGroup(),
        fast_food: L.layerGroup(),
        food_truck: L.layerGroup(),
        vending_pizza: L.layerGroup(),
        other: L.layerGroup(),
    };

    // Define marker icons with better styling
    const EmojiIcon = L.divIcon({
        className: 'emoji-marker', 
        iconSize: [32, 32], 
        iconAnchor: [16, 32], 
        popupAnchor: [0, -30] 
    });

    const icons = {
        pizzeria: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<img src="pizza-icon.png" alt="Pizza" width="20" height="20">' }),
        cafe: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<img src="cafe-icon.png" alt="Cafe" width="20" height="20">' }),
        fast_food: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<img src="fast-food-icon.png" alt="Fast Food" width="20" height="20">' }), 
        food_truck: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<img src="food-truck-icon.png" alt="Food Truck" width="20" height="20">' }),
        vending_pizza: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<img src="vending-icon.png" alt="Vending Machine" width="20" height="20">' }), 
        other: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<i class="fas fa-question"></i>' }), 
        secret_spot: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<i class="fas fa-sparkles"></i>' }), 
        user_location: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<i class="fas fa-user-circle"></i>', className: 'emoji-marker pulse' }), 
        want_to_visit: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<i class="fas fa-star"></i>' }),
        visited: (emoji) => L.divIcon({ ...EmojiIcon.options, html: emoji || '<i class="fas fa-check-circle"></i>' })
    };

    const openPlacesLayer = L.layerGroup();
    const closedPlacesLayer = L.layerGroup();
    const aiSecretSpotsLayer = L.layerGroup();
    const savedSpotsLayer = L.layerGroup(); 
    const wantToVisitLayer = L.layerGroup();
    const visitedPlacesLayer = L.layerGroup();

    let userLocationMarker = null;
    let currentAiResults = [];
    let currentRecommendations = [];
    let currentCrawlRoute = null;
    
    let wantToVisitPlaces = JSON.parse(localStorage.getItem('wantToVisitPlaces')) || [];
    let visitedPlaces = JSON.parse(localStorage.getItem('visitedPlaces')) || [];

    window.closeAllPanels = function() {
        const panels = document.querySelectorAll('.panel-modal');
        panels.forEach(panel => {
            panel.style.display = 'none';
        });
    };
    
    window.openPanel = function(panel) {
        window.closeAllPanels(); 
        if (panel) {
            panel.style.display = 'flex';
            if (panel.querySelector('.modal-content')) {
                panel.querySelector('.modal-content').scrollTop = 0;
            }
        }
    };

    window.openRatingPopup = function(placeId, placeName, lat, lng) { 
        ratingPopupOverlay.style.display = 'flex';
        ratingPlaceIdInput.value = placeId;
        ratingPlaceNameElement.textContent = placeName;
        ratingLatInput.value = lat;
        ratingLngInput.value = lng;
        ratingForm.reset(); 
        ratingSliders.forEach(slider => {
            const valueSpan = slider.parentElement.querySelector('.rating-value');
            if (valueSpan) {
                 if (slider.id === 'restaurant-weight' || slider.id === 'pizza-weight') {
                    valueSpan.textContent = slider.value + '%';
                } else {
                    valueSpan.textContent = slider.value;
                }
            }
        });
        const restaurantWeightSlider = document.getElementById('restaurant-weight');
        const pizzaWeightSlider = document.getElementById('pizza-weight');
        pizzaWeightSlider.value = 100 - parseInt(restaurantWeightSlider.value);
        restaurantWeightSlider.parentElement.querySelector('.rating-value').textContent = restaurantWeightSlider.value + '%';
        pizzaWeightSlider.parentElement.querySelector('.rating-value').textContent = pizzaWeightSlider.value + '%';

        function keyListener(e) {
            if (e.key === "Escape") {
                closeRatingPopup();
            }
        }
        function closeRatingPopup() {
            ratingPopupOverlay.style.display = 'none';
            window.removeEventListener('keydown', keyListener);
        }
        window.addEventListener('keydown', keyListener);
        ratingPopupOverlay.onclick = function(e) {
            if (e.target === ratingPopupOverlay) {
                closeRatingPopup();
            }
        };
        closeRatingButton.onclick = closeRatingPopup; 
    };

    function saveWantToVisitPlaces() {
        localStorage.setItem('wantToVisitPlaces', JSON.stringify(wantToVisitPlaces));
        renderWantToVisitList();
        updateWantToVisitMarkers();
        updateMarkerVisibility();
    }

    function saveVisitedPlaces() {
        localStorage.setItem('visitedPlaces', JSON.stringify(visitedPlaces));
        renderVisitedPlacesList();
        updateVisitedMarkers();
        updateMarkerVisibility(); 
    }
    
    function addToWantToVisit(placeData) {
        if (!wantToVisitPlaces.some(p => p.placeId === placeData.placeId)) {
            wantToVisitPlaces.push(placeData);
            saveWantToVisitPlaces();
            showInfoMessage(`${placeData.name} added to 'Want to Visit' list.`);
        }
    }

    function removeFromWantToVisit(placeId) {
        wantToVisitPlaces = wantToVisitPlaces.filter(p => p.placeId !== placeId);
        saveWantToVisitPlaces();
        showInfoMessage(`Removed from 'Want to Visit' list.`);
    }

    function addToVisited(placeData) {
        if (!visitedPlaces.some(p => p.placeId === placeData.placeId)) {
            visitedPlaces.push(placeData);
            saveVisitedPlaces();
            showInfoMessage(`${placeData.name} marked as visited.`);
            
            // Check for achievements
            if (visitedPlaces.length === 1) {
                unlockAchievement('first_pizza');
            } else if (visitedPlaces.length === 5) {
                unlockAchievement('pizza_explorer');
            } else if (visitedPlaces.length === 20) {
                unlockAchievement('pizza_connoisseur');
            }
        }
    }

    function removeFromVisited(placeId) {
        visitedPlaces = visitedPlaces.filter(p => p.placeId !== placeId);
        saveVisitedPlaces();
        showInfoMessage(`Marked as unvisited.`);
    }
    
    function renderWantToVisitList() {
        if (!wantToVisitListElement) return;
        wantToVisitListElement.innerHTML = ''; 
        if (wantToVisitPlaces.length === 0) {
            wantToVisitListElement.innerHTML = '<p class="empty-state"><i class="fas fa-info-circle"></i> No places added to your visit list yet.</p>';
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'places-list';
        wantToVisitPlaces.forEach(place => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="place-info">
                              <span class="place-name">${place.name}</span>
                              <span class="place-type">${place.type}</span>
                              ${place.distance ? `<span class="place-distance">${place.distance.toFixed(1)} km away</span>` : ''}
                              <span class="added-date">Added on ${new Date(place.addedAt).toLocaleDateString()}</span>
                            </div>
                            <div class="place-actions">
                              <button class="place-action-btn view-on-map" data-lat="${place.lat}" data-lng="${place.lng}"><i class="fas fa-map-marker-alt"></i> View</button>
                              <button class="place-action-btn mark-as-visited" data-id="${place.placeId}" data-name="${place.name}" data-lat="${place.lat}" data-lng="${place.lng}" data-type="${place.type}"><i class="fas fa-check"></i> Mark Visited</button>
                              <button class="place-action-btn remove-from-visit-list" data-id="${place.placeId}"><i class="fas fa-times"></i> Remove</button>
                            </div>`;
            ul.appendChild(li);
        });
        wantToVisitListElement.appendChild(ul);

        ul.querySelectorAll('.remove-from-visit-list').forEach(btn => {
            btn.onclick = (e) => removeFromWantToVisit(e.target.closest('button').dataset.id);
        });
        
        ul.querySelectorAll('.mark-as-visited').forEach(btn => {
            btn.onclick = (e) => {
                const button = e.target.closest('button');
                const placeData = {
                    placeId: button.dataset.id,
                    name: button.dataset.name,
                    lat: parseFloat(button.dataset.lat),
                    lng: parseFloat(button.dataset.lng),
                    type: button.dataset.type,
                    visitedAt: new Date().toISOString()
                };
                addToVisited(placeData);
                
                // Check for achievements
                checkAchievements();
                
                const marker = findMarkerByPlaceId(placeData.placeId);
                if (marker) marker.closePopup();
            };
        });
        
        ul.querySelectorAll('.view-on-map').forEach(btn => {
            btn.onclick = (e) => {
                const button = e.target.closest('button');
                map.setView([parseFloat(button.dataset.lat), parseFloat(button.dataset.lng)], 16);
                window.closeAllPanels();
            };
        });
    }

    function renderVisitedPlacesList() {
        if (!visitedPlacesListElement) return;
        visitedPlacesListElement.innerHTML = ''; 
        if (visitedPlaces.length === 0) {
            visitedPlacesListElement.innerHTML = '<p class="empty-state"><i class="fas fa-info-circle"></i> No places marked as visited yet.</p>';
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'places-list';
        visitedPlaces.forEach(place => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="place-info">
                              <span class="place-name">${place.name}</span>
                              <span class="place-type">${place.type}</span>
                              ${place.distance ? `<span class="place-distance">${place.distance.toFixed(1)} km away</span>` : ''}
                              <span class="visit-date">Visited on ${new Date(place.visitedAt).toLocaleDateString()}</span>
                            </div>
                            <div class="place-actions">
                              <button class="place-action-btn view-on-map" data-lat="${place.lat}" data-lng="${place.lng}"><i class="fas fa-map-marker-alt"></i> View</button>
                              <button class="place-action-btn rate-this-place" data-id="${place.placeId}" data-name="${place.name}" data-lat="${place.lat}" data-lng="${place.lng}"><i class="fas fa-star"></i> Rate</button>
                              <button class="place-action-btn remove-from-visited-list" data-id="${place.placeId}"><i class="fas fa-times"></i> Unmark</button>
                            </div>`;
            ul.appendChild(li);
        });
        visitedPlacesListElement.appendChild(ul);
        
        ul.querySelectorAll('.remove-from-visited-list').forEach(btn => {
            btn.onclick = (e) => removeFromVisited(e.target.closest('button').dataset.id);
        });
        
        ul.querySelectorAll('.rate-this-place').forEach(btn => {
            btn.onclick = (e) => {
                const button = e.target.closest('button');
                window.openRatingPopup(
                    button.dataset.id,
                    button.dataset.name,
                    parseFloat(button.dataset.lat),
                    parseFloat(button.dataset.lng)
                );
            };
        });
        
        ul.querySelectorAll('.view-on-map').forEach(btn => {
            btn.onclick = (e) => {
                const button = e.target.closest('button');
                map.setView([parseFloat(button.dataset.lat), parseFloat(button.dataset.lng)], 16);
                window.closeAllPanels();
            };
        });
    }
    
    function updateWantToVisitMarkers() {
        wantToVisitLayer.clearLayers();
        wantToVisitPlaces.forEach(place => {
            const marker = L.marker([place.lat, place.lng], { icon: icons.want_to_visit() })
                .bindPopup(createPopupContent({
                    name: place.name,
                    type: place.type,
                    isOpen: place.isOpen,
                    openingHours: place.openingHours,
                    website: place.website,
                    phone: place.phone,
                    placeId: place.placeId,
                    avgRating: null,
                    ratingCount: 0,
                    lat: place.lat,
                    lng: place.lng,
                    isWantToVisit: true
                }));
            wantToVisitLayer.addLayer(marker);
        });
    }

    function updateVisitedMarkers() {
        visitedPlacesLayer.clearLayers();
        visitedPlaces.forEach(place => {
            const marker = L.marker([place.lat, place.lng], { icon: icons.visited() })
                .bindPopup(createPopupContent({
                    name: place.name,
                    type: place.type,
                    isOpen: true, // Doesn't matter for visited
                    openingHours: "",
                    website: "",
                    phone: "",
                    placeId: place.placeId,
                    avgRating: null,
                    ratingCount: 0,
                    lat: place.lat,
                    lng: place.lng,
                    isVisited: true
                }));
            visitedPlacesLayer.addLayer(marker);
        });
    }
    
    // Export JSON functionality
    function exportAsJson(data, filename) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    
    // Import JSON functionality
    function handleJsonImport(event, isVisitedPlaces = false) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    throw new Error("Imported data is not in the correct format");
                }
                
                if (isVisitedPlaces) {
                    visitedPlaces = data;
                    saveVisitedPlaces();
                    showInfoMessage("Visited places imported successfully!");
                } else {
                    wantToVisitPlaces = data;
                    saveWantToVisitPlaces();
                    showInfoMessage("Want to visit places imported successfully!");
                }
            } catch (error) {
                showErrorMessage("Error importing data: " + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    // Sort places by distance from current location
    function sortPlacesByDistance(places, isVisitedPlaces = false) {
        if (!userLocationMarker) {
            showErrorMessage("Your location is needed to sort by distance");
            return places;
        }
        
        const userLat = userLocationMarker.getLatLng().lat;
        const userLng = userLocationMarker.getLatLng().lng;
        
        // Calculate distances
        const placesWithDistance = places.map(place => {
            const distance = calculateDistance(userLat, userLng, place.lat, place.lng);
            return { ...place, distance };
        });
        
        // Sort by distance
        placesWithDistance.sort((a, b) => a.distance - b.distance);
        
        // Update and render the sorted list
        if (isVisitedPlaces) {
            visitedPlaces = placesWithDistance;
            renderVisitedPlacesList();
        } else {
            wantToVisitPlaces = placesWithDistance;
            renderWantToVisitList();
        }
        
        showInfoMessage("Places sorted by distance from your location");
        return placesWithDistance;
    }
    
    // Calculate distance between two points using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return distance;
    }
    
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // Add event listeners for import/export buttons
    if (exportJsonButton) {
        exportJsonButton.addEventListener('click', () => {
            exportAsJson(wantToVisitPlaces, 'want-to-visit-places.json');
        });
    }
    
    if (importJsonButton && importJsonInput) {
        importJsonButton.addEventListener('click', () => {
            importJsonInput.click();
        });
        
        importJsonInput.addEventListener('change', (e) => {
            handleJsonImport(e, false);
        });
    }
    
    if (exportVisitedJsonButton) {
        exportVisitedJsonButton.addEventListener('click', () => {
            exportAsJson(visitedPlaces, 'visited-places.json');
        });
    }
    
    if (importVisitedJsonButton && importVisitedJsonInput) {
        importVisitedJsonButton.addEventListener('click', () => {
            importVisitedJsonInput.click();
        });
        
        importVisitedJsonInput.addEventListener('change', (e) => {
            handleJsonImport(e, true);
        });
    }
    
    // Sort buttons functionality
    if (sortDistanceButton) {
        sortDistanceButton.addEventListener('click', () => {
            sortPlacesByDistance(wantToVisitPlaces, false);
        });
    }
    
    if (sortVisitedDistanceButton) {
        sortVisitedDistanceButton.addEventListener('click', () => {
            sortPlacesByDistance(visitedPlaces, true);
        });
    }
    
    let ratingsCache = [];
    let isRatingsCacheLoaded = false;
    
    room.collection('pizza_rating').subscribe(function(ratings) {
        ratingsCache = ratings;
        isRatingsCacheLoaded = true;
        console.log("Ratings updated, new count:", ratings.length);
        if (ratingsDatabaseArea.style.display === 'flex') {
            displayRatingsDatabase(); 
        }
        refreshMapPopups();
    });
    
    async function addRating(rating) {
        try {
            rating.created_at = new Date().toISOString(); 
            
            const result = await room.collection('pizza_rating').create(rating);
            console.log("Added rating:", result);
            
            // Check for achievements
            const userRatingsCount = ratingsCache.filter(r => r.username === currentUser?.username).length;
            
            if (userRatingsCount === 0) { // This is the first rating (not counting the one just added)
                unlockAchievement('first_rating');
            } else if (userRatingsCount === 9) { // This is the 10th rating
                unlockAchievement('critic');
            }
            
            // Check for perfect score
            if (rating.firstBite >= 9.5) {
                unlockAchievement('perfect_score');
            }
            
            return result.id;
        } catch (error) {
            console.error("Error adding rating:", error);
            showErrorMessage("Failed to save rating. Please try again.");
            return null;
        }
    }
    
    function getRatingsForPlace(placeId) {
        return ratingsCache.filter(rating => rating.placeId === placeId);
    }
    
    function calculateAverageRating(placeId) {
        const placeRatings = getRatingsForPlace(placeId);
        if (placeRatings.length === 0) return null;
        
        const totalScore = placeRatings.reduce((sum, rating) => {
            const restaurantWeight = (rating.restaurantWeight / 100) || 0.5; 
            const pizzaWeight = (rating.pizzaWeight / 100) || 0.5; 
            
            const totalRestaurantWeightPercent = 15 + 15 + 10 + 10; 
            const restaurantScoreContribution = (
                (rating.ambiance * 0.15) +
                (rating.service * 0.15) +
                (rating.cleanliness * 0.10) +
                (rating.value * 0.10)
            ) / (totalRestaurantWeightPercent / 100); 
            
            const totalPizzaWeightPercent = 15 + 10 + 10 + 10 + 5; 
             const pizzaScoreContribution = (
                (rating.crust * 0.15) +
                (rating.sauce * 0.10) +
                (rating.cheese * 0.10) +
                (rating.toppings * 0.10) +
                (rating.bake * 0.05)
            ) / (totalPizzaWeightPercent / 100); 
            
            const overallWeightedScore = (restaurantScoreContribution * restaurantWeight + pizzaScoreContribution * pizzaWeight) * 5; 
            
            const firstBiteBonus = rating.firstBite ? (parseFloat(rating.firstBite) / 10) * 1.25 : 0; 
            
            return sum + overallWeightedScore + firstBiteBonus;
        }, 0);
        
        return (totalScore / placeRatings.length).toFixed(1);
    }
    
    async function deleteRating(ratingId) {
        try {
            await room.collection('pizza_rating').delete(ratingId);
            console.log("Deleted rating:", ratingId);
            return true;
        } catch (error) {
            console.error("Error deleting rating:", error);
            showErrorMessage("Failed to delete rating. You can only delete your own ratings.");
            return false;
        }
    }
    
    function refreshMapPopups() {
        Object.values(pizzaMarkers).forEach(layerGroup => {
            layerGroup.eachLayer(marker => {
                if (marker.placeId) {
                    const avgRating = calculateAverageRating(marker.placeId);
                    const ratingCount = getRatingsForPlace(marker.placeId).length;
                    const popupContent = createPopupContent({
                        name: marker.placeName,
                        type: getMarkerTypeName(marker.getIcon().options.html), 
                        isOpen: marker.isOpen,
                        openingHours: marker.openingHours,
                        website: marker.website,
                        phone: marker.phone,
                        placeId: marker.placeId,
                        avgRating: avgRating,
                        ratingCount: ratingCount,
                        lat: marker.getLatLng().lat,
                        lng: marker.getLatLng().lng,
                        isVisited: visitedPlaces.some(p => p.placeId === marker.placeId),
                        isWantToVisit: wantToVisitPlaces.some(p => p.placeId === marker.placeId)
                    });
                    marker.bindPopup(popupContent);
                }
            });
        });
    }
    
    function createPopupContent(place) {
        let popupContent = `
            <div class="popup-content">
                <h3 class="popup-title">${place.name}</h3>
                <div class="popup-details">
                    <p><i class="fas fa-utensils"></i> <strong>Type:</strong> ${place.type}</p>
                    <p class="status-${place.isOpen ? 'open' : 'closed'}">
                        <i class="fas fa-${place.isOpen ? 'check-circle' : 'times-circle'}"></i> 
                        <strong>Status:</strong> ${place.isOpen ? 'Open' : 'Closed'}
                    </p>`;
        
        if (place.isVisited) {
            popupContent += `<div class="visited-badge"><i class="fas fa-check"></i> Visited</div>`;
        }
        
        if (place.isWantToVisit) {
            popupContent += `<div class="want-to-visit-badge"><i class="fas fa-star"></i> Want to Visit</div>`;
        }

        if (place.openingHours) {
            popupContent += `<p><i class="fas fa-clock"></i> <strong>Hours:</strong> ${place.openingHours}</p>`;
        }
        
        if (place.website) {
            const formattedWebsite = place.website.startsWith('http://') || place.website.startsWith('https://') ? place.website : `http://${place.website}`;
            popupContent += `<p><i class="fas fa-globe"></i> <a href="${formattedWebsite}" target="_blank">${place.website}</a></p>`;
        }
        
        if (place.phone) {
            popupContent += `<p><i class="fas fa-phone"></i> <a href="tel:${place.phone}">${place.phone}</a></p>`;
        }
        
        if (place.avgRating) {
            popupContent += `<p><i class="fas fa-star"></i> <strong>Rating:</strong> <span class="rating-badge">${place.avgRating}/25</span> (${place.ratingCount} rating${place.ratingCount !== 1 ? 's' : ''})</p>`;
        } else {
            popupContent += `<p><i class="fas fa-star"></i> <strong>Rating:</strong> Not yet rated</p>`;
        }
        
        popupContent += `</div><div class="popup-actions">`;
        
        if (place.isWantToVisit) {
            popupContent += `<button class="popup-btn remove-from-visit-btn" data-place-id="${place.placeId}"><i class="fas fa-star"></i> Remove from Visit List</button>`;
        } else {
            popupContent += `<button class="popup-btn add-to-visit-btn" data-place-id="${place.placeId}" data-place-name="${escapeHtml(place.name)}" data-lat="${place.lat}" data-lng="${place.lng}" data-type="${escapeHtml(place.type)}" data-hours="${escapeHtml(place.openingHours || '')}" data-website="${escapeHtml(place.website || '')}" data-phone="${escapeHtml(place.phone || '')}" data-is-open="${place.isOpen ? 'true' : 'false'}"><i class="fas fa-star"></i> Add to Visit List</button>`;
        }
        
        if (place.isVisited) {
            popupContent += `<button class="popup-btn unmark-visited-btn" data-place-id="${place.placeId}"><i class="fas fa-check"></i> Mark as Unvisited</button>`;
        } else {
            popupContent += `<button class="popup-btn mark-visited-btn" data-place-id="${place.placeId}" data-place-name="${escapeHtml(place.name)}" data-lat="${place.lat}" data-lng="${place.lng}" data-type="${escapeHtml(place.type)}" data-hours="${escapeHtml(place.openingHours || '')}" data-website="${escapeHtml(place.website || '')}" data-phone="${escapeHtml(place.phone || '')}" data-is-open="${place.isOpen ? 'true' : 'false'}"><i class="fas fa-check"></i> Mark as Visited</button>`;
        }
        
        popupContent += `<button class="popup-btn rate-place-btn" data-place-id="${place.placeId}" data-place-name="${escapeHtml(place.name)}" data-lat="${place.lat}" data-lng="${place.lng}"><i class="fas fa-star-half-alt"></i> Rate This Place</button>`;
        
        if (userLocationMarker) {
            popupContent += `<button class="popup-btn directions-btn" data-lat="${place.lat}" data-lng="${place.lng}" data-is-open="${place.isOpen}" data-name="${escapeHtml(place.name)}" data-hours="${escapeHtml(place.openingHours || '')}"><i class="fas fa-directions"></i> Get Directions</button>`;
        }
        
        popupContent += `</div></div>`;
        
        return popupContent;
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getMarkerTypeName(htmlContent) { 
        if (typeof htmlContent !== 'string') return 'Pizza Place';
        if (htmlContent.includes('pizza-icon.png')) return 'Pizzeria';
        if (htmlContent.includes('cafe-icon.png')) return 'Cafe';
        if (htmlContent.includes('fast-food-icon.png')) return 'Fast Food';
        if (htmlContent.includes('food-truck-icon.png')) return 'Food Truck';
        if (htmlContent.includes('vending-icon.png')) return 'Vending Machine';
        if (htmlContent.includes('fa-question')) return 'Other';
        if (htmlContent.includes('fa-sparkles')) return 'Secret Spot';
        if (htmlContent.includes('fa-star')) return 'Want to Visit';
        if (htmlContent.includes('fa-check-circle')) return 'Visited Place';
        return 'Pizza Place';
    }

    let routingControl = null;
    const CLOSING_SOON_THRESHOLD = 30; 

    async function fetchDataForCurrentView() {
        try {
            const bounds = map.getBounds();
            const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
            showLoadingMessage("Fetching pizza places...");
            const success = await fetchPizzaPlaces(bbox);
            if (success) {
                hideLoadingMessage();
                updateLoadedPizzaPlaces(); 
            } else {
                showErrorMessage("Could not fetch pizza places.");
                hideLoadingMessage(); // Ensure loading overlay is hidden even if fetch fails
            }
        } catch (error) {
            console.error("Error in fetchDataForCurrentView:", error);
            showErrorMessage("Error loading map data. Please try again.");
            hideLoadingMessage(); // Ensure loading overlay is hidden on any error
        }
    }
    
    async function fetchPizzaPlaces(bbox) {
        const overpassUrl = "https://overpass-api.de/api/interpreter";
        const query = `
            [out:json][timeout:60];
            (
                node["cuisine"="pizza"](${bbox}); way["cuisine"="pizza"](${bbox}); relation["cuisine"="pizza"](${bbox});
                node["amenity"="restaurant"]["cuisine"="italian"](${bbox}); way["amenity"="restaurant"]["cuisine"="italian"](${bbox}); relation["amenity"="restaurant"]["cuisine"="italian"](${bbox});
                node["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"](${bbox}); way["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"](${bbox}); relation["amenity"="restaurant"]["cuisine"~"pizza|pizzeria"](${bbox});
                node["vending"="pizza"](${bbox}); node["vending:pizza"="yes"](${bbox});
                node["amenity"="cafe"]["cuisine"~"pizza|italian"](${bbox}); way["amenity"="cafe"]["cuisine"~"pizza|italian"](${bbox}); relation["amenity"="cafe"]["cuisine"~"pizza|italian"](${bbox});
                node["amenity"="fast_food"]["cuisine"~"pizza|italian"](${bbox}); way["amenity"="fast_food"]["cuisine"~"pizza|italian"](${bbox}); relation["amenity"="fast_food"]["cuisine"~"pizza|italian"](${bbox});
                node["amenity"="food_truck"]["cuisine"~"pizza|italian"](${bbox}); way["amenity"="food_truck"]["cuisine"~"pizza|italian"](${bbox}); relation["amenity"="food_truck"]["cuisine"~"pizza|italian"](${bbox});
                node["speciality"~"pizza",i](${bbox}); way["speciality"~"pizza",i](${bbox}); relation["speciality"~"pizza",i](${bbox});
                node["amenity"~"bar|pub"]["cuisine"~"pizza|italian"](${bbox}); way["amenity"~"bar|pub"]["cuisine"~"pizza|italian"](${bbox}); relation["amenity"~"bar|pub"]["cuisine"~"pizza|italian"](${bbox});
                node["name"~"pizza|pizzeria|pizze",i](${bbox}); way["name"~"pizza|pizzeria|pizze",i](${bbox}); relation["name"~"pizza|pizzeria|pizze",i](${bbox});
                node["description"~"pizza",i](${bbox}); way["description"~"pizza",i](${bbox}); relation["description"~"pizza",i](${bbox});
                node["amenity"="takeaway"]["cuisine"~"pizza|italian"](${bbox}); way["amenity"="takeaway"]["cuisine"~"pizza|italian"](${bbox}); relation["amenity"="takeaway"]["cuisine"~"pizza|italian"](${bbox});
            );
            out body; >; out skel qt;
        `;

        try {
            const response = await fetch(overpassUrl, { method: 'POST', body: query });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log("Overpass API Data:", data); 

            Object.values(pizzaMarkers).forEach(layer => layer.clearLayers());
            openPlacesLayer.clearLayers();
            closedPlacesLayer.clearLayers();
            processPizzaData(data.elements);
            hideLoadingMessage(); 
            return true; 
        } catch (error) {
            console.error("Error fetching data from Overpass API:", error);
            showErrorMessage("Error fetching pizza data. Please try again."); 
            hideLoadingMessage(); 
            return false; 
        }
    }

    function getMarkerType(element) {
        if (element.tags && element.tags.vending === 'pizza') return 'vending_pizza';
        if (element.tags && (element.tags.cuisine === 'pizza' || (element.tags.amenity === 'restaurant' && element.tags.cuisine === 'italian'))) {
            if (element.tags.amenity === 'cafe') return 'cafe';
            if (element.tags.amenity === 'fast_food') return 'fast_food';
            if (element.tags.amenity === 'food_truck') return 'food_truck';
            return 'pizzeria'; 
        }
        if (element.tags && element.tags.name && element.tags.name.toLowerCase().includes('pizza')) return 'pizzeria'; 
        return 'other'; 
    }

    function processPizzaData(elements) {
        if (!elements || elements.length === 0) {
            showInfoMessage("No pizza places found in this area. Try zooming out or moving the map.");
            return; 
        }
        hideInfoMessage(); 

        elements.forEach(element => {
            let lat, lng;
            
            if (element.type === 'node') {
                lat = element.lat;
                lng = element.lon;
            } else if ((element.type === 'way' || element.type === 'relation') && element.center) {
                lat = element.center.lat;
                lng = element.center.lon;
            } else if (element.lat !== undefined && element.lon !== undefined) {
                lat = element.lat;
                lng = element.lon;
            }

            if (lat && lng) {
                const name = element.tags?.name || 'Unnamed Pizza Place';
                const openingHours = element.tags?.opening_hours || 'Hours not specified';
                const website = element.tags?.website || element.tags?.url; 
                const phone = element.tags?.phone || element.tags?.['contact:phone']; 
                const placeId = `${element.type}-${element.id}`;
                const markerType = getMarkerType(element);
                
                const icon = icons[markerType]();
                const marker = L.marker([lat, lng], { icon: icon });
                
                const isOpen = checkIfOpen(openingHours);
                marker.isOpen = isOpen; 
                marker.openingHours = openingHours;
                marker.closingTime = getClosingTime(openingHours); 
                marker.placeId = placeId;
                marker.placeName = name;
                marker.website = website;
                marker.phone = phone;
                marker.markerType = markerType; 

                const avgRating = calculateAverageRating(placeId);
                const ratingCount = getRatingsForPlace(placeId).length;
                
                const isVisited = visitedPlaces.some(p => p.placeId === placeId);
                const isWantToVisit = wantToVisitPlaces.some(p => p.placeId === placeId);
                
                const popupContent = createPopupContent({
                    name: name,
                    type: markerType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    isOpen: isOpen,
                    openingHours: openingHours,
                    website: website,
                    phone: phone,
                    placeId: placeId,
                    avgRating: avgRating,
                    ratingCount: ratingCount,
                    lat: lat,
                    lng: lng,
                    isVisited: isVisited,
                    isWantToVisit: isWantToVisit
                });
                
                marker.bindPopup(popupContent);
                
                marker.on('popupopen', function(e) {
                    const popupNode = e.popup.getElement();
                    setupPopupEventListeners(popupNode);
                });

                if (pizzaMarkers[markerType]) {
                    pizzaMarkers[markerType].addLayer(marker);
                    if (isOpen) openPlacesLayer.addLayer(marker);
                    else closedPlacesLayer.addLayer(marker);
                } else {
                    pizzaMarkers.other.addLayer(marker);
                    if (isOpen) openPlacesLayer.addLayer(marker);
                    else closedPlacesLayer.addLayer(marker);
                }
            }
        });
        updateMarkerVisibility(); 
    }
    
    function setupPopupEventListeners(popupNode) {
        const directionsBtn = popupNode.querySelector('.directions-btn');
        if (directionsBtn) {
            directionsBtn.addEventListener('click', function() {
                clearRoute();
                calculateRoute(
                    parseFloat(this.dataset.lat),
                    parseFloat(this.dataset.lng),
                    this.dataset.isOpen === 'true',
                    this.dataset.name,
                    this.dataset.hours
                );
            });
        }
        
        const rateBtn = popupNode.querySelector('.rate-place-btn');
        if (rateBtn) {
            rateBtn.addEventListener('click', function() {
                window.openRatingPopup(
                    this.dataset.placeId,
                    this.dataset.placeName,
                    parseFloat(this.dataset.lat),
                    parseFloat(this.dataset.lng)
                );
            });
        }
        
        const addToVisitBtn = popupNode.querySelector('.add-to-visit-btn');
        if (addToVisitBtn) {
            addToVisitBtn.addEventListener('click', function() {
                const placeData = {
                    placeId: this.dataset.placeId,
                    name: this.dataset.placeName,
                    lat: parseFloat(this.dataset.lat),
                    lng: parseFloat(this.dataset.lng),
                    type: this.dataset.type,
                    openingHours: this.dataset.hours,
                    website: this.dataset.website,
                    phone: this.dataset.phone,
                    isOpen: this.dataset.isOpen === 'true',
                    addedAt: new Date().toISOString()
                };
                addToWantToVisit(placeData);
                const marker = findMarkerByPlaceId(placeData.placeId);
                if (marker) marker.closePopup();
            });
        }
        
        const removeFromVisitBtn = popupNode.querySelector('.remove-from-visit-btn');
        if (removeFromVisitBtn) {
            removeFromVisitBtn.addEventListener('click', function() {
                removeFromWantToVisit(this.dataset.placeId);
                const marker = findMarkerByPlaceId(this.dataset.placeId);
                if (marker) marker.closePopup();
            });
        }
        
        const markVisitedBtn = popupNode.querySelector('.mark-visited-btn');
        if (markVisitedBtn) {
            markVisitedBtn.addEventListener('click', function() {
                const placeData = {
                    placeId: this.dataset.placeId,
                    name: this.dataset.placeName,
                    lat: parseFloat(this.dataset.lat),
                    lng: parseFloat(this.dataset.lng),
                    type: this.dataset.type,
                    openingHours: this.dataset.hours,
                    website: this.dataset.website,
                    phone: this.dataset.phone,
                    isOpen: this.dataset.isOpen === 'true',
                    visitedAt: new Date().toISOString()
                };
                addToVisited(placeData);
                
                // Check for achievements
                checkAchievements();
                
                const marker = findMarkerByPlaceId(placeData.placeId);
                if (marker) marker.closePopup();
            });
        }
        
        const unmarkVisitedBtn = popupNode.querySelector('.unmark-visited-btn');
        if (unmarkVisitedBtn) {
            unmarkVisitedBtn.addEventListener('click', function() {
                removeFromVisited(this.dataset.placeId);
                const marker = findMarkerByPlaceId(this.dataset.placeId);
                if (marker) marker.closePopup();
            });
        }
        
        const shareBtn = popupNode.querySelector('.share-place-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                const placeData = {
                    placeId: this.dataset.placeId,
                    name: this.dataset.placeName,
                    lat: parseFloat(this.dataset.lat),
                    lng: parseFloat(this.dataset.lng),
                    avgRating: this.dataset.rating
                };
                openShareDialog(placeData);
            });
        }
    }
    
    function findMarkerByPlaceId(placeId) {
        let foundMarker = null;
        
        Object.values(pizzaMarkers).forEach(layerGroup => {
            layerGroup.eachLayer(marker => {
                if (marker.placeId === placeId) {
                    foundMarker = marker;
                }
            });
        });
        
        return foundMarker;
    }
    
    function checkIfOpen(openingHours) {
        if (!openingHours || openingHours === 'Hours not specified' || openingHours.toLowerCase() === '24/7') return true;
        try {
            const now = new Date();
            const currentDay = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][now.getDay()];
            const currentTime = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');

            // Day mappings for different languages and formats
            const dayMappings = {
                // English
                'su': 'Su', 'sun': 'Su', 'sunday': 'Su',
                'mo': 'Mo', 'mon': 'Mo', 'monday': 'Mo',
                'tu': 'Tu', 'tue': 'Tu', 'tuesday': 'Tu',
                'we': 'We', 'wed': 'We', 'wednesday': 'We',
                'th': 'Th', 'thu': 'Th', 'thursday': 'Th',
                'fr': 'Fr', 'fri': 'Fr', 'friday': 'Fr',
                'sa': 'Sa', 'sat': 'Sa', 'saturday': 'Sa',
                
                // German
                'so': 'Su', 'son': 'Su', 'sonntag': 'Su',
                'mo': 'Mo', 'mon': 'Mo', 'montag': 'Mo',
                'di': 'Tu', 'die': 'Tu', 'dienstag': 'Tu',
                'mi': 'We', 'mit': 'We', 'mittwoch': 'We',
                'do': 'Th', 'don': 'Th', 'donnerstag': 'Th',
                'fr': 'Fr', 'fre': 'Fr', 'freitag': 'Fr',
                'sa': 'Sa', 'sam': 'Sa', 'samstag': 'Sa',
                
                // Spanish
                'do': 'Su', 'dom': 'Su', 'domingo': 'Su',
                'lu': 'Mo', 'lun': 'Mo', 'lunes': 'Mo',
                'ma': 'Tu', 'mar': 'Tu', 'martes': 'Tu',
                'mi': 'We', 'mie': 'We', 'miercoles': 'We',
                'ju': 'Th', 'jue': 'Th', 'jueves': 'Th',
                'vi': 'Fr', 'vie': 'Fr', 'viernes': 'Fr',
                'sa': 'Sa', 'sab': 'Sa', 'sabado': 'Sa',
                
                // Italian
                'do': 'Su', 'dom': 'Su', 'domenica': 'Su',
                'lu': 'Mo', 'lun': 'Mo', 'lunedì': 'Mo',
                'ma': 'Tu', 'mar': 'Tu', 'martedì': 'Tu',
                'me': 'We', 'mer': 'We', 'mercoledì': 'We',
                'gi': 'Th', 'gio': 'Th', 'giovedì': 'Th',
                've': 'Fr', 'ven': 'Fr', 'venerdì': 'Fr',
                'sa': 'Sa', 'sab': 'Sa', 'sabato': 'Sa',
                
                // French
                'di': 'Su', 'dim': 'Su', 'dimanche': 'Su',
                'lu': 'Mo', 'lun': 'Mo', 'lundi': 'Mo',
                'ma': 'Tu', 'mar': 'Tu', 'mardi': 'Tu',
                'me': 'We', 'mer': 'We', 'mercredi': 'We',
                'je': 'Th', 'jeu': 'Th', 'jeudi': 'Th',
                've': 'Fr', 'ven': 'Fr', 'vendredi': 'Fr',
                'sa': 'Sa', 'sam': 'Sa', 'samedi': 'Sa'
            };

            const rules = openingHours.split(';');
            for (let rule of rules) {
                rule = rule.trim();
                if (rule.toLowerCase() === '24/7') return true;
                
                const parts = rule.split(' ');
                let dayRangeStr = parts[0];
                const timeRangeStr = parts.length > 1 ? parts.slice(1).join(' ') : null;

                // If no time specified or closed, continue
                if (!timeRangeStr) continue;
                if (timeRangeStr.toLowerCase() === 'off' || timeRangeStr.toLowerCase() === 'closed' || timeRangeStr.toLowerCase() === 'geschlossen') {
                    // Check if today is mentioned as closed
                    const days = parseComplexDayRange(dayRangeStr, dayMappings);
                    if (days.includes(currentDay)) return false;
                    continue;
                }

                // Check if today matches any day in the range
                const days = parseComplexDayRange(dayRangeStr, dayMappings);
                
                if (days.includes(currentDay)) {
                    const timeRanges = timeRangeStr.split(',');
                    for (const range of timeRanges) {
                        // Handle special cases like "open" or "geöffnet"
                        if (range.trim().toLowerCase() === 'open' || range.trim().toLowerCase() === 'geöffnet') return true;
                        
                        const [startTime, endTime] = range.trim().split('-');
                        if (startTime && endTime) {
                            if (currentTime >= startTime && currentTime <= endTime) return true;
                            if (startTime > endTime && (currentTime >= startTime || currentTime <= endTime)) return true;
                        }
                    }
                }
            }
            return false; 
        } catch (e) {
            console.warn("Error parsing opening hours:", openingHours, e);
            return true; // Default to open if there's a parsing error
        }
    }
    
    // Helper function to parse complex day ranges with various formats
    function parseComplexDayRange(dayRangeStr, dayMappings) {
        const standardDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const result = [];
        
        // Normalize to lowercase for comparison
        dayRangeStr = dayRangeStr.toLowerCase();
        
        // Handle multiple day formats separated by comma
        const dayParts = dayRangeStr.split(',');
        
        for (let part of dayParts) {
            part = part.trim();
            
            // Handle day ranges with hyphens (e.g., "Mo-Fr" or "mon-fri")
            if (part.includes('-')) {
                const [startDay, endDay] = part.split('-').map(d => d.trim());
                const startDayNormalized = dayMappings[startDay.toLowerCase()] || startDay;
                const endDayNormalized = dayMappings[endDay.toLowerCase()] || endDay;
                
                const startIndex = standardDays.indexOf(startDayNormalized);
                const endIndex = standardDays.indexOf(endDayNormalized);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    // Handle wrap-around (e.g., "Fr-Tu" includes Fr, Sa, Su, Mo, Tu)
                    if (startIndex <= endIndex) {
                        for (let i = startIndex; i <= endIndex; i++) {
                            result.push(standardDays[i]);
                        }
                    } else {
                        for (let i = startIndex; i < standardDays.length; i++) {
                            result.push(standardDays[i]);
                        }
                        for (let i = 0; i <= endIndex; i++) {
                            result.push(standardDays[i]);
                        }
                    }
                }
            } else {
                // Handle single days
                const normalizedDay = dayMappings[part] || part;
                if (standardDays.includes(normalizedDay)) {
                    result.push(normalizedDay);
                }
            }
        }
        
        return result;
    }

    function getClosingTime(openingHours) {
        if (!openingHours || openingHours === 'Hours not specified' || openingHours.toLowerCase() === '24/7') return null;
        
        try {
            const now = new Date();
            const currentDay = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][now.getDay()];
            
            // Day mappings similar to checkIfOpen function
            const dayMappings = {
                'su': 'Su', 'sun': 'Su', 'sunday': 'Su', 'so': 'Su', 'sonntag': 'Su',
                'mo': 'Mo', 'mon': 'Mo', 'monday': 'Mo', 'montag': 'Mo',
                'tu': 'Tu', 'tue': 'Tu', 'tuesday': 'Tu', 'di': 'Tu', 'dienstag': 'Tu',
                'we': 'We', 'wed': 'We', 'wednesday': 'We', 'mi': 'We', 'mittwoch': 'We',
                'th': 'Th', 'thu': 'Th', 'thursday': 'Th', 'do': 'Th', 'donnerstag': 'Th',
                'fr': 'Fr', 'fri': 'Fr', 'friday': 'Fr', 'freitag': 'Fr',
                'sa': 'Sa', 'sat': 'Sa', 'saturday': 'Sa', 'samstag': 'Sa'
            };
            
            const rules = openingHours.split(';');
            for (let rule of rules) {
                rule = rule.trim();
                if (rule.toLowerCase() === '24/7') return null; // No closing time for 24/7
                
                const parts = rule.split(' ');
                let dayRangeStr = parts[0];
                const timeRangeStr = parts.length > 1 ? parts.slice(1).join(' ') : null;
                
                if (!timeRangeStr || timeRangeStr.toLowerCase() === 'off' || 
                    timeRangeStr.toLowerCase() === 'closed' || timeRangeStr.toLowerCase() === 'geschlossen') {
                    continue;
                }
                
                // Check if today matches any day in the range
                const days = parseComplexDayRange(dayRangeStr, dayMappings);
                
                if (days.includes(currentDay)) {
                    const timeRanges = timeRangeStr.split(',');
                    for (const range of timeRanges) {
                        if (range.trim().toLowerCase() === 'open' || range.trim().toLowerCase() === 'geöffnet') {
                            return null; // No specific closing time
                        }
                        
                        const [startTime, endTime] = range.trim().split('-');
                        if (startTime && endTime) {
                            const now = new Date();
                            const currentTime = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
                            
                            if ((currentTime >= startTime && currentTime <= endTime) || 
                                (startTime > endTime && (currentTime >= startTime || currentTime <= endTime))) {
                                // We're in this time range, so return the closing time
                                const [endHour, endMinute] = endTime.split(':').map(Number);
                                const closingTime = new Date();
                                
                                closingTime.setHours(endHour, endMinute, 0);
                                
                                // If end time is before start time (overnight), and current time is before midnight
                                if (startTime > endTime && currentTime >= startTime) {
                                    closingTime.setDate(closingTime.getDate() + 1);
                                }
                                
                                return closingTime;
                            }
                        }
                    }
                }
            }
            
            return null; // No matching closing time found
        } catch (e) {
            console.warn("Error parsing closing time:", openingHours, e);
            return null;
        }
    }

    let liveTrackingId = null;

    function handleTrackingPosition(position) {
        const userLatLng = [position.coords.latitude, position.coords.longitude];
        if (userLocationMarker) {
            userLocationMarker.setLatLng(userLatLng);
        } else {
            userLocationMarker = L.marker(userLatLng, { icon: icons.user_location() })
                .addTo(map)
                .bindPopup("<strong>You are here!</strong><br>Looking for pizza nearby...");
        }
        
        // Save last location
        appState.lastLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            zoom: map.getZoom()
        };
        localStorage.setItem('lastLocation', JSON.stringify(appState.lastLocation));
        
        map.setView(userLatLng, 14);
        fetchDataForCurrentView();
    }

    function handleTrackingError(error) {
        console.warn("Geolocation error:", error.message);
        showErrorMessage(error.code === error.PERMISSION_DENIED ? "Location access denied. Showing default map." : "Could not get location. Showing default map.");
        localStorage.setItem('locationAllowed', 'denied'); 
        appState.locationAllowed = 'denied';
        hideSettingsPopup(); 
        
        fetchDataForCurrentView();
    }

    function getUserLocation() {
        if (navigator.geolocation) {
            showLoadingMessage("Getting your location...");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    hideLoadingMessage();
                    handleTrackingPosition(position);
                },
                (error) => {
                    hideLoadingMessage();
                    handleTrackingError(error);
                    // Add fallback to load the map even if geolocation fails
                    fetchDataForCurrentView();
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 } // Reduced timeout for better UX
            );
        } else {
            showErrorMessage("Geolocation is not supported by your browser.");
            hideSettingsPopup(); 
            fetchDataForCurrentView();
        }
    }
    
    function hideSettingsPopup() {
        settingsPopupOverlay.style.display = 'none';
    }

    // Immediately try to get user location on startup instead of showing the welcome popup first
    hideSettingsPopup();
    getUserLocation();

    // Setup location buttons and handlers for when users want to manually manage location
    if (allowButton) {
        allowButton.onclick = () => {
            localStorage.setItem('locationAllowed', 'allowed');
            appState.locationAllowed = 'allowed';
            hideSettingsPopup();
            getUserLocation();
        };
    }
    
    if (denyButton) {
        denyButton.onclick = () => {
            localStorage.setItem('locationAllowed', 'denied');
            appState.locationAllowed = 'denied';
            hideSettingsPopup();
            fetchDataForCurrentView();
        };
    }
    
    if (closeSettingsButton) {
        closeSettingsButton.onclick = () => { 
            localStorage.setItem('locationAllowed', 'denied');
            appState.locationAllowed = 'denied';
            hideSettingsPopup();
            fetchDataForCurrentView();
        };
    }

    // Location button to recenter map
    if (locationButton) {
        locationButton.addEventListener('click', () => {
            getUserLocation();
        });
    }

    window.closeAllPanels(); 

    // Setup panel close buttons
    const closeButtons = document.querySelectorAll('.panel-modal .close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', window.closeAllPanels);
    });

    // Setup panel open buttons
    if(aiSearchButton) aiSearchButton.onclick = () => window.openPanel(aiResultsArea);
    if(aiRecommendationButton) aiRecommendationButton.onclick = () => window.openPanel(aiRecommendationArea);
    if(pizzaCrawlButton) pizzaCrawlButton.onclick = () => window.openPanel(pizzaCrawlArea);
    if(photoAnalyzerButton) photoAnalyzerButton.onclick = () => window.openPanel(photoAnalyzerArea);
    if(trendInsightsButton) trendInsightsButton.onclick = () => window.openPanel(trendInsightsArea);
    if(savedSpotsButton) savedSpotsButton.onclick = () => window.openPanel(savedSpotsArea); 
    if(wantToVisitButton) {
        wantToVisitButton.onclick = () => {
            renderWantToVisitList(); 
            window.openPanel(wantToVisitArea);
        };
    }
    if(visitedPlacesButton) {
        visitedPlacesButton.onclick = () => {
            renderVisitedPlacesList(); 
            window.openPanel(visitedPlacesArea);
        };
    }
    if(ratingsDatabaseButton) ratingsDatabaseButton.onclick = () => {
        displayRatingsDatabase(); 
        window.openPanel(ratingsDatabaseArea);
    };
    
    function displayRatingsDatabase() {
        console.log("Displaying ratings database...");
        if (topRatedTable) topRatedTable.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading top rated places...</p>
            </div>`;
        if (ratingsTable) ratingsTable.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading all ratings...</p>
            </div>`;
        
        if (ratingsCache.length === 0) {
            if (topRatedTable) topRatedTable.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No ratings available yet</p>
                </div>`;
            if (ratingsTable) ratingsTable.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No ratings available yet</p>
                </div>`;
        } else {
            // Process and display ratings (implementation to be added)
            setTimeout(() => {
                if (topRatedTable) topRatedTable.innerHTML = `
                    <div class="placeholder-content">
                        <p>Top rated places will appear here</p>
                    </div>`;
                if (ratingsTable) ratingsTable.innerHTML = `
                    <div class="placeholder-content">
                        <p>All ratings will appear here</p>
                    </div>`;
            }, 1000);
        }
    }

    async function handleSearchSelection(selectedItem) {
        let query;
        if (selectedItem && selectedItem.lat && selectedItem.lon) {
            map.setView([selectedItem.lat, selectedItem.lon], 15);
            searchbarSuggestions.style.display = 'none';
            mapSearchInput.value = selectedItem.display_name || selectedItem.name; 
            return;
        } else {
            query = mapSearchInput.value.trim();
        }

        if (!query) return;

        showLoadingMessage(`Searching for "${query}"...`);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            if (!response.ok) throw new Error('Nominatim API error');
            const results = await response.json();
            hideLoadingMessage();

            if (results.length > 0) {
                const bestResult = results[0];
                map.setView([parseFloat(bestResult.lat), parseFloat(bestResult.lon)], 15);
                searchbarSuggestions.style.display = 'none';
                fetchDataForCurrentView();
            } else {
                showErrorMessage(`No results found for "${query}".`);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            hideLoadingMessage();
            showErrorMessage("Search failed. Please try again.");
        }
    }
    
    if (mapSearchBtn) mapSearchBtn.onclick = () => handleSearchSelection(null); 
    if (mapSearchInput) {
        mapSearchInput.addEventListener('input', function() {
            const query = mapSearchInput.value.trim().toLowerCase();
            if (query.length < 3) {
                searchbarSuggestions.style.display = 'none';
                return;
            }
            const suggestions = loadedPizzaPlaces
                .filter(place => place.name.toLowerCase().includes(query))
                .slice(0, 5); 

            searchbarSuggestions.innerHTML = '';
            if (suggestions.length > 0) {
                const ul = document.createElement('ul');
                suggestions.forEach(place => {
                    const li = document.createElement('li');
                    li.textContent = place.name;
                    li.onclick = () => handleSearchSelection({ lat: place.lat, lon: place.lng, name: place.name });
                    ul.appendChild(li);
                });
                searchbarSuggestions.appendChild(ul);
                searchbarSuggestions.style.display = 'block';
            } else {
                searchbarSuggestions.style.display = 'none';
            }
        });
        mapSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handleSearchSelection(null);
            }
        });
    }
    
    document.addEventListener('click', function(e) { 
        if (searchbarContainer && !searchbarContainer.contains(e.target)) {
            searchbarSuggestions.style.display = 'none';
        }
    });

    map.on('moveend', function() {
        // Save current map position
        if (!userLocationMarker) {
            const center = map.getCenter();
            appState.lastLocation = {
                lat: center.lat,
                lng: center.lng,
                zoom: map.getZoom()
            };
            localStorage.setItem('lastLocation', JSON.stringify(appState.lastLocation));
        }
        
        fetchDataForCurrentView();
    });

    function updateLoadedPizzaPlaces() {
        loadedPizzaPlaces = [];
        Object.values(pizzaMarkers).forEach(group => {
            group.eachLayer(m => {
                loadedPizzaPlaces.push({
                    name: m.placeName,
                    lat: m.getLatLng().lat,
                    lng: m.getLatLng().lng,
                    placeId: m.placeId,
                });
            });
        });
    }

    function updateMarkerVisibility() {
        const typeFilters = {};
        filterCheckboxes.forEach(cb => typeFilters[cb.dataset.type] = cb.checked);
        
        const showClosed = showClosedCheckbox.checked;
        const showSaved = savedSpotsCheckbox.checked; 
        const showWantToVisit = wantToVisitCheckbox.checked;
        const showVisited = showVisitedCheckbox.checked; 

        Object.entries(pizzaMarkers).forEach(([type, layerGroup]) => {
            if (!map.hasLayer(layerGroup)) {
                map.addLayer(layerGroup);
            }
            
            layerGroup.eachLayer(marker => {
                let isVisible = true;
                if (!typeFilters[marker.markerType]) isVisible = false;
                if (!marker.isOpen && !showClosed) isVisible = false;
                const isPlaceVisited = visitedPlaces.some(p => p.placeId === marker.placeId);
                if (isPlaceVisited && !showVisited) isVisible = false;

                if (isVisible) {
                    if (!map.hasLayer(marker)) map.addLayer(marker);
                } else {
                    if (map.hasLayer(marker)) map.removeLayer(marker);
                }
            });
        });
        
        if (showSaved) {
            if (!map.hasLayer(aiSecretSpotsLayer)) map.addLayer(aiSecretSpotsLayer);
        } else {
            if (map.hasLayer(aiSecretSpotsLayer)) map.removeLayer(aiSecretSpotsLayer);
        }
        
        if (showWantToVisit) {
            if (!map.hasLayer(wantToVisitLayer)) map.addLayer(wantToVisitLayer);
        } else {
            if (map.hasLayer(wantToVisitLayer)) map.removeLayer(wantToVisitLayer);
        }
    }

    filterCheckboxes.forEach(cb => cb.addEventListener('change', updateMarkerVisibility));
    savedSpotsCheckbox.addEventListener('change', updateMarkerVisibility);
    wantToVisitCheckbox.addEventListener('change', updateMarkerVisibility);
    showClosedCheckbox.addEventListener('change', updateMarkerVisibility);
    showVisitedCheckbox.addEventListener('change', updateMarkerVisibility);
    
    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
    }

    function calculateRoute(destLat, destLng, isOpen, placeName, hours) {
        if (!userLocationMarker) {
            showErrorMessage("Your location is needed to calculate directions. Please allow location access.");
            return;
        }
        
        const userLatLng = userLocationMarker.getLatLng();
        
        clearRoute(); // Make sure to clear any existing route
        
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLatLng.lat, userLatLng.lng),
                L.latLng(destLat, destLng)
            ],
            routeWhileDragging: false,
            showAlternatives: true,
            lineOptions: {
                styles: [
                    {color: 'white', opacity: 0.8, weight: 7},
                    {color: appState.darkMode ? '#ff6347' : '#e74c3c', opacity: 0.6, weight: 5}
                ]
            }
        }).addTo(map);
        
        // Show status message based on place being open or closed
        if (!isOpen) {
            showInfoMessage(`${placeName} is currently closed. Opening hours: ${hours}`);
        } else {
            const closingTime = getClosingTime(hours);
            if (closingTime) {
                const minutesToClose = (closingTime.getTime() - new Date().getTime()) / 60000;
                if (minutesToClose > 0 && minutesToClose < CLOSING_SOON_THRESHOLD) {
                    showInfoMessage(`${placeName} is closing soon (in ${Math.round(minutesToClose)} minutes).`);
                }
            }
        }
    }

    function findMarkerByCoordinates(lat, lng) {
        let foundMarker = null;
        const threshold = 0.0001; // Small threshold for floating point comparison
        
        Object.values(pizzaMarkers).forEach(layerGroup => {
            layerGroup.eachLayer(marker => {
                const markerLat = marker.getLatLng().lat;
                const markerLng = marker.getLatLng().lng;
                if (Math.abs(markerLat - lat) < threshold && Math.abs(markerLng - lng) < threshold) {
                    foundMarker = marker;
                }
            });
        });
        
        return foundMarker;
    }
    
    // New AI feature implementations
    
    // 1. AI Pizza Recommendation
    if (generateRecommendationsButton) {
        generateRecommendationsButton.addEventListener('click', function() {
            const crustPreference = document.getElementById('crust-preference').value;
            const toppingPreference = Array.from(document.getElementById('topping-preference').selectedOptions).map(opt => opt.value);
            const priceRange = document.getElementById('price-range').value;
            const distancePreference = document.getElementById('distance-preference').value;
            
            recommendationsResults.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Analyzing your preferences and finding perfect pizza places...</p>
                </div>`;
            
            // Simulate AI processing
            setTimeout(() => {
                generateAiRecommendations(crustPreference, toppingPreference, priceRange, distancePreference);
            }, 2000);
        });
    }
    
    function generateAiRecommendations(crust, toppings, price, distance) {
        // In a real implementation, this would use machine learning to analyze user preferences
        // and match them with available pizza places based on ratings, reviews, etc.
        
        // For now, let's simulate by filtering existing pizza places
        if (loadedPizzaPlaces.length === 0) {
            recommendationsResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No pizza places found in this area to generate recommendations.</p>
                </div>`;
            return;
        }
        
        // Simple mock implementation - in reality this would use AI to analyze preferences
        let filteredPlaces = loadedPizzaPlaces.slice(0, 5);
        
        // Mock data enrichment
        filteredPlaces = filteredPlaces.map(place => ({
            ...place,
            matchScore: Math.round(Math.random() * 90 + 10),
            specialties: ["Thin crust", "Fresh mozzarella", "Wood-fired"],
            priceLevel: Math.floor(Math.random() * 3) + 1,
            knownFor: ["Authentic Italian", "Family owned", "Local favorite"][Math.floor(Math.random() * 3)]
        }));
        
        // Sort by "match score"
        filteredPlaces.sort((a, b) => b.matchScore - a.matchScore);
        
        currentRecommendations = filteredPlaces;
        
        let resultsHTML = `
            <div class="recommendations-header">
                <h3>Your Personalized Pizza Recommendations</h3>
                <p>Based on your preferences for ${crust} crust${toppings.length ? ` with ${toppings.join(', ')}` : ''}</p>
            </div>
            <div class="recommendations-list">
        `;
        
        filteredPlaces.forEach(place => {
            resultsHTML += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <h4>${place.name}</h4>
                        <div class="match-score">
                            <span class="match-percent">${place.matchScore}%</span>
                            <span class="match-label">match</span>
                        </div>
                    </div>
                    <div class="recommendation-details">
                        <p><i class="fas fa-utensils"></i> <strong>Specialties:</strong> ${place.specialties.join(', ')}</p>
                        <p><i class="fas fa-dollar-sign"></i> <strong>Price:</strong> ${'$'.repeat(place.priceLevel)}</p>
                        <p><i class="fas fa-award"></i> <strong>Known for:</strong> ${place.knownFor}</p>
                    </div>
                    <div class="recommendation-actions">
                        <button class="action-button view-recommendation" data-lat="${place.lat}" data-lng="${place.lng}">
                            <i class="fas fa-map-marker-alt"></i> View on Map
                        </button>
                        <button class="action-button add-to-visit-recommendation" data-id="${place.placeId}">
                            <i class="fas fa-star"></i> Add to Visit List
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += `</div>`;
        
        recommendationsResults.innerHTML = resultsHTML;
        
        // Add event listeners
        document.querySelectorAll('.view-recommendation').forEach(btn => {
            btn.addEventListener('click', function() {
                const lat = parseFloat(this.dataset.lat);
                const lng = parseFloat(this.dataset.lng);
                map.setView([lat, lng], 16);
                
                // Find and open the marker popup
                const marker = findMarkerByCoordinates(lat, lng);
                if (marker) {
                    marker.openPopup();
                }
            });
        });
        
        document.querySelectorAll('.add-to-visit-recommendation').forEach(btn => {
            btn.addEventListener('click', function() {
                const placeId = this.dataset.id;
                const place = loadedPizzaPlaces.find(p => p.placeId === placeId);
                if (place) {
                    const placeData = {
                        placeId: place.placeId,
                        name: place.name,
                        lat: place.lat,
                        lng: place.lng,
                        type: "Recommended Place",
                        addedAt: new Date().toISOString()
                    };
                    addToWantToVisit(placeData);
                }
            });
        });
    }
    
    function findMarkerByCoordinates(lat, lng) {
        let foundMarker = null;
        const threshold = 0.0001; // Small threshold for floating point comparison
        
        Object.values(pizzaMarkers).forEach(layerGroup => {
            layerGroup.eachLayer(marker => {
                const markerLat = marker.getLatLng().lat;
                const markerLng = marker.getLatLng().lng;
                if (Math.abs(markerLat - lat) < threshold && Math.abs(markerLng - lng) < threshold) {
                    foundMarker = marker;
                }
            });
        });
        
        return foundMarker;
    }
    
    // 2. Pizza Crawl Planner
    if (generateCrawlButton) {
        generateCrawlButton.addEventListener('click', function() {
            const stops = document.getElementById('crawl-stops').value;
            const transport = document.getElementById('crawl-transport').value;
            const focus = document.getElementById('crawl-focus').value;
            
            crawlResults.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Planning your perfect pizza crawl with ${stops} stops...</p>
                </div>`;
            
            // Simulate AI processing
            setTimeout(() => {
                generatePizzaCrawl(parseInt(stops), transport, focus);
            }, 2000);
        });
    }
    
    function generatePizzaCrawl(stops, transport, focus) {
        if (!userLocationMarker) {
            crawlResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Your location is needed to plan a pizza crawl. Please allow location access.</p>
                </div>`;
            return;
        }
        
        if (loadedPizzaPlaces.length < stops) {
            crawlResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Not enough pizza places in this area for a ${stops}-stop crawl. Try zooming out or reducing the number of stops.</p>
                </div>`;
            return;
        }
        
        // In a real implementation, this would use AI to calculate optimal routes
        // based on ratings, distance, variety, etc.
        
        // For now, let's simulate by picking places within a reasonable distance
        const userLat = userLocationMarker.getLatLng().lat;
        const userLng = userLocationMarker.getLatLng().lng;
        
        // Calculate distances
        const placesWithDistance = loadedPizzaPlaces.map(place => {
            const distance = calculateDistance(userLat, userLng, place.lat, place.lng);
            return { ...place, distance };
        });
        
        // Filter places that are too far (e.g., more than 5km)
        let eligiblePlaces = placesWithDistance.filter(place => place.distance < 5);
        
        if (eligiblePlaces.length < stops) {
            crawlResults.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Not enough pizza places within a reasonable distance for a ${stops}-stop crawl.</p>
                </div>`;
            return;
        }
        
        // Sort based on focus
        switch(focus) {
            case 'ratings':
                // In a real implementation, we would sort by actual ratings
                eligiblePlaces.sort(() => Math.random() - 0.5); // Random for demo
                break;
            case 'variety':
                // In a real implementation, we would ensure variety of pizza types
                eligiblePlaces.sort(() => Math.random() - 0.5); // Random for demo
                break;
            case 'hidden-gems':
                // In a real implementation, we would prioritize lesser-known places
                eligiblePlaces.sort(() => Math.random() - 0.5); // Random for demo
                break;
            case 'efficiency':
            default:
                // Sort by distance for efficiency
                eligiblePlaces.sort((a, b) => a.distance - b.distance);
                break;
        }
        
        // Select the top places based on stops
        const selectedPlaces = eligiblePlaces.slice(0, stops);
        
        // For an efficient route, we could use TSP algorithm here
        // For now, just start from closest to farthest
        selectedPlaces.sort((a, b) => a.distance - b.distance);
        
        // Create route waypoints
        const waypoints = [
            L.latLng(userLat, userLng),
            ...selectedPlaces.map(place => L.latLng(place.lat, place.lng)),
            L.latLng(userLat, userLng) // Return to start
        ];
        
        // Display the route
        clearRoute();
        routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            lineOptions: {
                styles: [
                    {color: 'white', opacity: 0.8, weight: 7},
                    {color: appState.darkMode ? '#ff6347' : '#e74c3c', opacity: 0.6, weight: 5}
                ]
            }
        }).addTo(map);
        
        // Store current crawl
        currentCrawlRoute = {
            stops: selectedPlaces,
            transport: transport,
            focus: focus
        };
        
        // Display results
        let resultsHTML = `
            <div class="crawl-header">
                <h3>${stops}-Stop Pizza Crawl</h3>
                <p>Optimized for ${focus === 'ratings' ? 'highest ratings' : 
                                  focus === 'variety' ? 'maximum variety' :
                                  focus === 'hidden-gems' ? 'hidden gems' : 
                                  'most efficient route'}</p>
            </div>
            <div class="crawl-stops">
        `;
        
        selectedPlaces.forEach((place, index) => {
            resultsHTML += `
                <div class="crawl-stop">
                    <div class="stop-number">${index + 1}</div>
                    <div class="stop-details">
                        <h4>${place.name}</h4>
                        <p><i class="fas fa-walking"></i> ${place.distance.toFixed(2)} km from your location</p>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += `</div>`;
        
        // Show save and share buttons
        crawlActions.style.display = 'flex';
        
        crawlResults.innerHTML = resultsHTML;
    }
    
    if (saveCrawlButton) {
        saveCrawlButton.addEventListener('click', function() {
            if (!currentCrawlRoute) return;
            
            // In a real implementation, we would save this to the database
            const crawlName = prompt('Give your pizza crawl a name:');
            if (!crawlName) return;
            
            showInfoMessage(`Pizza crawl "${crawlName}" saved successfully!`);
        });
    }
    
    if (shareCrawlButton) {
        shareCrawlButton.addEventListener('click', function() {
            if (!currentCrawlRoute) return;
            
            // In a real implementation, we would generate a shareable link
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    showInfoMessage('Link copied to clipboard!');
                })
                .catch(() => {
                    showErrorMessage('Failed to copy link');
                });
        });
    }
    
    // 3. Photo Analyzer
    if (dropZone && photoUpload) {
        dropZone.addEventListener('click', () => {
            photoUpload.click();
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                handlePhotoUpload(e.dataTransfer.files[0]);
            }
        });
        
        photoUpload.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handlePhotoUpload(e.target.files[0]);
            }
        });
    }
    
    function handlePhotoUpload(file) {
        if (!file.type.startsWith('image/')) {
            showErrorMessage('Please upload an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            photoPreview.style.display = 'block';
            analysisResults.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
    
    if (analyzePhotoButton) {
        analyzePhotoButton.addEventListener('click', function() {
            if (!previewImage.src) return;
            
            analysisResults.style.display = 'block';
            analysisResults.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Analyzing your pizza photo...</p>
                </div>`;
            
            // Simulate AI processing
            setTimeout(() => {
                analyzePizzaPhoto();
            }, 2000);
        });
    }
    
    function analyzePizzaPhoto() {
        // In a real implementation, this would use image recognition AI
        
        // For demo purposes, generate random analysis
        const pizzaTypes = ['Neapolitan', 'New York Style', 'Chicago Deep Dish', 'Sicilian', 'Detroit Style'];
        const toppings = ['Pepperoni', 'Mushrooms', 'Bell Peppers', 'Onions', 'Sausage', 'Fresh Mozzarella', 'Basil'];
        const crust = ['Thin and Crispy', 'Thick and Fluffy', 'Stuffed', 'Focaccia-style', 'Traditional'];
        const cookingMethod = ['Wood-fired Oven', 'Brick Oven', 'Electric Deck Oven', 'Conveyor Oven'];
        
        const randomPizzaType = pizzaTypes[Math.floor(Math.random() * pizzaTypes.length)];
        const randomToppings = [];
        for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
            const topping = toppings[Math.floor(Math.random() * toppings.length)];
            if (!randomToppings.includes(topping)) {
                randomToppings.push(topping);
            }
        }
        const randomCrust = crust[Math.floor(Math.random() * crust.length)];
        const randomCookingMethod = cookingMethod[Math.floor(Math.random() * cookingMethod.length)];
        
        // Generate similar places
        const similarPlaces = loadedPizzaPlaces.slice(0, 3);
        
        let analysisHTML = `
            <div class="analysis-header">
                <h3>Pizza Analysis Results</h3>
            </div>
            <div class="analysis-details">
                <div class="analysis-section">
                    <h4>Pizza Style</h4>
                    <p>This appears to be a <strong>${randomPizzaType}</strong> style pizza.</p>
                    <div class="confidence-bar">
                        <div class="confidence-level" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h4>Detected Toppings</h4>
                    <ul class="toppings-list">
                        ${randomToppings.map(topping => `
                            <li>
                                <span class="topping-name">${topping}</span>
                                <div class="confidence-bar small">
                                    <div class="confidence-level" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h4>Crust Analysis</h4>
                    <p>Crust type: <strong>${randomCrust}</strong></p>
                    <p>Likely cooked in a <strong>${randomCookingMethod}</strong></p>
                </div>
            </div>
            
            <div class="similar-places">
                <h4>Similar Places Nearby</h4>
                ${similarPlaces.length ? `
                    <ul class="similar-places-list">
                        ${similarPlaces.map(place => `
                            <li>
                                <span class="place-name">${place.name}</span>
                                <button class="view-similar-place" data-lat="${place.lat}" data-lng="${place.lng}">
                                    <i class="fas fa-map-marker-alt"></i> View
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <p>No similar places found nearby.</p>
                `}
            </div>
        `;
        
        analysisResults.innerHTML = analysisHTML;
        
        // Add event listeners
        document.querySelectorAll('.view-similar-place').forEach(btn => {
            btn.addEventListener('click', function() {
                const lat = parseFloat(this.dataset.lat);
                const lng = parseFloat(this.dataset.lng);
                map.setView([lat, lng], 16);
                
                // Find and open the marker popup
                aiSecretSpotsLayer.eachLayer(marker => {
                    const markerLat = marker.getLatLng().lat;
                    const markerLng = marker.getLatLng().lng;
                    if (Math.abs(markerLat - lat) < 0.0001 && Math.abs(markerLng - lng) < 0.0001) {
                        marker.openPopup();
                    }
                });
            });
        });
        
        if (saveAllButton) {
            saveAllButton.addEventListener('click', function() {
                currentAiResults.forEach(spot => {
                    const spotData = {
                        placeId: spot.id,
                        name: spot.name,
                        lat: spot.lat,
                        lng: spot.lng,
                        type: "Secret Spot",
                        description: spot.description,
                        addedAt: new Date().toISOString()
                    };
                    
                    if (!wantToVisitPlaces.some(p => p.placeId === spotData.placeId)) {
                        addToWantToVisit(spotData);
                    }
                });
                
                showInfoMessage(`All ${currentAiResults.length} secret spots added to your visit list!`);
            });
        }
    }
    
    function getRandomSecretName() {
        const prefixes = ["Hidden", "Secret", "Underground", "Backroom", "Speakeasy", "Invite-Only"];
        const names = ["Pizza Society", "Dough Club", "Slice Vault", "Pizza Cellar", "Crust Collective", "Margherita Hideout"];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return `${prefix} ${name}`;
    }
    
    function getRandomSecretDescription() {
        const descriptions = [
            "A secret pizza spot in the back of a laundromat. Knock three times and ask for 'the special dough'.",
            "Members-only pizza club that operates on Friday nights. Password changes weekly.",
            "Invitation-only pizza tastings held in a converted warehouse. Known for experimental toppings.",
            "Underground pizza chef hosts private dinners. Limited to 12 guests per night.",
            "Pizza speakeasy behind a fake wall in a bookstore. Reservation by text message only.",
            "Pizza popup that appears randomly. Follow their cryptic Instagram for location hints."
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    function getRandomSource() {
        const sources = [
            "Local food blogger mention",
            "Reddit r/SecretEats thread",
            "Instagram geotag analysis",
            "Local chef interview",
            "Food forum deep dive",
            "Twitter keyword analysis"
        ];
        
        return sources[Math.floor(Math.random() * sources.length)];
    }
    
    function getRandomSpecialFeature() {
        const features = [
            "Wood-fired oven imported from Naples",
            "72-hour fermented dough",
            "Uses rare heirloom tomato variety",
            "Secret cheese blend of 5 different cheeses",
            "Unconventional toppings menu",
            "Custom-built rotating pizza oven"
        ];
        
        return features[Math.floor(Math.random() * features.length)];
    }
    
    // Leaderboard button setup
    const leaderboardButton = document.getElementById('leaderboard-button');
    const leaderboardArea = document.getElementById('leaderboard-area');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tabs .tab-button');
    
    if(leaderboardButton) {
        leaderboardButton.onclick = () => {
            window.openPanel(leaderboardArea);
            displayLeaderboard('most-visited'); // Load the default tab when opening
        };
    }
    
    if(leaderboardTabs) {
        leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Display leaderboard for the selected category
                displayLeaderboard(tab.dataset.tab);
            });
        });
    }
    
    // Initialize community features
    let currentUser = null;
    
    async function initCommunityFeatures() {
        try {
            currentUser = await window.websim.getCurrentUser();
            console.log("Current user:", currentUser);
            
            // Check for achievements
            checkAchievements();
            
            // Load unviewed achievements for notification
            Object.entries(appState.achievements).forEach(([id, data]) => {
                if (data.unlocked && !data.viewed) {
                    const achievement = ACHIEVEMENTS.find(a => a.id === id);
                    if (achievement) {
                        setTimeout(() => {
                            showAchievementNotification(achievement);
                            appState.achievements[id].viewed = true;
                            localStorage.setItem('achievements', JSON.stringify(appState.achievements));
                        }, 3000); // Delay to not overwhelm user on load
                    }
                }
            });
        } catch (error) {
            console.error("Error initializing community features:", error);
        }
    }
    
    // Add the function call to initialize community features
    initCommunityFeatures();
    
    // Achievement definitions
    const ACHIEVEMENTS = [
        {
            id: 'first_pizza',
            name: 'Pizza Novice',
            description: 'Visit your first pizza place',
            icon: 'fas fa-pizza-slice',
            points: 10,
            condition: (user) => user.visitedPlaces.length >= 1
        },
        {
            id: 'pizza_explorer',
            name: 'Pizza Explorer',
            description: 'Visit 5 different pizza places',
            icon: 'fas fa-compass',
            points: 25,
            condition: (user) => user.visitedPlaces.length >= 5
        },
        {
            id: 'pizza_connoisseur',
            name: 'Pizza Connoisseur',
            description: 'Visit 20 different pizza places',
            icon: 'fas fa-utensils',
            points: 50,
            condition: (user) => user.visitedPlaces.length >= 20
        },
        {
            id: 'first_rating',
            name: 'First Impression',
            description: 'Submit your first pizza rating',
            icon: 'fas fa-star',
            points: 15,
            condition: (user) => user.ratingsCount >= 1
        },
        {
            id: 'critic',
            name: 'Pizza Critic',
            description: 'Submit 10 pizza ratings',
            icon: 'fas fa-clipboard-list',
            points: 30,
            condition: (user) => user.ratingsCount >= 10
        },
        {
            id: 'style_hunter',
            name: 'Style Hunter',
            description: 'Visit pizza places with 3 different styles',
            icon: 'fas fa-shapes',
            points: 20,
            condition: (user) => user.uniqueStyles >= 3
        },
        {
            id: 'worldwide',
            name: 'Worldwide Pizza Traveler',
            description: 'Visit pizza places in 3 different cities',
            icon: 'fas fa-globe-americas',
            points: 35,
            condition: (user) => user.uniqueCities >= 3
        },
        {
            id: 'secret_hunter',
            name: 'Secret Spot Hunter',
            description: 'Discover a secret pizza spot',
            icon: 'fas fa-key',
            points: 40,
            condition: (user) => user.secretSpotsDiscovered >= 1
        },
        {
            id: 'perfect_score',
            name: 'Perfect Pizza',
            description: 'Rate a pizza place with a perfect score',
            icon: 'fas fa-award',
            points: 50,
            condition: (user) => user.hasPerfectRating
        }
    ];
    
    // Check achievements based on current user data
    function checkAchievements() {
        const userData = {
            visitedPlaces: visitedPlaces,
            ratingsCount: ratingsCache.filter(r => r.username === currentUser?.username).length,
            uniqueStyles: new Set(visitedPlaces.map(p => p.type)).size,
            uniqueCities: new Set(visitedPlaces.map(p => p.city || 'Unknown')).size,
            secretSpotsDiscovered: wantToVisitPlaces.filter(p => p.type === 'Secret Spot').length,
            hasPerfectRating: ratingsCache.some(r => 
                r.username === currentUser?.username && 
                (r.firstBite >= 9.5 || calculateAverageRating(r.placeId) >= 24)
            )
        };
        
        ACHIEVEMENTS.forEach(achievement => {
            if (achievement.condition(userData)) {
                unlockAchievement(achievement.id);
            }
        });
        
        updateAchievementsView();
    }
    
    function updateAchievementsView() {
        if (!achievementsList) return;
        
        // Update stat counters
        document.getElementById('total-visited-count').textContent = visitedPlaces.length;
        document.getElementById('total-ratings-count').textContent = 
            ratingsCache.filter(r => r.username === currentUser?.username).length;
        
        // Calculate achievement points
        let totalPoints = 0;
        Object.keys(appState.achievements).forEach(id => {
            if (appState.achievements[id].unlocked) {
                const achievement = ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) totalPoints += achievement.points;
            }
        });
        document.getElementById('achievement-points').textContent = totalPoints;
        
        // Render achievements list
        achievementsList.innerHTML = '';
        
        ACHIEVEMENTS.forEach(achievement => {
            const isUnlocked = appState.achievements[achievement.id]?.unlocked;
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-card ${isUnlocked ? '' : 'locked'}`;
            
            achievementElement.innerHTML = `
                <div class="achievement-header">
                    <div class="achievement-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <div class="achievement-info">
                        <h4 class="achievement-name">${achievement.name}</h4>
                        <p class="achievement-description">${achievement.description}</p>
                    </div>
                </div>
                <div class="achievement-details">
                    <p class="achievement-points">${achievement.points} points</p>
                    <p class="achievement-status">
                        ${isUnlocked 
                            ? `<i class="fas fa-check-circle"></i> Unlocked on ${new Date(appState.achievements[achievement.id].unlockedAt).toLocaleDateString()}`
                            : '<i class="fas fa-lock"></i> Locked'
                        }
                    </p>
                </div>
            `;
            
            achievementsList.appendChild(achievementElement);
        });
    }
    
    // Leaderboard functionality
    async function displayLeaderboard(category = 'most-visited') {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        if (!leaderboardContainer) return;
        
        leaderboardContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading leaderboard data...</p>
            </div>
        `;
        
        try {
            // Get current user information
            const currentUser = await window.websim.getCurrentUser();
            
            // This would fetch actual community data in a real implementation
            // For now, we'll generate mock data
            setTimeout(() => {
                const leaderboardData = generateMockLeaderboardData(category, currentUser.username);
                renderLeaderboard(leaderboardData, category, currentUser.username);
            }, 1000);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
            leaderboardContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load leaderboard data. Please try again.</p>
                </div>
            `;
        }
    }
    
    function generateMockLeaderboardData(category, currentUsername) {
        // Generate random usernames
        const usernames = [
            'PizzaLover', 'SliceMaster', 'PepperoniPal', 'CrustCraver', 
            'MozzarellaFan', 'DoughMaster', 'PizzaHunter', 'SliceSeeker',
            'ToppingKing', 'MargheritaQueen', 'PizzaPro', 'DoughWhisperer',
            'CheeseChaser', 'PizzaExplorer', 'OvenMaster', 'SauceExpert',
            currentUsername
        ];
        
        // Generate different scores based on category
        const data = usernames.map(username => {
            let score;
            switch (category) {
                case 'most-visited':
                    score = username === currentUsername ? visitedPlaces.length : Math.floor(Math.random() * 30) + 1;
                    break;
                case 'top-reviewers':
                    score = username === currentUsername ? 
                        ratingsCache.filter(r => r.username === currentUsername).length : 
                        Math.floor(Math.random() * 20) + 1;
                    break;
                case 'discovery-kings':
                    score = username === currentUsername ? 
                        wantToVisitPlaces.filter(p => p.type === 'Secret Spot').length : 
                        Math.floor(Math.random() * 10) + 1;
                    break;
                default:
                    score = Math.floor(Math.random() * 50) + 1;
            }
            
            return {
                username,
                score,
                isCurrentUser: username === currentUsername
            };
        });
        
        // Sort by score (highest first)
        data.sort((a, b) => b.score - a.score);
        
        // Add rank
        return data.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
    }
    
    function renderLeaderboard(data, category, currentUsername) {
        if (!leaderboardContainer) return;
        
        let categoryLabel;
        switch (category) {
            case 'most-visited':
                categoryLabel = 'Places Visited';
                break;
            case 'top-reviewers':
                categoryLabel = 'Ratings Submitted';
                break;
            case 'discovery-kings':
                categoryLabel = 'Secret Spots Found';
                break;
            default:
                categoryLabel = 'Score';
        }
        
        let tableHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>${categoryLabel}</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(user => {
            tableHTML += `
                <tr class="${user.isCurrentUser ? 'current-user-row' : ''}">
                    <td class="rank-cell">${user.rank}</td>
                    <td class="user-cell">
                        <div class="user-avatar">
                            <img src="https://images.websim.com/avatar/${user.username}" alt="${user.username}">
                        </div>
                        <span class="user-name">${user.username}</span>
                        ${user.isCurrentUser ? '<span class="current-user-tag">You</span>' : ''}
                    </td>
                    <td class="score-cell">${user.score}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        leaderboardContainer.innerHTML = tableHTML;
    }
    
    // User profile functionality
    async function loadUserProfile() {
        if (!profileArea) return;
        
        try {
            // Get current user information
            const currentUser = await window.websim.getCurrentUser();
            
            // Update profile display
            document.getElementById('profile-username').textContent = currentUser.username;
            document.getElementById('profile-join-date').textContent = `Member since: ${
                new Date(appState.userProfile.joinDate).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                })
            }`;
            
            // Set profile avatar
            const avatar = document.getElementById('profile-avatar');
            avatar.innerHTML = `<img src="https://images.websim.com/avatar/${currentUser.username}" alt="${currentUser.username}">`;
            
            // Calculate user rank based on points and visited places
            let userRank = 'Pizza Newbie';
            const visitedCount = visitedPlaces.length;
            const ratingsCount = ratingsCache.filter(r => r.username === currentUser.username).length;
            
            if (visitedCount >= 20 || ratingsCount >= 15) {
                userRank = 'Pizza Connoisseur';
            } else if (visitedCount >= 10 || ratingsCount >= 7) {
                userRank = 'Pizza Enthusiast';
            } else if (visitedCount >= 5 || ratingsCount >= 3) {
                userRank = 'Pizza Fan';
            }
            
            document.getElementById('profile-rank').textContent = userRank;
            
            // Update stats
            document.getElementById('profile-visited').textContent = visitedPlaces.length;
            document.getElementById('profile-ratings').textContent = 
                ratingsCache.filter(r => r.username === currentUser.username).length;
            document.getElementById('profile-achievements').textContent = 
                Object.values(appState.achievements).filter(a => a.unlocked).length;
            
            // Set form values from saved preferences
            document.getElementById('favorite-style').value = appState.userProfile.favoriteStyle;
            
            const toppingsSelect = document.getElementById('favorite-toppings');
            if (toppingsSelect) {
                Array.from(toppingsSelect.options).forEach(option => {
                    option.selected = appState.userProfile.favoriteToppings.includes(option.value);
                });
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
        }
    }
    
    function saveUserPreferences() {
        const favoriteStyle = document.getElementById('favorite-style').value;
        const toppingsSelect = document.getElementById('favorite-toppings');
        const favoriteToppings = Array.from(toppingsSelect.selectedOptions).map(opt => opt.value);
        
        appState.userProfile.favoriteStyle = favoriteStyle;
        appState.userProfile.favoriteToppings = favoriteToppings;
        
        localStorage.setItem('userProfile', JSON.stringify(appState.userProfile));
        
        showInfoMessage('Preferences saved successfully!');
    }
    
    // Social sharing functionality
    function openShareDialog(place) {
        if (!socialShareOverlay) return;
        
        document.getElementById('share-place-name').textContent = place.name;
        document.getElementById('share-place-description').textContent = 
            `I discovered ${place.name} using PizzaScan! ${
                place.avgRating ? `It's rated ${place.avgRating}/25!` : 'Check it out!'
            }`;
        
        // Set up share links
        const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${place.lat}&lng=${place.lng}&placeId=${place.placeId}`;
        const shareText = `I discovered ${place.name} using PizzaScan! Check it out!`;
        
        // Update share buttons
        document.querySelector('.share-twitter').onclick = () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        };
        
        document.querySelector('.share-facebook').onclick = () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        };
        
        document.querySelector('.share-instagram').onclick = () => {
            showInfoMessage('Instagram sharing requires the Instagram app. Image copied to clipboard!');
        };
        
        document.querySelector('.share-copy-link').onclick = () => {
            navigator.clipboard.writeText(shareUrl)
                .then(() => showInfoMessage('Link copied to clipboard!'))
                .catch(() => showErrorMessage('Failed to copy link'));
        };
        
        socialShareOverlay.style.display = 'flex';
    }
});