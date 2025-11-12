// js/app.js

document.addEventListener('DOMContentLoaded', function () {

    // THAY THẾ TOÀN BỘ HÀM NÀY
    function showDashboard() {
        // Lấy các số liệu thống kê từ dữ liệu hiện có
        const totalAlerts = allAlerts.length;
        const highSeverityAlerts = allAlerts.filter(a => a.analysis && a.analysis.severity === 'High').length;
        const lowStockItems = allAlerts
            .filter(a => a.analysis)
            .flatMap(a => a.analysis.impactedInventory)
            .filter(inv => inv.daysOfStock < 15);

        // Lấy ra cảnh báo mới nhất có mức độ nghiêm trọng cao nhất
        const latestCriticalAlert = allAlerts.find(a => a.analysis && a.analysis.severity === 'High') ||
            allAlerts.find(a => a.analysis && a.analysis.severity === 'Medium') ||
            allAlerts[0];

        mainContent.innerHTML = `
        <div class="content-header">
            <h2>Executive Summary</h2>
        </div>
        <div class="dashboard-grid">
            <!-- Card 1: Tổng số cảnh báo -->
            <div class="summary-card">
                <div class="card-icon critical">⚠️</div>
                <div class="card-content">
                    <div class="card-value">${totalAlerts}</div>
                    <div class="card-label">Total Active Alerts</div>
                </div>
            </div>
            
            <!-- Card 2: Cảnh báo mức độ cao -->
            <div class="summary-card">
                <div class="card-icon high">🚨</div>
                <div class="card-content">
                    <div class="card-value">${highSeverityAlerts}</div>
                    <div class="card-label">High-Severity Alerts</div>
                </div>
            </div>

            <!-- Card 3: Hàng tồn kho bị ảnh hưởng -->
            <div class="summary-card">
                <div class="card-icon medium">📦</div>
                <div class="card-content">
                    <div class="card-value">${[...new Set(lowStockItems.map(item => item.productName))].length}</div>
                    <div class="card-label">Low-Stock Items Impacted</div>
                </div>
            </div>
            
            <!-- Card 4: Cảnh báo nổi bật nhất -->
            <div class="summary-card featured-alert">
                <div class="card-header">
                    <h4>⭐ Most Critical Alert</h4>
                    <span class="risk-badge ${latestCriticalAlert ? latestCriticalAlert.analysis.severity.toLowerCase() : 'unknown'}">
                        ${latestCriticalAlert ? latestCriticalAlert.analysis.severity : 'N/A'}
                    </span>
                </div>
                ${latestCriticalAlert ? `
                    <p class="featured-title">${latestCriticalAlert.item.title}</p>
                    <p class="featured-summary">${latestCriticalAlert.analysis.summary}</p>
                    <button class="action-btn" onclick="showAlertDetailPage('${latestCriticalAlert.item.id}')">View Details</button>
                ` : `
                    <p class="placeholder-text" style="margin: 20px 0;">No critical alerts at the moment. System is stable.</p>
                `}
            </div>
        </div>
    `;
    }

    // ==========================================================================
    // KHAI BÁO BIẾN VÀ HẰNG SỐ
    // ==========================================================================


    // THAY THẾ TOÀN BỘ CÁC BIẾN RSS CŨ BẰNG BIẾN MỚI NÀY

    const RELEVANT_RSS_FEEDS = {
        "Thời sự": "https://dantri.com.vn/rss/xa-hoi.rss",
        "Thế Giới": "https://dantri.com.vn/rss/the-gioi.rss",
        "Kinh Doanh": "https://dantri.com.vn/rss/kinh-doanh.rss",
        "Bất động sản": "https://dantri.com.vn/rss/bat-dong-san.rss",
        "Pháp Luật": "https://dantri.com.vn/rss/phap-luat.rss",
        "Lao động - Việc làm": "https://dantri.com.vn/rss/lao-dong-viec-lam.rss",
        "Công nghệ": "https://dantri.com.vn/rss/suc-manh-so.rss",
        "Khoa học": "https://dantri.com.vn/rss/khoa-hoc-cong-nghe.rss",
        "Ô tô - Xe máy": "https://dantri.com.vn/rss/o-to-xe-may.rss",
        "Sức khỏe": "https://dantri.com.vn/rss/suc-khoe.rss", // Có thể liên quan đến dịch bệnh
        "Sự kiện": "https://dantri.com.vn/rss/su-kien.rss",
    };


    // Lấy các element trên trang
    const mainContent = document.getElementById('main-content-container');
    const weatherOverviewContainer = document.getElementById('weather-overview-container');
    const menuLinks = document.querySelectorAll('.menu-link');

    // Thêm vào ngay dưới `const menuLinks`

    let companyData = null; // Biến toàn cục để lưu trữ dữ liệu công ty từ XML

    // THAY THẾ TOÀN BỘ HÀM NÀY
    /**
     * Hàm tải và phân tích dữ liệu nội bộ (công ty và tồn kho)
     */
    async function loadCompanyData() {
        try {
            // Sử dụng Promise.all để tải song song 2 file
            const [companyResponse, inventoryResponse] = await Promise.all([
                fetch('data/company_data.xml'),
                fetch('data/inventory_data.json')
            ]);

            if (!companyResponse.ok) throw new Error('Could not load company_data.xml');
            if (!inventoryResponse.ok) throw new Error('Could not load inventory_data.json');

            // Xử lý file company_data.xml
            const xmlText = await companyResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            const companyInfo = {
                // Nâng cấp cách đọc suppliers để lấy thêm ID và Location
                suppliers: Array.from(xmlDoc.querySelectorAll('supplier')).map(s => ({
                    id: s.getAttribute('id'),
                    name: s.getAttribute('name'),
                    location: s.getAttribute('location')
                })),
                locations: Array.from(xmlDoc.querySelectorAll('location')).map(l => l.textContent),
                materials: Array.from(xmlDoc.querySelectorAll('material')).map(m => m.textContent)
            };

            // Xử lý file inventory_data.json
            const inventoryInfo = await inventoryResponse.json();

            // Gộp 2 dữ liệu lại vào biến toàn cục companyData
            companyData = {
                ...companyInfo,
                inventory: inventoryInfo.inventory
            };

            console.log("✅ Company and inventory data loaded successfully:", companyData);

        } catch (error) {
            console.error("Failed to load internal data:", error);
            // Tạo dữ liệu mặc định nếu tải file thất bại
            companyData = { suppliers: [], locations: [], materials: [], inventory: [] };
        }
    }

    // Thêm vào đầu file js/app.js, dưới các hằng số khác

    const OPENROUTER_API_KEY = "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"; // <<< THAY BẰNG KEY CỦA BẠN

    // ==========================================================================
    // CHỨC NĂNG 1: THỜI TIẾT TỔNG QUAN (SIDEBAR TRÁI - DÙNG API THANHNIEN.VN)
    // ==========================================================================

    /**
     * Hàm chính để khởi tạo widget thời tiết ở sidebar.
     */
    function initializeWeatherOverview() {
        const locationSelect = document.getElementById('overview-location-select');
        if (!locationSelect) return;

        // Lấy danh sách tỉnh từ hàm showWeatherDetails để tránh lặp code
        const provinces = getProvincesList();

        // 1. Đổ danh sách tỉnh vào dropdown
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            locationSelect.appendChild(option);
        });

        // 2. Tìm ID của "Hồ Chí Minh" để làm mặc định
        const defaultLocation = provinces.find(p => p.name === "Hồ Chí Minh");
        const defaultLocationId = defaultLocation ? defaultLocation.id : provinces[0].id; // Nếu không thấy thì lấy cái đầu tiên

        // 3. Mặc định chọn TP. HCM
        locationSelect.value = defaultLocationId;

        // 4. Gắn sự kiện 'change' cho dropdown
        locationSelect.addEventListener('change', (event) => {
            const selectedLocationId = event.target.value;
            if (selectedLocationId) {
                fetchWeatherForSidebar(selectedLocationId);
            }
        });

        // 5. Tải dữ liệu thời tiết cho địa điểm mặc định
        fetchWeatherForSidebar(defaultLocationId);
    }

    /**
     * Hàm lấy và hiển thị thời tiết cho một địa điểm được chọn ở sidebar.
     * @param {string} provinceId - ID của tỉnh từ API Thanh Niên.
     */
    // Thay thế toàn bộ hàm fetchWeatherForSidebar

    function fetchWeatherForSidebar(provinceId) {
        const container = document.getElementById('weather-overview-container');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"></div>';

        const apiUrl = `https://eth2.cnnd.vn/ajax/weatherinfo/${provinceId}.htm`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', proxyUrl, true);
        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText).Data.data.datainfo;
                    const todayForecast = data.forecast[0];

                    const now = new Date();
                    const formattedDate = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

                    // --- PHẦN HTML ĐÃ ĐƯỢC CẬP NHẬT LẠI ---
                    const weatherHTML = `
                    <div class="overview-weather">
                        <div class="overview-weather-location">${data.location}</div>
                        <div class="overview-weather-date">${formattedDate}</div>
                        
                        <div class="overview-weather-main">
                            <img class="overview-weather-icon" src="${data.shadow_icon}" alt="${data.status}">
                            <div class="overview-weather-temp">${data.temperature}<span>°</span></div>
                        </div>

                        <div class="overview-weather-desc">${data.status}</div>
                        <div class="overview-weather-range">
                            Cao: ${todayForecast.high}° / Thấp: ${todayForecast.low}°
                        </div>

                        <div class="overview-weather-details">
                            <div class="detail-item">
                                <span class="detail-label">Độ ẩm</span>
                                <span class="detail-value">${data.humidity}%</span>
                            </div>
                            ${(data.wind && data.wind.index) ? `
                                <div class="detail-item">
                                    <span class="detail-label">Gió</span>
                                    <span class="detail-value">${data.wind.index} km/h</span>
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <span class="detail-label">Cảm giác</span>
                                <span class="detail-value">${data.feels_like}°</span>
                            </div>
                        </div>
                    </div>
                `;
                    container.innerHTML = weatherHTML;

                } catch (error) {
                    console.error(`Failed to parse weather for sidebar:`, error);
                    container.innerHTML = `<p class="error-message" style="color:red; padding:16px;">Lỗi xử lý dữ liệu.</p>`;
                }
            } else if (xhr.readyState === 4) {
                console.error(`Failed to fetch weather for sidebar, status:`, xhr.status);
                container.innerHTML = `<p class="error-message" style="color:red; padding:16px;">Không thể tải dữ liệu.</p>`;
            }
        };
    }


    function getProvincesList() {
        return [{ "id": "2347719", "name": "An Giang" },
        { "id": "20070081", "name": "Bạc Liêu" }, { "id": "20070087", "name": "Bắc Giang" },
        { "id": "20070084", "name": "Bắc Kạn" }, { "id": "20070088", "name": "Bắc Ninh" },
        { "id": "2347703", "name": "Bến Tre" }, { "id": "20070078", "name": "Bình Dương" },
        { "id": "2347730", "name": "Bình Định" }, { "id": "20070086", "name": "Bình Phước" },
        { "id": "2347731", "name": "Bình Thuận" }, { "id": "20070082", "name": "Cà Mau" },
        { "id": "2347732", "name": "Cần Thơ" }, { "id": "2347704", "name": "Cao Bằng" },
        { "id": "1252375", "name": "Đà Lạt" }, { "id": "20070085", "name": "Đà Nẵng" },
        { "id": "2347720", "name": "Đắk Lắk" }, { "id": "28301719", "name": "Đắk Nông" },
        { "id": "28301718", "name": "Điện Biên" }, { "id": "2347721", "name": "Đồng Nai" },
        { "id": "2347722", "name": "Đồng Tháp" }, { "id": "2347733", "name": "Gia Lai" },
        { "id": "2347734", "name": "Hà Giang" }, { "id": "2347741", "name": "Hà Nam" },
        { "id": "2347727", "name": "Hà Nội" }, { "id": "2347736", "name": "Hà Tĩnh" },
        { "id": "20070080", "name": "Hải Dương" }, { "id": "2347707", "name": "Hải Phòng" },
        { "id": "28301720", "name": "Hậu Giang" }, { "id": "2347737", "name": "Hòa Bình" },
        { "id": "2347728", "name": "Hồ Chí Minh" }, { "id": "20070079", "name": "Hưng Yên" },
        { "id": "2347738", "name": "Khánh Hòa" }, { "id": "2347723", "name": "Kiên Giang" },
        { "id": "20070076", "name": "Kon Tum" }, { "id": "2347708", "name": "Lai Châu" },
        { "id": "2347709", "name": "Lâm Đồng" }, { "id": "2347718", "name": "Lạng Sơn" },
        { "id": "2347740", "name": "Lào Cai" }, { "id": "2347710", "name": "Long An" },
        { "id": "20070089", "name": "Nam Định" }, { "id": "2347742", "name": "Nghệ An" },
        { "id": "2347743", "name": "Ninh Bình" }, { "id": "2347744", "name": "Ninh Thuận" },
        { "id": "20070091", "name": "Phú Thọ" }, { "id": "2347745", "name": "Phú Yên" },
        { "id": "2347746", "name": "Quảng Bình" }, { "id": "2347711", "name": "Quảng Nam" },
        { "id": "20070077", "name": "Quảng Ngãi" }, { "id": "2347712", "name": "Quảng Ninh" },
        { "id": "2347747", "name": "Quảng Trị" }, { "id": "2347748", "name": "Sóc Trăng" },
        { "id": "2347713", "name": "Sơn La" }, { "id": "2347714", "name": "Tây Ninh" },
        { "id": "2347716", "name": "Thái Bình" }, { "id": "20070083", "name": "Thái Nguyên" },
        { "id": "2347715", "name": "Thanh Hóa" }, { "id": "2347749", "name": "Thừa Thiên Huế" },
        { "id": "2347717", "name": "Tiền Giang" }, { "id": "2347750", "name": "Trà Vinh" },
        { "id": "2347751", "name": "Tuyên Quang" }, { "id": "2347752", "name": "Vĩnh Long" },
        { "id": "20070090", "name": "Vĩnh Phúc" }, { "id": "2347729", "name": "Vũng Tàu" },
        { "id": "2347753", "name": "Yên Bái" }];
    }



    // ==========================================================================
    // CHỨC NĂNG 2: THỜI TIẾT CHI TIẾT (MAIN CONTENT)
    // ==========================================================================

    function showWeatherDetails() {
        const provinces = getProvincesList();

        mainContent.innerHTML = `
            <div class="content-header"><h2>Vietnam Weather Details (from ThanhNien.vn)</h2></div>
            <div class="filter-controls" style="padding: 0 16px 16px 16px;">
                <label for="province-select">Choose a province/city:</label>
                <select id="province-select"><option value="">-- Please select --</option></select>
            </div>
            <div id="weather-result-table" style="padding: 0 16px;"></div>`;

        const provinceSelect = document.getElementById('province-select');
        provinces.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            provinceSelect.appendChild(option);
        });
        provinceSelect.addEventListener('change', e => {
            if (e.target.value) {
                fetchWeatherForProvince(e.target.value)
            } else {
                document.getElementById('weather-result-table').innerHTML = '';
            }
        });
    }

    function fetchWeatherForProvince(provinceId) {
        const resultDiv = document.getElementById('weather-result-table');
        resultDiv.innerHTML = '<div class="loading-spinner"></div>';
        const apiUrl = `https://eth2.cnnd.vn/ajax/weatherinfo/${provinceId}.htm`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', proxyUrl, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const info = JSON.parse(xhr.responseText).Data.data.datainfo;
                        let tableHTML = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th rowspan="2">City</th><th rowspan="2">Date</th><th colspan="2">Temperature</th>
                                    <th rowspan="2">Status</th><th rowspan="2">Icon</th>
                                </tr>
                                <tr><th>Low</th><th>High</th></tr>
                            </thead>
                            <tbody>`;

                        info.forecast.forEach((fc, index) => {
                            if (index === 0) {
                                tableHTML += `<tr>
                                    <td><strong>${info.location} (Now)</strong></td>
                                    <td>Current<br><small>${info.temperature}°C (Feels like: ${info.feels_like}°C)</small></td>
                                    <td>${fc.low}°C</td><td>${fc.high}°C</td><td>${info.status}</td>
                                    <td><img src="${info.shadow_icon}" alt="${info.status}" style="width: 50px;"></td></tr>`;
                            } else {
                                tableHTML += `<tr>
                                    <td>${info.location}</td><td>${fc.date} (${fc.forecastDate})</td>
                                    <td>${fc.low}°C</td><td>${fc.high}°C</td><td>${info.status}</td>
                                    <td><img src="${fc.shadow_icon}" alt="${fc.status}" style="width: 40px;"></td></tr>`;
                            }
                        });
                        tableHTML += '</tbody></table>';
                        resultDiv.innerHTML = tableHTML;
                    } catch (e) {
                        resultDiv.innerHTML = '<p class="error-message" style="color:red;">Error parsing data.</p>';
                    }
                } else {
                    resultDiv.innerHTML = '<p class="error-message" style="color:red;">Could not load data.</p>';
                }
            }
        };
    }

    // ==========================================================================
    // CHỨC NĂNG 3: TIN TỨC RSS (MAIN CONTENT - ĐÃ SỬA LỖI VÀ TỐI ƯU)
    // ==========================================================================

    /**
     * Hàm chính: Hiển thị giao diện và tải tin tức RSS
     */
    function showRssFeeds() {
        let categoryOptions = '<option value="all">Tất cả tin tức</option>';
        // Dropdown bây giờ sẽ dùng biến RELEVANT_RSS_FEEDS
        for (const category in RELEVANT_RSS_FEEDS) {
            categoryOptions += `<option value="${category}">${category}</option>`;
        }

        mainContent.innerHTML = `
            <div class="content-header">
                <h2>RSS News Feed Monitoring</h2>
                <div class="filter-controls">
                    <label for="rss-category-select">Lọc theo danh mục:</label>
                    <select id="rss-category-select">${categoryOptions}</select>
                    <button id="reload-rss-btn">Tải lại tin</button>
                </div>
            </div>
            <div id="rss-container" style="padding: 0 16px;"><div class="loading-spinner"></div></div>`;

        document.getElementById('rss-category-select').addEventListener('change', e => fetchAndDisplayRss(e.target.value));
        document.getElementById('reload-rss-btn').addEventListener('click', () => fetchAndDisplayRss(document.getElementById('rss-category-select').value, true));

        // Luôn tải tất cả các nguồn có liên quan khi chức năng này được gọi
        fetchAndDisplayRss('all', true);
    }

    let allRssData = [], lastFetchTime = 0;

    /**
     * Hàm để tải và hiển thị tin tức RSS theo danh mục
     */
    async function fetchAndDisplayRss(categoryToShow, forceReload = false) {
        const rssContainer = document.getElementById('rss-container');
        const now = new Date().getTime();

        // Kiểm tra cache
        if (!forceReload && allRssData.length > 0 && (now - lastFetchTime) < 300000) { // 5 phút
            renderRssItems(categoryToShow);
            return;
        }

        rssContainer.innerHTML = '<div class="loading-spinner"></div>';
        allRssData = [];

        // Luôn fetch từ danh sách đã được rút gọn
        const fetchPromises = Object.entries(RELEVANT_RSS_FEEDS).map(([category, url]) =>
            fetchSingleRss(url, category)
        );

        const results = await Promise.all(fetchPromises);
        results.forEach(items => allRssData.push(...items));
        allRssData.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        lastFetchTime = new Date().getTime();
        renderRssItems(categoryToShow);
    }

    /**
     * Hàm con để tải một nguồn RSS duy nhất (Dùng fetch API cho hiện đại)
     */
    async function fetchSingleRss(rssUrl, category) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const xmlText = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            // Kiểm tra lỗi parsing
            if (xmlDoc.querySelector("parsererror")) {
                throw new Error("Failed to parse XML.");
            }

            const parsedItems = [];
            const items = xmlDoc.querySelectorAll("item");
            items.forEach(item => {
                parsedItems.push({
                    category: category,
                    title: item.querySelector("title")?.textContent || "No Title",
                    link: item.querySelector("link")?.textContent || "#",
                    pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString()
                });
            });
            return parsedItems;
        } catch (e) {
            console.error(`Error processing RSS for ${category}:`, e);
            return []; // Trả về mảng rỗng nếu có lỗi để Promise.all không bị hỏng
        }
    }


    // Thay thế hàm renderRssItems

    function renderRssItems(categoryToShow) {
        const rssContainer = document.getElementById('rss-container');
        rssContainer.innerHTML = '';
        const itemsToDisplay = (categoryToShow === 'all') ? allRssData : allRssData.filter(item => item.category === categoryToShow);
        if (itemsToDisplay.length === 0) {
            rssContainer.innerHTML = '<p class="placeholder-text">Không có tin tức nào cho danh mục này.</p>';
            return;
        }

        itemsToDisplay.forEach(item => {
            // Thêm data-link-id để dễ dàng tìm thấy item này sau này
            const linkId = btoa(item.link); // Mã hóa link thành ID an toàn
            const itemHTML = `
            <div class="rss-item" data-link-id="${linkId}">
                <div class="rss-item-header">
                    <span class="rss-category">${item.category}</span>
                    <span class="rss-pubdate">${new Date(item.pubDate).toLocaleString('vi-VN')}</span>
                </div>
                <h4 class="rss-title">
                    <span class="ai-status-icon"></span>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                </h4>
            </div>`;
            rssContainer.innerHTML += itemHTML;
        });

        runAiAnalysis(itemsToDisplay);
    }


    // ==========================================================================
    // CHỨC NĂNG 4: PHÂN TÍCH RỦI RO BẰNG AI (GEMINI)
    // ==========================================================================

    const aiAlertsContainer = document.getElementById('ai-alerts-container');
    let analyzedItemIds = new Set(); // Dùng để tránh phân tích lại những tin đã phân tích
    let allAlerts = []; // Biến toàn cục để lưu trữ tất cả các cảnh báo



    /**
     * Hàm fetch nâng cao, có khả năng tự động thử lại khi gặp lỗi 429.
     * @param {string} url - URL của API
     * @param {object} options - Các tùy chọn của fetch (method, headers, body)
     * @param {number} retries - Số lần thử lại tối đa
     * @returns {Promise<Response>}
     */
    async function fetchWithRetry(url, options, retries = 3) {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                // Nếu gặp lỗi 429 (Too Many Requests), ném ra lỗi để thử lại
                if (response.status === 429) {
                    throw new Error('Rate Limited');
                }
                // Nếu là lỗi khác hoặc thành công, trả về kết quả ngay
                return response;
            } catch (error) {
                lastError = error;
                if (error.message === 'Rate Limited') {
                    // Tính thời gian chờ (1s, 2s, 4s...) và đợi
                    const delay = Math.pow(2, i) * 1000;
                    console.warn(`Rate limited. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Nếu là lỗi mạng khác, ném ra lỗi ngay
                    throw error;
                }
            }
        }
        // Nếu đã thử hết số lần mà vẫn lỗi, ném ra lỗi cuối cùng
        throw new Error(`Failed to fetch after ${retries} attempts: ${lastError.message}`);
    }


    /**
     * Hàm chính để kích hoạt phân tích AI trên các tin tức RSS đã tải.
     * @param {Array} rssItems - Mảng các đối tượng tin tức.
     */
    async function runAiAnalysis(rssItems) {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") {
            console.warn("DeepSeek API Key is not configured. Skipping AI analysis.");
            aiAlertsContainer.innerHTML = '<p class="placeholder-text">AI analysis is disabled. Please configure the API key.</p>';
            return;
        }

        // Làm sạch container cảnh báo nếu đây là lần tải mới
        if (analyzedItemIds.size === 0) {
            aiAlertsContainer.innerHTML = '';
        }

        const itemsToAnalyze = rssItems.filter(item => !analyzedItemIds.has(item.link));

        if (itemsToAnalyze.length === 0) {
            console.log("No new items to analyze.");
            return;
        }

        // Tạo một hàng đợi các lời hứa (promises) để gửi đến API
        const analysisPromises = itemsToAnalyze.map(item => analyzeSingleTitle(item));

        // Chạy tuần tự với khoảng nghỉ LỚN để không bị rate limit
        for (const promise of analysisPromises) {
            await promise; // Đợi một yêu cầu hoàn thành
            // Đợi 2 giây giữa mỗi yêu cầu. Tăng con số 2000 nếu vẫn bị lỗi.
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        // Cập nhật lại placeholder nếu không có cảnh báo nào
        if (aiAlertsContainer.childElementCount === 0) {
            aiAlertsContainer.innerHTML = '<p class="placeholder-text">No significant risks detected in the latest news.</p>';
        }
    }


    // Thêm hàm này vào khối chức năng 4

    /**
     * Hàm xử lý khi người dùng gửi một câu hỏi trong hộp chat.
     * @param {Event} event - Sự kiện submit của form.
     */
    // THAY THẾ TOÀN BỘ HÀM NÀY
    async function handleChatSubmit(event) {
        event.preventDefault();

        const chatInput = document.getElementById('chat-input-text');
        const chatMessages = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('chat-send-btn');
        const question = chatInput.value.trim();

        if (!question || !OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") { // << Thay đổi 1
            return;
        }

        chatInput.disabled = true;
        sendBtn.disabled = true;

        addChatMessage(question, 'user');
        chatInput.value = '';

        const loadingMessageId = `loading-${Date.now()}`;
        addChatMessage('Analyzing...', 'assistant', true, loadingMessageId);

        const newsContext = allRssData.map(item => `- ${item.title}`).join('\n');

        // THAY THẾ CÁC BIẾN NÀY
        const suppliersContext = companyData.suppliers.map(s => `- ${s.name} (ID: ${s.id}, Location: ${s.location})`).join('\n');
        const inventoryContext = companyData.inventory.map(i => {
            const supplier = companyData.suppliers.find(s => s.id === i.supplierId);
            return `- ${i.productName}: ${i.daysOfStock} days of stock, supplied by ${supplier ? supplier.name : 'Unknown'}. Note: ${i.notes}`;
        }).join('\n');

        const system_prompt = `You are a supply chain risk analysis assistant. Your role is to answer user questions based ONLY on the provided context of recent news headlines and your company's internal data (suppliers, inventory). Be concise and directly address the user's question with the available data. If the data is insufficient, state that clearly.`;

        const user_prompt = `
**CONTEXT:**

**1. Recent News Headlines:**
${newsContext}

**2. Your Company's Internal Data:**
   - Key Suppliers:
${suppliersContext}
   - Current Inventory Status:
${inventoryContext}

---
**USER QUESTION:** "${question}"
`;

        try {
            const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat-v3-0324:free",
                    messages: [
                        { "role": "system", "content": system_prompt },
                        { "role": "user", "content": user_prompt }
                    ]
                })
            }, 5
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            const data = await response.json();
            const answer = data.choices[0].message.content;

            updateChatMessage(answer, loadingMessageId);

        } catch (error) {
            console.error("Chat AI Error (DeepSeek):", error.message);
            updateChatMessage("Sorry, I encountered an error with the AI service.", loadingMessageId);
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    /**
     * Hàm trợ giúp để thêm tin nhắn vào hộp chat.
     */
    function addChatMessage(text, role, isLoading = false, id = null) {
        const chatMessages = document.getElementById('chat-messages');
        const placeholder = chatMessages.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', role);
        if (isLoading) messageDiv.classList.add('loading');
        if (id) messageDiv.id = id;
        messageDiv.textContent = text;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Tự động cuộn xuống tin nhắn mới nhất
    }

    /**
     * Hàm trợ giúp để cập nhật tin nhắn loading.
     */
    function updateChatMessage(newText, messageId) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            messageDiv.textContent = newText;
            messageDiv.classList.remove('loading');
        }
    }




    /**
     * Hàm gửi một tiêu đề đến Gemini và xử lý kết quả.
     * @param {object} item - Đối tượng tin tức (chứa title, link, category).
     */
    // Thay thế hàm analyzeSingleTitle

    // THAY THẾ TOÀN BỘ HÀM NÀY
    async function analyzeSingleTitle(item) {
        const linkId = btoa(item.link);
        analyzedItemIds.add(linkId);

        const rssElement = document.querySelector(`.rss-item[data-link-id="${linkId}"]`);
        const statusIcon = rssElement ? rssElement.querySelector('.ai-status-icon') : null;

        if (!companyData || !OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") { // << Thay đổi 1
            return;
        }

        // THAY THẾ BIẾN NÀY
        const suppliersContext = companyData.suppliers.map(s => `- ${s.name} (ID: ${s.id}, Location: ${s.location})`).join('\n');
        const inventoryContext = companyData.inventory.map(i => {
            const supplier = companyData.suppliers.find(s => s.id === i.supplierId);
            return `- ${i.productName}: ${i.daysOfStock} days of stock, supplied by ${supplier ? supplier.name : 'Unknown'}. Note: ${i.notes}`;
        }).join('\n');

        const prompt = `
You are a supply chain risk analysis AI for a motorcycle manufacturer.

**YOUR COMPANY'S INTERNAL DATA:**

**1. Key Suppliers:**
${suppliersContext}

**2. Critical Locations & Materials:**
${companyData.locations.join(', ')}, ${companyData.materials.join(', ')}

**3. Current Inventory Status:**
${inventoryContext}

---
**TASK:**
Analyze this news headline: "${item.title}"

Does this headline describe a risk that could impact ANY of the suppliers, locations, materials, or inventory items listed above?
Consider direct impacts (e.g., a supplier's name is mentioned) and indirect impacts (e.g., a typhoon hits a supplier's location, a price hike affects a material).
Pay special attention to items with low "days of stock".

If a risk is detected, answer with the single word: YES. Otherwise, answer with the single word: NO.
`;

        try {
            const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat-v3-0324:free",
                    messages: [{ "role": "user", "content": prompt }],
                    max_tokens: 5, // Chỉ cần câu trả lời ngắn YES/NO
                    temperature: 0.1
                })
            }, 5
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }

            const data = await response.json();
            const answer = data.choices[0].message.content.trim().toUpperCase();

            console.log(`AI analysis for "${item.title}": ${answer}`);

            if (answer.includes("YES")) {
                if (rssElement) rssElement.classList.add('risk-detected');
                createAlertCard(item);
                const mockAnalysis = {
                    impactedSuppliers: [], // Cần logic phức tạp hơn để xác định
                    impactedInventory: [], // Cần logic phức tạp hơn để xác định
                    summary: `AI detected a potential risk in this headline. Further investigation is needed.`,
                    severity: "Medium" // Mặc định là Medium khi phát hiện
                };
                createAlertCard(item, mockAnalysis);
            } else {
                if (statusIcon) statusIcon.classList.add('ai-status-analyzed');
            }

        } catch (error) {
            console.error(`AI Analysis Error for "${item.title}" (OpenRouter):`, error.message);
        }
    }

    // THAY THẾ TOÀN BỘ HÀM NÀY
    /**
     * Hàm tạo thẻ cảnh báo ở sidebar và lưu trữ cảnh báo vào danh sách toàn cục.
     * @param {object} item - Đối tượng tin tức gốc.
     * @param {object} analysis - Đối tượng phân tích của AI.
     */
    function createAlertCard(item, analysis = null) {
        // --- CẬP NHẬT LOGIC LƯU TRỮ ---
        // Chỉ thêm vào danh sách nếu chưa tồn tại
        if (!allAlerts.some(a => a.item.link === item.link)) {
            allAlerts.unshift({ item, analysis });
        }

        // --- PHẦN GIAO DIỆN SIDEBAR GIỮ NGUYÊN ---
        const placeholder = aiAlertsContainer.querySelector('.placeholder-text');
        if (placeholder) {
            placeholder.remove();
        }

        const alertCardHTML = `
        <div class="alert-card clickable" data-id="${item.id}" data-link="${item.link}">
            <span class="alert-category">${item.category}</span>
            <p class="alert-title">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            </p>
        </div>
    `;
        if (!aiAlertsContainer.querySelector(`[data-link="${item.link}"]`)) {
            aiAlertsContainer.insertAdjacentHTML('afterbegin', alertCardHTML);
        }
    }


    // Thêm vào file app.js

    // ==========================================================================
    // CHỨC NĂNG 5: QUẢN LÝ NHÀ CUNG CẤP (MAIN CONTENT)
    // ==========================================================================

    let supplierDetailsData = []; // Biến toàn cục lưu trữ dữ liệu chi tiết NCC

    /**
     * Hàm chính để hiển thị trang quản lý nhà cung cấp
     */
    async function showSuppliers() {
        mainContent.innerHTML = `<div class="loading-spinner"></div>`;

        try {
            // Tải lại dữ liệu từ XML để đảm bảo luôn mới nhất
            const response = await fetch('data/company_data.xml');
            if (!response.ok) throw new Error('Network response was not ok');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            // Phân tích và lưu trữ dữ liệu chi tiết
            supplierDetailsData = Array.from(xmlDoc.querySelectorAll('supplier')).map(s => {
                const riskProfile = s.querySelector('risk_profile');
                return {
                    id: s.getAttribute('id'),
                    name: s.getAttribute('name'),
                    tier: s.getAttribute('tier'),
                    location: s.getAttribute('location'),
                    status: s.getAttribute('status'),
                    contact: {
                        person: s.querySelector('contact > person')?.textContent || 'N/A',
                        email: s.querySelector('contact > email')?.textContent || 'N/A',
                        phone: s.querySelector('contact > phone')?.textContent || 'N/A',
                    },
                    products: Array.from(s.querySelectorAll('products > product')).map(p => p.textContent),
                    risk: {
                        rating: riskProfile?.querySelector('rating')?.textContent || 'Unknown',
                        notes: riskProfile?.querySelector('notes')?.textContent || 'No notes available.'
                    }
                };
            });

            // Hiển thị danh sách tóm tắt
            renderSupplierList();

        } catch (error) {
            console.error("Failed to load or parse supplier data:", error);
            mainContent.innerHTML = `<p class="error-message">Could not load supplier data.</p>`;
        }
    }

    /**
     * Hàm hiển thị danh sách tóm tắt các nhà cung cấp
     */
    function renderSupplierList() {
        let tableHTML = `
        <div class="content-header">
            <h2>Supplier Overview</h2>
        </div>
        <div style="padding: 0 16px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Supplier Name</th>
                        <th>Location</th>
                        <th>Tier</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

        supplierDetailsData.forEach(supplier => {
            // Thêm class màu cho status
            const statusClass = supplier.status.toLowerCase();
            tableHTML += `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.location}</td>
                <td>${supplier.tier}</td>
                <td><span class="status-badge ${statusClass}">${supplier.status}</span></td>
                <td>
                    <button class="action-btn" data-id="${supplier.id}">View Details</button>
                </td>
            </tr>
        `;
        });

        tableHTML += `
                </tbody>
            </table>
        </div>
    `;

        mainContent.innerHTML = tableHTML;

        // Gắn sự kiện click cho các nút "View Details"
        mainContent.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const supplierId = event.target.dataset.id;
                showSupplierDetails(supplierId);
            });
        });
    }

    // THAY THẾ TOÀN BỘ HÀM NÀY
    /**
     * Hàm hiển thị thông tin chi tiết của một nhà cung cấp
     * @param {string} supplierId - ID của nhà cung cấp
     */
    function showSupplierDetails(supplierId) {
        const supplier = supplierDetailsData.find(s => s.id === supplierId);
        if (!supplier) {
            renderSupplierList(); // Quay lại danh sách nếu không tìm thấy
            return;
        }

        // --- BẮT ĐẦU PHẦN CODE MỚI ---
        // Lọc ra các sản phẩm tồn kho do nhà cung cấp này cung cấp
        const relatedInventory = companyData.inventory.filter(item => item.supplierId === supplierId);

        let inventoryHTML = '<p>No inventory data available for this supplier.</p>';
        if (relatedInventory.length > 0) {
            inventoryHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Days of Stock</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${relatedInventory.map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td>${item.daysOfStock}</td>
                            <td>${item.notes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        }
        // --- KẾT THÚC PHẦN CODE MỚI ---

        // Thêm class màu cho mức độ rủi ro
        const riskClass = supplier.risk.rating.toLowerCase();

        let detailsHTML = `
    <div class="content-header">
        <h2>Details for: ${supplier.name}</h2>
        <button id="back-to-list-btn">← Back to Supplier List</button>
    </div>
    <div class="details-container">
        <div class="details-card">
            <h3>General Information</h3>
            <p><strong>ID:</strong> ${supplier.id}</p>
            <p><strong>Location:</strong> ${supplier.location}</p>
            <p><strong>Tier:</strong> ${supplier.tier}</p>
        </div>
        <div class="details-card">
            <h3>Contact Person</h3>
            <p><strong>Name:</strong> ${supplier.contact.person}</p>
            <p><strong>Email:</strong> <a href="mailto:${supplier.contact.email}">${supplier.contact.email}</a></p>
            <p><strong>Phone:</strong> ${supplier.contact.phone}</p>
        </div>
        <div class="details-card">
            <h3>Products Supplied (from XML)</h3>
            <ul>
                ${supplier.products.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>
        <div class="details-card">
            <h3>Risk Profile</h3>
            <p><strong>Risk Rating:</strong> <span class="risk-badge ${riskClass}">${supplier.risk.rating}</span></p>
            <p><strong>Notes:</strong> ${supplier.risk.notes}</p>
        </div>
        
        <!-- CHÈN BẢNG TỒN KHO VÀO ĐÂY -->
        <div class="details-card full-width">
            <h3>Inventory Status (from JSON)</h3>
            ${inventoryHTML}
        </div>
    </div>
    `;
        mainContent.innerHTML = detailsHTML;

        // Gắn sự kiện cho nút back
        document.getElementById('back-to-list-btn').addEventListener('click', renderSupplierList);
    }



    // ==========================================================================
    // CHỨC NĂNG 6: TRANG QUẢN LÝ CẢNH BÁO (ALERTS)
    // ==========================================================================

    // THAY THẾ TOÀN BỘ HÀM NÀY
    /**
     * Hàm chính để hiển thị trang quản lý cảnh báo với thông tin chi tiết
     */
    function showAlertsPage() {
        let alertsHTML = `
        <div class="content-header">
            <h2>All Risk Alerts</h2>
        </div>
        <!-- Thêm khu vực cho biểu đồ giả lập -->
        <div class="dashboard-charts">
            <div class="chart-card">
                <h4>Alerts by Severity</h4>
                <div class="chart-placeholder" id="severity-chart">
                    <p>High: ${allAlerts.filter(a => a.analysis && a.analysis.severity === 'High').length}</p>
                    <p>Medium: ${allAlerts.filter(a => a.analysis && a.analysis.severity === 'Medium').length}</p>
                    <p>Low: ${allAlerts.filter(a => a.analysis && a.analysis.severity === 'Low').length}</p>
                </div>
            </div>
            <div class="chart-card">
                <h4>Impacted Items (Low Stock)</h4>
                <div class="chart-placeholder" id="stock-chart">
                    ${allAlerts
                .filter(a => a.analysis) // Chỉ lấy các alert có phân tích
                .flatMap(a => a.analysis.impactedInventory)
                .filter(inv => inv.daysOfStock < 15)
                .map(inv => `<p>${inv.productName} (${inv.daysOfStock} days)</p>`)
                .join('') || '<p>No low-stock items impacted.</p>'}
                </div>
            </div>
        </div>

        <div class="alerts-page-container">
    `;

        if (allAlerts.length === 0) {
            alertsHTML += `<p class="placeholder-text">No risk alerts have been detected yet.</p>`;
        } else {
            alertsHTML += allAlerts.map(alertData => {
                const { item, analysis } = alertData;
                // Nếu không có phân tích (dành cho AI thật sau này), tạo một analysis mặc định
                const displayAnalysis = analysis || { severity: 'Unknown', summary: 'Analysis not available.', impactedSuppliers: [] };
                const severityClass = displayAnalysis.severity.toLowerCase();

                return `
                <div class="alert-page-item severity-${severityClass} clickable" data-id="${item.id}">
                    <div class="alert-page-item-header">
                        <span class="rss-category">${item.category}</span>
                        <span class="rss-pubdate">${new Date(item.pubDate).toLocaleString('vi-VN')}</span>
                    </div>
                    <h4 class="alert-page-item-title">${item.title}</h4>
                    <div class="alert-analysis">
                        <p><strong>Summary:</strong> ${analysis.summary}</p>
                    </div>
                </div>
            `;
            }).join('');
        }

        alertsHTML += `</div>`;
        mainContent.innerHTML = alertsHTML;

        mainContent.querySelectorAll('.alert-page-item.clickable').forEach(card => {
            card.addEventListener('click', () => {
                showAlertDetailPage(card.dataset.id);
            });
        });
    }


    /**
 * Hiển thị trang chi tiết cho một cảnh báo cụ thể
 * @param {string} alertId - ID của cảnh báo
 */
    function showAlertDetailPage(alertId) {
        const alertData = allAlerts.find(a => a.item.id === alertId);
        if (!alertData) {
            showAlertsPage(); // Quay lại nếu không tìm thấy
            return;
        }

        const { item, analysis } = alertData;
        const severityClass = analysis.severity.toLowerCase();

        // Giả lập biểu đồ bằng HTML và CSS
        const stockChartValue = analysis.metrics.inventoryImpact[1].value;
        const stockChartSafety = analysis.metrics.inventoryImpact[0].value;
        const stockPercentage = Math.min((stockChartValue / stockChartSafety) * 100, 100);

        let detailsHTML = `
        <div class="content-header">
            <h2>Alert Detail: ${item.id}</h2>
            <button id="back-to-alerts-list-btn">← Back to Alerts List</button>
        </div>

        <div class="alert-detail-container">
            <!-- Cột trái: Thông tin chính -->
            <div class="alert-detail-main">
                <div class="details-card">
                    <h3>Original News Headline</h3>
                    <p><strong>Category:</strong> ${item.category}</p>
                    <p><strong>Published:</strong> ${new Date(item.pubDate).toLocaleString('vi-VN')}</p>
                    <h4><a href="${item.link}" target="_blank">${item.title}</a></h4>
                </div>

                <div class="details-card">
                    <h3>AI Impact Analysis</h3>
                    <p><strong>Severity:</strong> <span class="risk-badge ${severityClass}">${analysis.severity}</span></p>
                    <p><strong>Summary:</strong> ${analysis.summary}</p>
                </div>

                <div class="details-card">
                    <h3>Recommended Actions</h3>
                    <ul>
                        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- Cột phải: Biểu đồ và Ghi chú -->
            <div class="alert-detail-sidebar">
                <div class="chart-card">
                    <h4>Inventory Impact</h4>
                    <p><strong>Item:</strong> ${analysis.impactedInventory[0].productName}</p>
                    <div class="bar-chart">
                        <div class="bar-label">Current Stock: ${stockChartValue} days</div>
                        <div class="bar-container">
                            <div class="bar-value" style="width: ${stockPercentage}%; background-color: ${stockPercentage < 50 ? '#de350b' : '#ffab00'};"></div>
                        </div>
                        <div class="bar-safety-line" style="left: ${Math.min((stockChartSafety / (stockChartSafety * 1.5)) * 100, 100)}%;"></div>
                        <div class="bar-safety-label">Safety: ${stockChartSafety} days</div>
                    </div>
                </div>

                 <div class="chart-card">
                    <h4>Estimated Production Delay</h4>
                    <div class="metric-display">
                        <span class="metric-value">${analysis.metrics.productionDelay.estimateDays}</span>
                        <span class="metric-unit">days</span>
                    </div>
                    <p style="text-align:center; margin-top: 8px;">Confidence: <strong>${analysis.metrics.productionDelay.confidence}</strong></p>
                </div>

                <div class="details-card">
                    <h3>Analyst Notes</h3>
                    <textarea placeholder="Add your notes and action plan here..."></textarea>
                </div>
            </div>
        </div>
    `;
        mainContent.innerHTML = detailsHTML;

        document.getElementById('back-to-alerts-list-btn').addEventListener('click', showAlertsPage);
    }

    // THAY THẾ TOÀN BỘ HÀM NÀY
    function mockGenerateAlerts() {
        console.log("Mocking some DETAILED alerts for testing...");
        allAlerts = []; // Luôn reset trước khi tạo mới
        aiAlertsContainer.innerHTML = '';

        const mockData = [
            { item: { id: "alert-001", category: "Sự kiện", title: "Lũ lụt nghiêm trọng tại Đà Nẵng, nhiều khu công nghiệp bị ngập sâu", link: "#", pubDate: new Date().toISOString() }, analysis: { severity: "High", summary: "Rủi ro CAO. Lũ lụt tại Đà Nẵng có khả năng cao gây gián đoạn sản xuất và giao hàng từ nhà cung cấp DRC. Tồn kho lốp xe chỉ còn 7 ngày, cần có kế hoạch dự phòng ngay lập tức.", impactedSuppliers: [{ id: "VN003", name: "Cao su Đà Nẵng (DRC)" }], impactedInventory: [{ productName: "Lốp xe máy", daysOfStock: 7 }], recommendations: ["Liên hệ ngay với DRC để xác nhận tình trạng nhà máy và khả năng giao hàng.", "Xem xét kích hoạt nhà cung cấp lốp xe dự phòng ở Thái Lan.", "Kiểm tra lại lịch trình sản xuất để ưu tiên các dòng xe không sử dụng lốp của DRC."], metrics: { inventoryImpact: [{ name: 'Safety Stock', value: 14 }, { name: 'Current Stock', value: 7 }], productionDelay: { estimateDays: 10, confidence: "High" } } } },
            { item: { id: "alert-002", category: "Thế Giới", title: "Căng thẳng gia tăng tại eo biển Đài Loan, vận tải biển bị ảnh hưởng", link: "#", pubDate: new Date(Date.now() - 3600 * 1000).toISOString() }, analysis: { severity: "Medium", summary: "Rủi ro TRUNG BÌNH. Tình hình có thể ảnh hưởng vận chuyển chip từ TSMC trong dài hạn. Mặc dù tồn kho an toàn (90 ngày), cần theo dõi chặt chẽ.", impactedSuppliers: [{ id: "TW001", name: "TSMC" }], impactedInventory: [{ productName: "Chip điều khiển ECU", daysOfStock: 90 }], recommendations: ["Xây dựng kịch bản ứng phó nếu tuyến vận tải biển bị đóng trong 30-60 ngày.", "Tìm kiếm các nhà cung cấp chip thay thế ở các khu vực khác (Hàn Quốc, Mỹ)."], metrics: { inventoryImpact: [{ name: 'Safety Stock', value: 60 }, { name: 'Current Stock', value: 90 }], productionDelay: { estimateDays: 0, confidence: "Low" } } } },
            { item: { id: "alert-003", category: "Kinh Doanh", title: "Giá hạt nhựa ABS toàn cầu dự báo tăng 20% trong quý tới", link: "#", pubDate: new Date(Date.now() - 7200 * 1000).toISOString() }, analysis: { severity: "Low", summary: "Rủi ro THẤP. Giá nguyên liệu tăng có thể ảnh hưởng chi phí sản xuất. Cần đàm phán với A-Plastics cho các đơn hàng tương lai.", impactedSuppliers: [{ id: "VN002", name: "Công ty Nhựa Kỹ thuật A-Plastics" }], impactedInventory: [{ productName: "Dàn áo xe máy (nhựa ABS)", daysOfStock: 15 }], recommendations: ["Đàm phán để chốt giá cho đơn hàng lớn tiếp theo ngay bây giờ.", "Nghiên cứu các vật liệu thay thế có chi phí thấp hơn."], metrics: { inventoryImpact: [{ name: 'Safety Stock', value: 10 }, { name: 'Current Stock', value: 15 }], productionDelay: { estimateDays: 0, confidence: "Low" } } } }
        ];

        mockData.forEach(alertData => {
            createAlertCard(alertData.item, alertData.analysis);
        });
    }
    // ==========================================================================
    // QUẢN LÝ HIỂN THỊ VÀ SỰ KIỆN (ĐÃ SỬA LẠI CHO ĐÚNG)
    // ==========================================================================

    // Lấy tất cả các nút menu thật từ HTML
    const allMenuLinks = document.querySelectorAll('.menu-link');

    // Thay thế toàn bộ hàm này
    function handleMenuClick(event) {
        event.preventDefault(); // Ngăn trình duyệt tải lại trang

        // Bỏ class 'active' khỏi tất cả các nút menu
        menuLinks.forEach(link => link.classList.remove('active'));

        // Thêm class 'active' cho nút vừa được click
        const clickedLink = event.currentTarget;
        clickedLink.classList.add('active');

        // Lấy giá trị data-content để quyết định hiển thị nội dung gì
        const contentToShow = clickedLink.dataset.content;

        // Gọi hàm tương ứng
        if (contentToShow === 'rss') {
            showRssFeeds(); // Gọi hàm hiển thị giao diện và tải RSS
        } else if (contentToShow === 'weather') {
            showWeatherDetails(); // Gọi hàm hiển thị giao diện thời tiết
        } else if (contentToShow === 'suppliers') {
            showSuppliers();
        } else if (contentToShow === 'alerts') { // << THÊM KHỐI NÀY
            showAlertsPage();
        } else {
            // Mặc định, quay về dashboard chính
            showDashboard();
        }
    }


    // --- GÁN SỰ KIỆN CHO FORM CHAT ---
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    // Gắn sự kiện click cho từng nút menu
    allMenuLinks.forEach(link => {
        link.addEventListener('click', handleMenuClick);
    });

    const rescanBtn = document.getElementById('ai-rescan-btn');
    const clearBtn = document.getElementById('ai-clear-btn');

    if (rescanBtn) {
        rescanBtn.addEventListener('click', () => {
            console.log("Re-scanning news for risks...");
            // Reset lại trạng thái đã phân tích
            analyzedItemIds.clear();
            aiAlertsContainer.innerHTML = '<p class="placeholder-text">Re-scanning...</p>';

            // Xóa hết highlight cũ
            document.querySelectorAll('.rss-item').forEach(item => {
                item.classList.remove('risk-detected');
                item.querySelector('.ai-status-icon').classList.remove('ai-status-analyzed');
            });

            // Chạy lại phân tích trên toàn bộ tin tức đang hiển thị
            runAiAnalysis(allRssData);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log("Clearing AI alerts...");
            aiAlertsContainer.innerHTML = '<p class="placeholder-text">Alerts cleared.</p>';

            // Xóa dữ liệu trong biến toàn cục
            allAlerts = [];

            // Nếu đang ở trang Alerts, cập nhật lại giao diện
            if (document.querySelector('.alerts-page-container')) {
                showAlertsPage();
            }
        });
    }

    // ==========================================================================
    // KHỞI TẠO DASHBOARD
    // ==========================================================================
    // THAY THẾ TOÀN BỘ HÀM NÀY
    async function initializeDashboard() {
        await loadCompanyData();
        initializeWeatherOverview();

        // BƯỚC 1: TẠO DỮ LIỆU GIẢ LẬP TRƯỚC
        mockGenerateAlerts();

        // BƯỚC 2: HIỂN THỊ DASHBOARD SAU KHI ĐÃ CÓ DỮ LIỆU
        showDashboard();

        // Gắn sự kiện cho sidebar một lần duy nhất ở đây
        aiAlertsContainer.addEventListener('click', (event) => {
            const card = event.target.closest('.alert-card.clickable');
            if (card) {
                showAlertDetailPage(card.dataset.id);
            }
        });
    }
    // Chạy hàm khởi tạo
    initializeDashboard();
    window.showAlertDetailPage = showAlertDetailPage;

});