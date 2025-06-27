/**
 * Governance Accountability Tracker Application
 * This script handles the report submission, display, search, and filtering functionality
 * It also manages the slideshow feature for browsing reports
 */

// DOM Elements
const reportForm = document.getElementById('reportForm');
const reportsList = document.getElementById('reportsList');
const countySelect = document.getElementById('countyCode');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const mediaInput = document.getElementById('media');
const mediaPreview = document.getElementById('mediaPreview');
const searchInput = document.getElementById('searchInput');
const filterOfficial = document.getElementById('filterOfficial');
const filterCounty = document.getElementById('filterCounty');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');

// Quill editor instance
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link']
        ]
    }
});

// Initialize the application
init();

/**
 * Initializes the application by setting up all required components
 */
function init() {
    loadCounties();
    loadCountyFilters();
    loadReports();
    setupEventListeners();
    setupSlideshow();
    
    // Sync Quill editor content with hidden textarea
    quill.on('text-change', function() {
        document.getElementById('description').value = quill.root.innerHTML;
    });
}

/**
 * Loads Kenya counties into the county select dropdown
 */
function loadCounties() {
    kenyaCounties.forEach(function(county) {
        const option = document.createElement('option');
        option.value = county.code;
        option.textContent = county.code + ' - ' + county.name;
        countySelect.appendChild(option);
    });
}

/**
 * Loads Kenya counties into the filter dropdown
 */
function loadCountyFilters() {
    kenyaCounties.forEach(function(county) {
        const option = document.createElement('option');
        option.value = county.code;
        option.textContent = county.code + ' - ' + county.name;
        filterCounty.appendChild(option);
    });
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Form submission
    reportForm.addEventListener('submit', handleSubmit);
    
    // Data management buttons
    exportBtn.addEventListener('click', exportReports);
    importBtn.addEventListener('click', function() {
        importFile.click();
    });
    importFile.addEventListener('change', importReports);
    
    // Media handling
    mediaInput.addEventListener('change', previewMedia);
    
    // Search and filtering
    applyFilters.addEventListener('click', applyReportFilters);
    clearFilters.addEventListener('click', clearReportFilters);
    searchInput.addEventListener('input', searchReports);
}

/**
 * Handles form submission for new reports
 * @param {Event} e - The submit event
 */
function handleSubmit(e) {
    e.preventDefault();

    // Create report object from form data
    const report = {
        id: Date.now(),
        issueType: document.getElementById('issueType').value,
        issueTitle: document.getElementById('issueTitle').value,
        official: {
            name: document.getElementById('officialName').value,
            position: document.getElementById('officialPosition').value
        },
        county: countySelect.value,
        countyName: countySelect.options[countySelect.selectedIndex].text,
        media: [],
        date: new Date().toLocaleString(),
        description: document.getElementById('description').value,
        isRichText: true
    };

    // Process media files
    const mediaPromises = Array.from(mediaInput.files).map(function(file) {
        return new Promise(function(resolve) {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve({
                    name: file.name,
                    type: file.type,
                    data: e.target.result.split(',')[1]
                });
            };
            reader.readAsDataURL(file);
        });
    });

    // Save report after processing media
    Promise.all(mediaPromises).then(function(mediaFiles) {
        report.media = mediaFiles;
        saveReport(report);
        reportForm.reset();
        mediaPreview.innerHTML = '';
        quill.root.innerHTML = '';
        loadReports();
    });
}

/**
 * Saves a report to local storage
 * @param {Object} report - The report object to save
 */
function saveReport(report) {
    const reports = JSON.parse(localStorage.getItem('governanceReports')) || [];
    reports.push(report);
    localStorage.setItem('governanceReports', JSON.stringify(reports));
    saveToDB(reports); // Also save to simulated db.json
}

/**
 * Loads and displays reports from local storage
 */
function loadReports() {
    let reports = JSON.parse(localStorage.getItem('governanceReports')) || [];
    
    // Apply search filter if any
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        reports = reports.filter(function(report) {
            return report.issueTitle.toLowerCase().includes(searchTerm) || 
                   report.description.toLowerCase().includes(searchTerm) ||
                   report.official.name.toLowerCase().includes(searchTerm) ||
                   report.official.position.toLowerCase().includes(searchTerm);
        });
    }
    
    // Apply official filter if any
    const officialFilter = filterOfficial.value.toLowerCase();
    if (officialFilter) {
        reports = reports.filter(function(report) {
            return report.official.name.toLowerCase().includes(officialFilter);
        });
    }
    
    // Apply county filter if any
    const countyFilter = filterCounty.value;
    if (countyFilter) {
        reports = reports.filter(function(report) {
            return report.county === countyFilter;
        });
    }
    
    // Display the filtered reports
    displayReports(reports);
}

/**
 * Displays reports in the UI
 * @param {Array} reports - Array of report objects to display
 */
function displayReports(reports) {
    if (reports.length === 0) {
        reportsList.innerHTML = '<div class="report-card"><p>No reports found matching your criteria.</p></div>';
        return;
    }
    
    reportsList.innerHTML = reports.map(function(report, index) {
        return `
        <div class="report-card ${index === 0 ? 'active' : ''}" data-id="${report.id}">
            <h3>${report.issueType.toUpperCase().replace('_', ' ')}: ${report.issueTitle}</h3>
            <div class="report-content">${report.description}</div>
            <div class="meta">
                <strong>👤 Official:</strong> ${report.official.name} (${report.official.position})<br>
                <strong>📍 Location:</strong> ${report.countyName}<br>
                <strong>📅 Date:</strong> ${report.date}
            </div>
            ${report.media.length ? `
                <div class="media-preview">
                    ${report.media.map(function(media) {
                        return media.type.startsWith('image/') ?
                            `<img src="data:${media.type};base64,${media.data}" alt="Evidence">` :
                            `<video controls src="data:${media.type};base64,${media.data}"></video>`;
                    }).join('')}
                </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

/**
 * Previews selected media files before upload
 * @param {Event} e - The file input change event
 */
function previewMedia(e) {
    mediaPreview.innerHTML = '';
    Array.from(e.target.files).forEach(function(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                mediaPreview.innerHTML += `<img src="${e.target.result}" alt="Preview" width="100">`;
            } else if (file.type.startsWith('video/')) {
                mediaPreview.innerHTML += `<video controls width="100" src="${e.target.result}"></video>`;
            }
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Exports reports to a JSON file
 */
function exportReports() {
    const reports = JSON.parse(localStorage.getItem('governanceReports')) || [];
    if (reports.length === 0) {
        alert('No reports to export!');
        return;
    }

    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'governance-reports-' + new Date().toISOString() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Imports reports from a JSON file
 * @param {Event} e - The file input change event
 */
function importReports(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const reports = JSON.parse(e.target.result);
            if (!Array.isArray(reports)) throw new Error('Invalid format');

            const existingReports = JSON.parse(localStorage.getItem('governanceReports')) || [];
            const updatedReports = existingReports.concat(reports);
            localStorage.setItem('governanceReports', JSON.stringify(updatedReports));
            loadReports();
            alert('Successfully imported ' + reports.length + ' reports!');
        } catch (error) {
            alert('Error importing reports: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

/**
 * Applies report filters based on user input
 */
function applyReportFilters() {
    loadReports();
}

/**
 * Clears all report filters
 */
function clearReportFilters() {
    filterOfficial.value = '';
    filterCounty.value = '';
    searchInput.value = '';
    loadReports();
}

/**
 * Searches reports based on input text
 */
function searchReports() {
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm.length > 2 || searchTerm.length === 0) {
        loadReports();
    }
}

/**
 * Sets up the report slideshow functionality
 */
function setupSlideshow() {
    let currentIndex = 0;
    const reports = JSON.parse(localStorage.getItem('governanceReports')) || [];
    let interval;

    /**
     * Shows a specific report in the slideshow
     * @param {number} index - The index of the report to show
     */
    function showReport(index) {
        const cards = document.querySelectorAll('.report-card');
        cards.forEach(function(card) {
            card.classList.remove('active');
        });
        if (cards[index]) {
            cards[index].classList.add('active');
        }
        updateCounter();
    }
    
    /**
     * Starts the automatic slideshow
     */
    function startSlideshow() {
        if (reports.length > 1) {
            clearInterval(interval);
            interval = setInterval(function() {
                currentIndex = (currentIndex + 1) % reports.length;
                showReport(currentIndex);
            }, 5000); // Change every 5 seconds
        }
    }
    
    // Add navigation controls to the DOM
    const navHTML = `
        <div class="slideshow-nav">
            <button id="prevReport">Previous</button>
            <button id="nextReport">Next</button>
            <span id="slideCounter"></span>
        </div>
    `;
    reportsList.insertAdjacentHTML('afterend', navHTML);
    
    // Set up event listeners for navigation
    document.getElementById('prevReport').addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + reports.length) % reports.length;
        showReport(currentIndex);
        startSlideshow(); // Reset timer
    });
    
    document.getElementById('nextReport').addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % reports.length;
        showReport(currentIndex);
        startSlideshow(); // Reset timer
    });
    
    /**
     * Updates the slideshow counter display
     */
    function updateCounter() {
        const counter = document.getElementById('slideCounter');
        if (counter) {
            counter.textContent = (currentIndex + 1) + ' / ' + reports.length;
        }
    }
    
    // Initialize the slideshow
    startSlideshow();
    updateCounter();
}

/**
 * Simulates saving reports to a db.json file
 * In a real application, this would be an API call to a backend server
 * @param {Array} reports - Array of reports to save
 */
function saveToDB(reports) {
    // In a real app, this would be a fetch request to your backend
    // For now, we'll simulate it by storing in localStorage
    localStorage.setItem('governanceReportsDB', JSON.stringify(reports));
    
    // Example of what the real implementation might look like:
    /*
    fetch('http://localhost:3000/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reports)
    })
    .then(function(response) {
        return response.json();
    })
    .catch(function(error) {
        console.error('Error saving to DB:', error);
    });
    */
}