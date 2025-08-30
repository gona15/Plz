// Enhanced JavaScript for ArmanLeads.com
// Modern, accessible, high-performance implementation

(function() {
    'use strict';

    // Performance optimizations
    const supportsPassive = (() => {
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get() { supportsPassive = true; }
            });
            window.addEventListener('testPassive', null, opts);
            window.removeEventListener('testPassive', null, opts);
        } catch (e) {}
        return supportsPassive;
    })();

    const passiveIfSupported = supportsPassive ? { passive: true } : false;
    const passiveWithPreventDefault = supportsPassive ? { passive: false } : false;

    // Enhanced utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Intersection Observer utility with fallback
    function createIntersectionObserver(callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers - trigger immediately
            return {
                observe: (element) => {
                    setTimeout(() => callback([{ target: element, isIntersecting: true }]), 100);
                },
                unobserve: () => {},
                disconnect: () => {}
            };
        }

        return new IntersectionObserver(callback, { ...defaultOptions, ...options });
    }

    // Enhanced error handling
    function handleError(error, context) {
        console.error(`ArmanLeads Error [${context}]:`, error);
        
        // Optional: Send to analytics in production
        if (window.gtag && typeof window.gtag === 'function') {
            try {
                window.gtag('event', 'exception', {
                    description: `${context}: ${error.message}`,
                    fatal: false
                });
            } catch (e) {
                console.warn('Analytics error:', e);
            }
        }
    }

    // 1. Enhanced Preloader with better UX
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        let isLoaded = false;

        function hidePreloader() {
            if (isLoaded) return;
            isLoaded = true;
            
            preloader.classList.add('fade-out');
            setTimeout(() => {
                if (preloader && preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
                // Trigger any animations that should start after page load
                document.body.classList.add('loaded');
            }, 350);
        }

        // Hide on load or after max timeout
        if (document.readyState === 'complete') {
            setTimeout(hidePreloader, 500);
        } else {
            window.addEventListener('load', hidePreloader);
        }
        
        // Safety timeout - don't show preloader forever
        setTimeout(() => {
            if (!isLoaded) {
                console.warn('Preloader timeout - hiding after 3 seconds');
                hidePreloader();
            }
        }, 3000);

        return hidePreloader;
    }

    // 2. Enhanced sticky navbar with scroll direction detection
    function initStickyNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let lastScrollY = window.scrollY;

        const handleScroll = throttle(() => {
            const currentScrollY = window.scrollY;
            
            // Add scrolled class
            if (currentScrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        }, 16);

        window.addEventListener('scroll', handleScroll, passiveIfSupported);
        
        // Initial check
        handleScroll();
        
        return () => window.removeEventListener('scroll', handleScroll);
    }

    // 3. Enhanced mobile navigation with better accessibility
    function initMobileNav() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (!navToggle || !navMenu) return;

        let isOpen = false;

        function closeMenu() {
            isOpen = false;
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
            document.body.classList.remove('modal-open');
        }

        function openMenu() {
            isOpen = true;
            navToggle.setAttribute('aria-expanded', 'true');
            navMenu.classList.add('active');
            document.body.classList.add('modal-open');
        }

        // Toggle functionality
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen ? closeMenu() : openMenu();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
            }
        });

        // Close on nav link click (mobile only)
        const navLinks = navMenu.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 767) {
                    setTimeout(closeMenu, 150);
                }
            });
        });

        // Close menu on resize if mobile menu is open
        const handleResize = debounce(() => {
            if (isOpen && window.innerWidth > 767) {
                closeMenu();
            }
        }, 250);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }

    // 4. Enhanced smooth navigation with better performance
    function initSmoothNavigation() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        const navbar = document.getElementById('navbar');
        let navbarHeight = 80; // Default fallback

        // Get actual navbar height
        if (navbar) {
            navbarHeight = navbar.offsetHeight || 80;
        }

        // Handle navigation clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#top') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                
                const targetPosition = target.offsetTop - navbarHeight - 20;
                
                // Use native smooth scrolling if supported
                if ('scrollBehavior' in document.documentElement.style) {
                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback for older browsers
                    window.scrollTo(0, Math.max(0, targetPosition));
                }
            });
        });

        // Enhanced active section highlighting
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: `-${navbarHeight + 50}px 0px -50% 0px`,
            threshold: [0, 0.25]
        };

        const observer = createIntersectionObserver((entries) => {
            let maxRatio = 0;
            let activeSection = null;
            
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    activeSection = entry.target;
                }
            });
            
            if (activeSection) {
                const id = activeSection.getAttribute('id');
                
                // Remove active from all nav links
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active to current
                const activeNavLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeNavLink) {
                    activeNavLink.classList.add('active');
                }
            }
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });

        return () => observer.disconnect();
    }

    // 5. Enhanced business type selector with proper state management
    function initBusinessTypeSelector() {
        const businessTypeCards = document.querySelectorAll('.business-type-card');
        const businessTypeInput = document.getElementById('business-type');
        
        if (!businessTypeInput || businessTypeCards.length === 0) return;

        function selectBusinessType(selectedCard) {
            if (!selectedCard) return;

            // Remove active from all cards
            businessTypeCards.forEach(card => {
                card.classList.remove('active');
                card.setAttribute('aria-pressed', 'false');
            });
            
            // Add active to selected card
            selectedCard.classList.add('active');
            selectedCard.setAttribute('aria-pressed', 'true');
            
            // Update hidden input value
            const businessType = selectedCard.getAttribute('data-type');
            if (businessType && businessTypeInput) {
                businessTypeInput.value = businessType;
            }
        }

        // Initialize first card as selected if none are active
        const activeCard = document.querySelector('.business-type-card.active');
        if (!activeCard && businessTypeCards[0]) {
            selectBusinessType(businessTypeCards[0]);
        }

        businessTypeCards.forEach((card, index) => {
            // Add ARIA attributes
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            if (!card.getAttribute('aria-pressed')) {
                card.setAttribute('aria-pressed', 'false');
            }
            
            // Handle clicks
            card.addEventListener('click', () => selectBusinessType(card));
            
            // Handle keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectBusinessType(card);
                }
                
                // Arrow key navigation
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIndex = e.key === 'ArrowRight' 
                        ? (index + 1) % businessTypeCards.length
                        : (index - 1 + businessTypeCards.length) % businessTypeCards.length;
                    
                    if (businessTypeCards[nextIndex]) {
                        businessTypeCards[nextIndex].focus();
                    }
                }
            });
        });
    }

    // 6. Enhanced contact form with better validation and UX
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const submitButton = form.querySelector('.btn-submit');
        const successMessage = document.getElementById('form-success');
        
        // Basic form validation
        function validateField(field) {
            if (!field) return true;
            
            const value = field.value ? field.value.trim() : '';
            let isValid = true;
            
            // Check required fields
            if (field.hasAttribute('required') && !value) {
                isValid = false;
            }
            
            // Check email format
            if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                isValid = false;
            }
            
            // Update field appearance
            if (field.style) {
                field.style.borderColor = isValid ? '' : '#ef4444';
            }
            
            return isValid;
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Basic validation
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                return;
            }

            // Check honeypot
            const honeypot = form.querySelector('input[name="website_url"]');
            if (honeypot && honeypot.value) {
                return; // Silent fail for bots
            }

            // Update button state
            const originalButtonText = submitButton ? submitButton.innerHTML : '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }

            try {
                const formData = new FormData(form);
                
                // Add timestamp
                formData.append('timestamp', new Date().toISOString());
                
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success handling
                    if (successMessage) {
                        successMessage.classList.add('show');
                        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    form.reset();
                    
                    // Reset business type selection
                    const businessTypeCards = document.querySelectorAll('.business-type-card');
                    businessTypeCards.forEach((card, index) => {
                        card.classList.remove('active');
                        card.setAttribute('aria-pressed', 'false');
                        if (index === 0) {
                            card.classList.add('active');
                            card.setAttribute('aria-pressed', 'true');
                        }
                    });
                    
                    const businessTypeInput = document.getElementById('business-type');
                    if (businessTypeInput) {
                        businessTypeInput.value = 'dental';
                    }
                    
                    // Hide success message after 10 seconds
                    setTimeout(() => {
                        if (successMessage) {
                            successMessage.classList.remove('show');
                        }
                    }, 10000);
                    
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                handleError(error, 'Form Submission');
                
                // Show user-friendly error message
                if (window.alert) {
                    alert('There was an error sending your message. Please try again or contact us directly at hello@armanleads.com');
                }
            } finally {
                // Reset button state
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            }
        });
    }

    // 7. Enhanced Calendly modal with better error handling
    function initCalendlyModal() {
        const trigger = document.getElementById('calendly-trigger');
        const modal = document.getElementById('calendly-modal');
        const iframe = document.getElementById('calendly-iframe');
        const closeButtons = modal ? modal.querySelectorAll('[data-close-modal]') : [];
        const loadingElement = modal ? modal.querySelector('.calendly-loading') : null;
        
        if (!trigger || !modal) return;

        let isModalOpen = false;
        let iframeSrcSet = false;

        function openModal() {
            isModalOpen = true;
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            modal.setAttribute('aria-hidden', 'false');

            // Load iframe if not already loaded
            if (!iframeSrcSet && iframe) {
                iframe.src = 'https://calendly.com/vrmvn0/meeting';
                iframeSrcSet = true;

                // Handle iframe load
                iframe.addEventListener('load', () => {
                    if (loadingElement) {
                        loadingElement.style.display = 'none';
                    }
                });

                // Handle iframe error
                iframe.addEventListener('error', () => {
                    if (loadingElement) {
                        loadingElement.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <p>Unable to load calendar. Please contact us directly.</p>
                                <a href="mailto:hello@armanleads.com" style="color: var(--color-accent-dark);">hello@armanleads.com</a>
                            </div>
                        `;
                    }
                });

                // Timeout for loading
                setTimeout(() => {
                    if (loadingElement && loadingElement.style.display !== 'none') {
                        loadingElement.innerHTML = `
                            <div style="text-align: center;">
                                <p>Taking longer than expected...</p>
                                <p><a href="mailto:hello@armanleads.com" style="color: var(--color-accent-dark);">Contact us directly</a></p>
                            </div>
                        `;
                    }
                }, 10000);
            }
        }

        function closeModal() {
            isModalOpen = false;
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            modal.setAttribute('aria-hidden', 'true');
        }

        // Event listeners
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        });

        // Initialize modal state
        modal.setAttribute('aria-hidden', 'true');

        return () => {
            // Cleanup if needed
        };
    }

    // 8. Scroll animations with better performance
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.card, .service-card, .approach-card, .portfolio-card, .pricing-card, .faq-item');
        if (animatedElements.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = createIntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    // Unobserve to prevent re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Set initial state
        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });

        return () => observer.disconnect();
    }

    // 9. Error handling and recovery
    function initErrorHandling() {
        window.addEventListener('error', (e) => {
            handleError(e.error || e, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            handleError(e.reason || e, 'Unhandled Promise Rejection');
            e.preventDefault(); // Prevent console error
        });
    }

    // Initialize everything when DOM is ready
    function init() {
        try {
            // Initialize core functionality in order
            const cleanupFunctions = [];
            
            initErrorHandling();
            
            const preloaderCleanup = initPreloader();
            if (preloaderCleanup) cleanupFunctions.push(preloaderCleanup);
            
            const navbarCleanup = initStickyNavbar();
            if (navbarCleanup) cleanupFunctions.push(navbarCleanup);
            
            const mobileNavCleanup = initMobileNav();
            if (mobileNavCleanup) cleanupFunctions.push(mobileNavCleanup);
            
            const smoothNavCleanup = initSmoothNavigation();
            if (smoothNavCleanup) cleanupFunctions.push(smoothNavCleanup);
            
            initBusinessTypeSelector();
            initContactForm();
            
            const calendlyCleanup = initCalendlyModal();
            if (calendlyCleanup) cleanupFunctions.push(calendlyCleanup);
            
            const animationCleanup = initScrollAnimations();
            if (animationCleanup) cleanupFunctions.push(animationCleanup);

            // Mark as initialized
            document.body.setAttribute('data-js-initialized', 'true');
            
            console.log('ArmanLeads: All scripts initialized successfully');
            
            // Store cleanup functions for potential later use
            window.ArmanLeadsCleanup = cleanupFunctions;
            
        } catch (error) {
            handleError(error, 'Initialization');
        }
    }

    // Run initialization with proper timing
    function startInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            // DOM is already ready
            init();
        }
    }

    // Start initialization
    startInit();

    // Expose utilities for debugging
    window.ArmanLeads = {
        version: '2.1.0',
        init: init,
        utils: {
            debounce,
            throttle,
            handleError
        }
    };

})();
