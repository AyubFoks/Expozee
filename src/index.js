//DOMContent Loaded Event
document.addEventListener('DOMContentLoaded', function() {

    // global variables
    let currentHeroSlide = 0;
    let reports = [];
    let currentSlide = 0;
    const API_BASE_URL = 'http://localhost:3001';

    // DOM elements
    const heroSlides = document.querySelectorAll('.hero-content');
    const anonymousToggle = document.getElementById('anonymous-toggle');
    const userDetailsGroups = document.querySelectorAll('.user-details');
    const jurisdictionSelect = document.getElementById('jurisdiction');
    const countyFilter = document.getElementById('county-filter');
    const reportForm = document.getElementById('report-form');

    //hero section carousel
    function initHeroCarousel() {
        function showHeroSlide(index) {
            heroSlides.forEach(function(slide, i) {
                slide.classList.toggle('active', i === index);
            });
        }

        function nextHeroSlide() {
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            showHeroSlide(currentHeroSlide);
        }

        showHeroSlide(0);
        const heroInterval = setInterval(nextHeroSlide, 5000);
    }

    //visibility of user details based on anonymity selection
    function toggleUserDetails() {
        const isAnonymous = anonymousToggle.checked;
        userDetailsGroups.forEach(function(group) {
            group.style.display = isAnonymous ? 'none' : 'block';
        });
    }

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} html - Input HTML to sanitize
     * @return {string} Sanitized HTML
     */
    function sanitizeHTML(html) {
        const allowedTags = ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'];
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const nodes = temp.querySelectorAll('*');
        nodes.forEach(function(node) {
            if (!allowedTags.includes(node.tagName.toLowerCase())) {
                const textNode = document.createTextNode(node.textContent);
                node.parentNode.replaceChild(textNode, node);
            }
        });
        
        return temp.innerHTML;
    }

    /**
     * Initialize Quill rich text editor
     */
    function initQuillEditor() {
        const quill = new Quill('#description-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link']
                ]
            },
            placeholder: 'Describe the issue in detail...'
        });
        return quill;
    }

    /**
     * Load counties data from JSON file
     */
    function loadCounties() {
        fetch('./counties.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load counties');
                }
                return response.json();
            })
            .then(function(counties) {
                populateCountyDropdowns(counties);
            })
            .catch(function(error) {
                console.error('Error loading counties:', error);
                showError('Failed to load counties data. Please refresh the page.');
            });
    }

    /**
     * Populate county dropdowns in form and filters
     * @param {Array} counties - Array of county names
     */
    function populateCountyDropdowns(counties) {
        jurisdictionSelect.innerHTML = '<option value="">Select county</option>';
        countyFilter.innerHTML = '<option value="">Filter by County</option>';

        counties.forEach(function(county) {
            const option1 = document.createElement('option');
            option1.value = county;
            option1.textContent = county;
            jurisdictionSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = county;
            option2.textContent = county;
            countyFilter.appendChild(option2);
        });
    }

    /**
     * Load reports data from server
     */
    function loadReports() {
        fetch(`${API_BASE_URL}/reports`)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load reports');
                }
                return response.json();
            })
            .then(function(data) {
                reports = data;
                updateSlideshow();
                updateReportList();
                populateResponsibleFilter();
            })
            .catch(function(error) {
                console.error('Error fetching reports:', error);
                showError('Failed to load reports. Please try again later.');
            });
    }

    /**
     * Update slideshow with current report data
     */
    function updateSlideshow() {
        if (reports.length === 0) {
            showEmptyState();
            return;
        }
        
        const slide = document.querySelector('.slide.active');
        const report = reports[currentSlide];
        
        slide.querySelector('.slide-title').textContent = report.title;
        
        const descriptionElement = slide.querySelector('.slide-description');
        descriptionElement.innerHTML = sanitizeHTML(report.description);
        
        slide.querySelector('.slide-jurisdiction').textContent = report.jurisdiction;
        slide.querySelector('.slide-date').textContent = new Date(report.date).toLocaleDateString();
        slide.querySelector('.slide-responsible').textContent = report.responsibleName + ' (' + report.responsiblePosition + ')';
        slide.querySelector('.slide-reporter').textContent = report.reporterName || 'Anonymous';
    }

    /**
     * Show empty state when no reports are available
     */
    function showEmptyState() {
        const slide = document.querySelector('.slide.active');
        slide.querySelector('.slide-title').textContent = 'No reports available';
        slide.querySelector('.slide-description').textContent = 'There are currently no reports to display.';
    }

    /**
     * Update the report list display
     * @param {Array} filteredReports - Optional filtered reports to display
     */
    function updateReportList(filteredReports) {
        const reportList = document.querySelector('.report-list');
        reportList.innerHTML = '';
        
        const reportsToShow = filteredReports || reports;
        
        if (reportsToShow.length === 0) {
            reportList.innerHTML = '<li>No reports match your filters</li>';
            return;
        }
        
        reportsToShow.forEach(function(report) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = report.title;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                const originalIndex = reports.findIndex(function(r) {
                    return r.id === report.id;
                });
                if (originalIndex !== -1) {
                    currentSlide = originalIndex;
                    updateSlideshow();
                }
            });
            li.appendChild(a);
            reportList.appendChild(li);
        });
    }

    /**
     * Populate responsible person filter dropdown
     */
    function populateResponsibleFilter() {
        const responsibleFilter = document.getElementById('responsible-filter');
        responsibleFilter.innerHTML = '<option value="">Filter by Responsible Person</option>';
        
        const uniqueResponsiblePersons = [];
        
        reports.forEach(function(report) {
            if (report.responsibleName && !uniqueResponsiblePersons.includes(report.responsibleName)) {
                uniqueResponsiblePersons.push(report.responsibleName);
            }
        });
        
        uniqueResponsiblePersons.forEach(function(person) {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            responsibleFilter.appendChild(option);
        });
    }

    /**
     * Apply all active filters to reports
     */
    function applyFilters() {
        const dateFilter = document.getElementById('date-filter').value;
        const countyFilterValue = document.getElementById('county-filter').value;
        const responsibleFilterValue = document.getElementById('responsible-filter').value;
        
        let filteredReports = reports.filter(function(report) {
            let matches = true;
            
            if (countyFilterValue && report.jurisdiction !== countyFilterValue) {
                matches = false;
            }
            
            if (responsibleFilterValue && report.responsibleName !== responsibleFilterValue) {
                matches = false;
            }
            
            return matches;
        });
        
        if (dateFilter === 'newest') {
            filteredReports.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
        } else if (dateFilter === 'oldest') {
            filteredReports.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
            });
        }
        
        updateReportList(filteredReports);
    }

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const isAnonymous = document.getElementById('anonymous-toggle').checked;
        const userName = isAnonymous ? 'Anonymous' : document.getElementById('user-name').value || 'Anonymous';
        const userEmail = isAnonymous ? '' : document.getElementById('user-email').value || '';
        const quill = document.querySelector('#description-editor').__quill;
        
        const newReport = {
            type: document.getElementById('issue-type').value,
            title: document.getElementById('title').value,
            responsibleName: document.getElementById('responsible-name').value,
            responsiblePosition: document.getElementById('responsible-position').value,
            jurisdiction: document.getElementById('jurisdiction').value,
            description: quill.root.innerHTML,
            date: new Date().toISOString(),
            reporterName: userName,
            reporterEmail: userEmail
        };

        fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReport)
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to save report');
            }
            return response.json();
        })
        .then(function(data) {
            reports.unshift(data);
            currentSlide = 0;
            updateSlideshow();
            updateReportList();
            reportForm.reset();
            quill.root.innerHTML = '';
            document.getElementById('anonymous-toggle').checked = false;
            toggleUserDetails();
            showSuccess('Report saved successfully!');
        })
        .catch(function(error) {
            console.error('Error submitting report:', error);
            showError('Failed to save report. Please try again.');
        });
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    function showSuccess(message) {
        alert(message); // Replace with a proper notification system
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        alert(message); // Replace with a proper notification system
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Slideshow navigation
        document.querySelector('.slide-nav .prev').addEventListener('click', function() {
            currentSlide = (currentSlide - 1 + reports.length) % reports.length;
            updateSlideshow();
        });
        
        document.querySelector('.slide-nav .next').addEventListener('click', function() {
            currentSlide = (currentSlide + 1) % reports.length;
            updateSlideshow();
        });

        // Filters
        document.getElementById('date-filter').addEventListener('change', applyFilters);
        document.getElementById('county-filter').addEventListener('change', applyFilters);
        document.getElementById('responsible-filter').addEventListener('change', applyFilters);

        // Form submission
        reportForm.addEventListener('submit', handleFormSubmit);

        // Anonymous toggle
        anonymousToggle.addEventListener('change', toggleUserDetails);
    }

    // Initialize the application
    initHeroCarousel();
    const quill = initQuillEditor();
    setupEventListeners();
    loadCounties();
    loadReports();
    toggleUserDetails(); // Initialize user details visibility
});