// Loading state handling with performance optimization
let pageLoaded = false;
let minimumLoadTime = 1000; // 1 second in milliseconds
let startTime = Date.now();

// Enhanced image cache with memory management
const imageCache = new Map();
const MAX_CACHE_SIZE = 50; // Maximum number of images to keep in cache
const SCROLL_THROTTLE = 8; // ~120fps for high refresh rate screens
let lastScrollTime = 0;
let scrollTimeout = null;
let isHighRefreshRate = window.matchMedia('(min-resolution: 120dpi)').matches || 
                       window.matchMedia('(min-resolution: 2dppx)').matches;

// Adjust throttle based on screen refresh rate
const getScrollThrottle = () => {
  if (isHighRefreshRate) {
    return 8; // ~120fps
  }
  return 16; // ~60fps
};

// Function to manage cache size
function manageCacheSize() {
  if (imageCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(imageCache.keys()).slice(0, imageCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => {
      const img = imageCache.get(key);
      if (img) {
        img.src = ''; // Clear image source
        img.remove(); // Remove from DOM if present
      }
      imageCache.delete(key);
    });
  }
}

// Function to handle initial page load
function handleInitialLoad() {
  if (pageLoaded) return; // Prevent multiple executions
  
  pageLoaded = true;
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);

  // Use requestAnimationFrame for smoother animations
  requestAnimationFrame(() => {
    setTimeout(() => {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }
    }, remainingTime);
  });
}

// Listen for the load event only once
window.addEventListener('load', handleInitialLoad, { once: true });

// Function to create loading animation container
function createLoadingAnimation(container) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'image-loading-animation';
  
  const loaderImg = document.createElement('img');
  loaderImg.src = 'image/Image loader.gif';
  loaderImg.alt = 'Loading...';
  loaderImg.className = 'loader-gif';
  loaderImg.style.display = 'block';
  
  loadingDiv.appendChild(loaderImg);
  container.appendChild(loadingDiv);
  
  return loadingDiv;
}

// Throttled scroll handler optimized for high refresh rate
function handleScroll() {
  const now = Date.now();
  const throttle = getScrollThrottle();
  
  if (now - lastScrollTime >= throttle) {
    lastScrollTime = now;
    requestAnimationFrame(() => {
      // Update header visibility with hardware acceleration
      const header = document.querySelector('header');
      const mainNav = document.querySelector('.main-nav');
      if (header && mainNav) {
        header.style.transform = 'translate3d(0, 0, 0)';
        mainNav.style.transform = 'translate3d(0, 0, 0)';
      }
    });
  }
}

// Optimize scroll event listener with passive flag
window.addEventListener('scroll', handleScroll, { passive: true });

// Enhanced preload and cache function with retry logic
function preloadAndCacheImage(src, retries = 3) {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set crossOrigin if needed
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      // Store the optimized image
      imageCache.set(src, img);
      manageCacheSize();
      resolve(img);
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      if (retries > 0) {
        setTimeout(() => {
          preloadAndCacheImage(src, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(new Error(`Failed to load image after multiple retries: ${src}`));
      }
    };
    
    img.src = src;
  });
}

// Function to handle lazy loading with improved performance
function handleLazyLoad() {
  const images = document.querySelectorAll('img[loading="lazy"]:not(.loaded)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (!img.classList.contains('loading') && !img.classList.contains('loaded') && img.dataset.src) {
          img.classList.add('loading');

          const loadingAnimation = img.parentElement.querySelector('.image-loading-animation');

          // Use cached image if available
          if (imageCache.has(img.dataset.src)) {
            const cachedImg = imageCache.get(img.dataset.src);
            img.src = cachedImg.src;
            img.classList.add('loaded');
            img.classList.remove('loading');
            
            if (loadingAnimation) {
              loadingAnimation.style.opacity = '0';
              setTimeout(() => loadingAnimation.remove(), isHighRefreshRate ? 150 : 300);
            }
          } else {
            // Load new image
            preloadAndCacheImage(img.dataset.src)
              .then(cachedImg => {
                img.src = cachedImg.src;
                img.classList.add('loaded');
                img.classList.remove('loading');
                
                if (loadingAnimation) {
                  loadingAnimation.style.opacity = '0';
                  setTimeout(() => loadingAnimation.remove(), isHighRefreshRate ? 150 : 300);
                }
              })
              .catch(() => {
                img.src = 'image/placeholder.jpg';
                img.alt = 'Image not available';
                img.classList.remove('loading');
                
                if (loadingAnimation) {
                  loadingAnimation.remove();
                }
              });
          }
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px 0px',
    threshold: 0.1
  });

  images.forEach(img => observer.observe(img));
}

// Function to check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Function to preload visible images
function preloadVisibleImages() {
  const images = document.querySelectorAll('.gallery-image');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          // Preload and cache, handle potential errors
          preloadAndCacheImage(img.dataset.src)
            .catch(error => {
              console.error('Error preloading visible image:', error);
              // Optionally, set a placeholder or show an error state for this specific image
            });
        }
      }
    });
  }, {
    rootMargin: '300px 0px',
    threshold: 0.1
  });

  images.forEach(img => observer.observe(img));
}

// Enhanced gallery rendering with performance optimization
async function renderGallery(selectedCategory = 'All') {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  // Show loading state
  gallery.innerHTML = '<div class="gallery-loading">Loading...</div>';
  
  try {
    let itemsToShow;
    if (selectedCategory === 'All') {
      itemsToShow = portfolioItems.filter(item =>
        ['Maternity Shoot', 'New Born', 'Baby Shoots', 'Festival', 'Special Shoot'].includes(item.category)
      );
    } else {
      itemsToShow = portfolioItems.filter(item => item.category === selectedCategory);
      // Shuffle the items for non-All sections
      itemsToShow = itemsToShow.sort(() => Math.random() - 0.5);
    }

    // Shuffle array for 'All' category
    if (selectedCategory === 'All') {
      itemsToShow = itemsToShow.sort(() => Math.random() - 0.5);
    }

    // Clear gallery
    gallery.innerHTML = '';

    // For 'All' category, initially show 30 images
    const initialLoadCount = selectedCategory === 'All' ? 30 : itemsToShow.length;
    const initialItems = itemsToShow.slice(0, initialLoadCount);

    // Create initial gallery items with performance optimization
    const fragment = document.createDocumentFragment();
    
    // Preload first batch of images
    const preloadPromises = initialItems.map(item => 
      preloadAndCacheImage(item.thumbnail || item.image)
    );

    // Wait for initial batch to preload
    await Promise.allSettled(preloadPromises);
    
    initialItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      
      const loadingAnimation = createLoadingAnimation(div);
      
      const img = document.createElement('img');
      img.className = 'gallery-image';
      img.alt = item.label || '';
      img.loading = 'lazy';
      img.draggable = false;
      
      // Use data-src for lazy loading
      const imagePath = item.thumbnail || item.image;
      img.dataset.src = imagePath;
      
      div.appendChild(img);
      div.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (item.externalLink) {
          window.open(item.externalLink, '_blank', 'noopener');
        } else {
          openLightbox(item.image, item.category);
        }
      });
      
      fragment.appendChild(div);
    });

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      gallery.appendChild(fragment);
      handleLazyLoad();
    });

    // Store remaining items for "Show More" functionality
    if (selectedCategory === 'All') {
      window.remainingItems = itemsToShow.slice(initialLoadCount);
    }

    // Update show more button visibility and text
    const showMoreBtn = document.getElementById('show-more-btn');
    if (showMoreBtn) {
      if (selectedCategory === 'All' && itemsToShow.length > initialLoadCount) {
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = isExpanded ? 'Show Less' : 'Show More';
      } else {
        showMoreBtn.style.display = 'none';
      }
    }

    // Update gallery display after rendering
    updateGalleryDisplay();
  } catch (error) {
    console.error('Error rendering gallery:', error);
    gallery.innerHTML = '<div class="gallery-error">Error loading gallery. Please try again later.</div>';
  }
}

// Function to load more images
async function loadMoreImages() {
  const gallery = document.getElementById('gallery');
  if (!gallery || !window.remainingItems || window.remainingItems.length === 0) return;

  // Load next batch of 12 images
  const nextBatch = window.remainingItems.splice(0, 12);
  
  const fragment = document.createDocumentFragment();
  
  nextBatch.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    
    const loadingAnimation = createLoadingAnimation(div);
    
    const img = document.createElement('img');
    img.className = 'gallery-image';
    img.alt = item.label || '';
    img.loading = 'lazy';
    img.draggable = false;
    img.dataset.src = item.thumbnail || item.image;
    
    div.appendChild(img);
    div.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (item.externalLink) {
        window.open(item.externalLink, '_blank', 'noopener');
      } else {
        openLightbox(item.image, item.category);
      }
    });
    
    fragment.appendChild(div);
  });

  gallery.appendChild(fragment);
  
  // Initialize lazy loading for new images
  handleLazyLoad();

  // Update show more button visibility
  const showMoreBtn = document.getElementById('show-more-btn');
  if (showMoreBtn) {
    if (window.remainingItems.length === 0) {
      showMoreBtn.style.display = 'none';
    }
  }
}

// Filter bar event
const filterBar = document.getElementById('gallery-filter');

filterBar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    // Remove active from all
    filterBar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    // Add active to clicked
    e.target.classList.add('active');
    // Reset expanded state
    isExpanded = false;
    // Clear remaining items
    window.remainingItems = null;
    // Render gallery
    renderGallery(e.target.dataset.category);
  }
});

// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.close');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const lightboxCounter = document.getElementById('lightbox-counter');

// Variables to track current image and available images
let currentImageIndex = 0;
let currentImages = [];

function openLightbox(imgSrc, category = null) {
  // Add state to browser history
  history.pushState({ lightbox: true, image: imgSrc }, '');
  
  // Set current images based on category or current gallery
  if (category) {
    currentImages = portfolioItems.filter(item => item.category === category);
  } else {
    // If no category specified, use current gallery items
    const currentCategory = document.querySelector('.category-btn.active')?.dataset.category || 'All';
    if (currentCategory === 'All') {
      currentImages = portfolioItems.filter(item =>
        ['Maternity Shoot', 'New Born', 'Baby Shoots'].includes(item.category)
      );
    } else {
      currentImages = portfolioItems.filter(item => item.category === currentCategory);
    }
  }
  
  // Find current image index
  currentImageIndex = currentImages.findIndex(item => item.image === imgSrc);
  if (currentImageIndex === -1) currentImageIndex = 0;
  
  // Update navigation buttons state
  updateNavigationButtons();
  
  lightbox.style.display = 'block';
  lightboxImg.src = imgSrc;
  lightboxCaption.textContent = ''; // Remove image name/caption
  lightboxImg.classList.remove('zoomed');
  document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
  
  // Update counter
  updateLightboxCounter();
  
  // Add active class for animation
  setTimeout(() => {
    lightbox.classList.add('active');
  }, 10);
}

function closeLightbox() {
  lightbox.classList.remove('active');
  setTimeout(() => {
    lightbox.style.display = 'none';
    lightboxImg.classList.remove('zoomed');
    document.body.style.overflow = ''; // Restore scrolling
  }, 300); // Match the CSS transition duration
}

// Function to navigate to previous image
function showPreviousImage() {
  if (currentImages.length === 0) return;
  
  // Add transition effect
  lightboxImg.classList.add('transitioning');
  
  setTimeout(() => {
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    const newImage = currentImages[currentImageIndex];
    
    lightboxImg.src = newImage.image;
    lightboxCaption.textContent = ''; // Remove image name/caption
    lightboxImg.classList.remove('zoomed');
    
    // Remove transition effect
    lightboxImg.classList.remove('transitioning');
    
    // Update history
    history.pushState({ lightbox: true, image: newImage.image }, '');
    
    // Update navigation buttons state and counter
    updateNavigationButtons();
    updateLightboxCounter();
  }, 200);
}

// Function to navigate to next image
function showNextImage() {
  if (currentImages.length === 0) return;
  
  // Add transition effect
  lightboxImg.classList.add('transitioning');
  
  setTimeout(() => {
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    const newImage = currentImages[currentImageIndex];
    
    lightboxImg.src = newImage.image;
    lightboxCaption.textContent = ''; // Remove image name/caption
    lightboxImg.classList.remove('zoomed');
    
    // Remove transition effect
    lightboxImg.classList.remove('transitioning');
    
    // Update history
    history.pushState({ lightbox: true, image: newImage.image }, '');
    
    // Update navigation buttons state and counter
    updateNavigationButtons();
    updateLightboxCounter();
  }, 200);
}

// Function to update navigation buttons state
function updateNavigationButtons() {
  if (currentImages.length <= 1) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }
}

// Function to update lightbox counter
function updateLightboxCounter() {
  if (currentImages.length <= 1) {
    lightboxCounter.style.display = 'none';
  } else {
    lightboxCounter.style.display = 'block';
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
  }
}

// Handle browser back button
window.addEventListener('popstate', (event) => {
  if (lightbox.style.display === 'block') {
    closeLightbox();
  }
});

// Add click event for zooming
// Enable zoom-on-click in lightbox
lightboxImg.addEventListener('click', function(e) {
  e.stopPropagation();
  this.classList.toggle('zoomed');
});

closeBtn.onclick = function(e) {
  e.stopPropagation(); // Prevent event from bubbling up
  history.back(); // Go back in history instead of just closing
}

window.onclick = function(event) {
  if (event.target == lightbox) {
    history.back(); // Go back in history instead of just closing
  }
}

// Add event listeners for navigation buttons
prevBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  showPreviousImage();
});

nextBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  showNextImage();
});

// Add touch/swipe support for mobile devices
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', function(e) {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', function(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next image
      showNextImage();
    } else {
      // Swipe right - previous image
      showPreviousImage();
    }
  }
}

// Add keyboard support for lightbox navigation
document.addEventListener('keydown', function(event) {
  // Block common save/print/inspect combos
  if (event.ctrlKey || event.metaKey) {
    const k = event.key.toLowerCase();
    if (k === 's' || k === 'p' || k === 'u') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }
  if (event.key === 'F12') {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (lightbox.style.display === 'block') {
    if (event.key === 'Escape') {
      history.back(); // Go back in history instead of just closing
    } else if (event.key === 'ArrowLeft') {
      showPreviousImage();
    } else if (event.key === 'ArrowRight') {
      showNextImage();
    }
  }
});

// Disable context menu on images and lightbox
document.addEventListener('contextmenu', function(e) {
  const target = e.target;
  if (target && (target.classList && (target.classList.contains('gallery-image') || target.id === 'lightbox-img'))) {
    e.preventDefault();
  }
});

// Improved smooth scrolling with performance optimization
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Use smooth scrolling with fallback
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback for browsers that don't support smooth scrolling
        window.scrollTo(0, offsetPosition);
      }

      // Close mobile menu if open
      if (navLinks.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  });
});

// Show More/Less functionality
const showMoreBtn = document.getElementById('show-more-btn');
let isExpanded = false;

function updateGalleryDisplay() {
  const items = document.querySelectorAll('.item');
  const selectedCategory = document.querySelector('.gallery-filter button.active').dataset.category;
  
  if (selectedCategory === 'All') {
    items.forEach((item, index) => {
      if (isExpanded || index < 30) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  } else {
    items.forEach(item => {
      item.style.display = 'block';
    });
  }

  // Update button text and visibility
  if (showMoreBtn) {
    if (selectedCategory === 'All' && items.length > 30) {
      showMoreBtn.style.display = 'block';
      showMoreBtn.textContent = isExpanded ? 'Show Less' : 'Show More';
    } else {
      showMoreBtn.style.display = 'none';
    }
  }
}

// Update show more button click handler
if (showMoreBtn) {
  showMoreBtn.addEventListener('click', () => {
    if (isExpanded) {
      // Show Less - Reset to initial state
      const selectedCategory = document.querySelector('.gallery-filter button.active').dataset.category;
      if (selectedCategory === 'All') {
        renderGallery('All');
      }
    } else {
      // Show More - Load next batch
      loadMoreImages();
    }
    isExpanded = !isExpanded;
    updateGalleryDisplay();
  });
}

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
});

// Portfolio items data
const portfolioItems = [
  {
    thumbnail: 'image/Maternity Shoot/ABP05999 Logo_1_11zon_1_11zon.webp',
    image: 'image/Maternity Shoot/ABP05999 Logo_1_11zon_1_11zon.webp',
    label: 'Maternity Shoot 1',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/ABP06330_2_11zon_2_11zon.webp',
    image: 'image/Maternity Shoot/ABP06330_2_11zon_2_11zon.webp',
    label: 'Maternity Shoot 2',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04614 Logo_3_11zon_3_11zon.webp',
    image: 'image/Maternity Shoot/DSC04614 Logo_3_11zon_3_11zon.webp',
    label: 'Maternity Shoot 3',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04721_4_11zon_4_11zon.webp',
    image: 'image/Maternity Shoot/DSC04721_4_11zon_4_11zon.webp',
    label: 'Maternity Shoot 4',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04737_5_11zon_5_11zon.webp',
    image: 'image/Maternity Shoot/DSC04737_5_11zon_5_11zon.webp',
    label: 'Maternity Shoot 5',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04821_6_11zon_6_11zon.webp',
    image: 'image/Maternity Shoot/DSC04821_6_11zon_6_11zon.webp',
    label: 'Maternity Shoot 6',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/SAVE_20240924_133845_7_11zon_7_11zon.webp',
    image: 'image/Maternity Shoot/SAVE_20240924_133845_7_11zon_7_11zon.webp',
    label: 'Maternity Shoot 7',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/SAVE_20250625_122739_2_11zon.jpg',
    image: 'image/Maternity Shoot/SAVE_20250625_122739_2_11zon.jpg',
    label: 'Maternity Shoot 8',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/SAVE_20250625_190119_1_11zon.jpg',
    image: 'image/Maternity Shoot/SAVE_20250625_190119_1_11zon.jpg',
    label: 'Maternity Shoot 9',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/SAVE_20250808_143718_1_11zon.jpg',
    image: 'image/Maternity Shoot/SAVE_20250808_143718_1_11zon.jpg',
    label: 'Maternity Shoot 10',
    category: 'Maternity Shoot'
  },
  // New Born images
  {
    thumbnail: 'image/New Born/SAVE_20240911_203022_compressed_1_11zon_1_11zon.webp',
    image: 'image/New Born/SAVE_20240911_203022_compressed_1_11zon_1_11zon.webp',
    label: 'New Born 1',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240911_203030_compressed_2_11zon_2_11zon.webp',
    image: 'image/New Born/SAVE_20240911_203030_compressed_2_11zon_2_11zon.webp',
    label: 'New Born 2',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240912_204409_compressed_3_11zon_3_11zon.webp',
    image: 'image/New Born/SAVE_20240912_204409_compressed_3_11zon_3_11zon.webp',
    label: 'New Born 3',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240912_204419_compressed_4_11zon_4_11zon.webp',
    image: 'image/New Born/SAVE_20240912_204419_compressed_4_11zon_4_11zon.webp',
    label: 'New Born 4',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240914_214641_compressed_5_11zon_5_11zon.webp',
    image: 'image/New Born/SAVE_20240914_214641_compressed_5_11zon_5_11zon.webp',
    label: 'New Born 5',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20241031_125823_compressed_6_11zon_6_11zon.webp',
    image: 'image/New Born/SAVE_20241031_125823_compressed_6_11zon_6_11zon.webp',
    label: 'New Born 6',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191053_compressed_7_11zon_7_11zon.webp',
    image: 'image/New Born/SAVE_20250130_191053_compressed_7_11zon_7_11zon.webp',
    label: 'New Born 7',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191118_compressed_8_11zon_8_11zon.webp',
    image: 'image/New Born/SAVE_20250130_191118_compressed_8_11zon_8_11zon.webp',
    label: 'New Born 8',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191123_compressed_9_11zon_9_11zon.webp',
    image: 'image/New Born/SAVE_20250130_191123_compressed_9_11zon_9_11zon.webp',
    label: 'New Born 9',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200014_compressed_10_11zon_10_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200014_compressed_10_11zon_10_11zon.webp',
    label: 'New Born 10',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200020_compressed_11_11zon_11_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200020_compressed_11_11zon_11_11zon.webp',
    label: 'New Born 11',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200027_compressed_12_11zon_12_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200027_compressed_12_11zon_12_11zon.webp',
    label: 'New Born 12',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200231_compressed_13_11zon_13_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200231_compressed_13_11zon_13_11zon.webp',
    label: 'New Born 13',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200241_compressed_14_11zon_14_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200241_compressed_14_11zon_14_11zon.webp',
    label: 'New Born 14',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200248_compressed_15_11zon_15_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200248_compressed_15_11zon_15_11zon.webp',
    label: 'New Born 15',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200257_compressed_16_11zon_16_11zon.webp',
    image: 'image/New Born/SAVE_20250504_200257_compressed_16_11zon_16_11zon.webp',
    label: 'New Born 16',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250509_101639_compressed_17_11zon_17_11zon.webp',
    image: 'image/New Born/SAVE_20250509_101639_compressed_17_11zon_17_11zon.webp',
    label: 'New Born 17',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/DSC09444_2_11zon.jpg',
    image: 'image/New Born/DSC09444_2_11zon.jpg',
    label: 'New Born 18',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/DSC09475 (1)_1_11zon.jpg',
    image: 'image/New Born/DSC09475 (1)_1_11zon.jpg',
    label: 'New Born 19',
    category: 'New Born'
  },
  // Baby Shoots images
  {
    thumbnail: 'image/Baby Shoots/DSC05880-min_1_11zon.webp',
    image: 'image/Baby Shoots/DSC05880-min_1_11zon.webp',
    label: 'Baby Shoot 1',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240819_222506-min_2_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20240819_222506-min_2_11zon.webp',
    label: 'Baby Shoot 2',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240925_154029-min_3_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20240925_154029-min_3_11zon.webp',
    label: 'Baby Shoot 3',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240925_154037-min_4_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20240925_154037-min_4_11zon.webp',
    label: 'Baby Shoot 4',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123509-min_5_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20241022_123509-min_5_11zon.webp',
    label: 'Baby Shoot 5',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123521-min_6_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20241022_123521-min_6_11zon.webp',
    label: 'Baby Shoot 6',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123537-min_7_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20241022_123537-min_7_11zon.webp',
    label: 'Baby Shoot 7',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241127_214936-min_8_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20241127_214936-min_8_11zon.webp',
    label: 'Baby Shoot 8',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250205_130119-min_9_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250205_130119-min_9_11zon.webp',
    label: 'Baby Shoot 9',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250206_081640-min_10_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250206_081640-min_10_11zon.webp',
    label: 'Baby Shoot 10',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250206_081648-min_11_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250206_081648-min_11_11zon.webp',
    label: 'Baby Shoot 11',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250306_104604-min_12_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250306_104604-min_12_11zon.webp',
    label: 'Baby Shoot 12',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250309_195742-min_13_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250309_195742-min_13_11zon.webp',
    label: 'Baby Shoot 13',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250309_195800-min_14_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250309_195800-min_14_11zon.webp',
    label: 'Baby Shoot 14',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_144028-min_15_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250328_144028-min_15_11zon.webp',
    label: 'Baby Shoot 15',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_152510-min_16_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250328_152510-min_16_11zon.webp',
    label: 'Baby Shoot 16',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_152522-min_17_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250328_152522-min_17_11zon.webp',
    label: 'Baby Shoot 17',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_244554-min_18_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250328_244554-min_18_11zon.webp',
    label: 'Baby Shoot 18',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_244604-min_19_11zon.webp',
    image: 'image/Baby Shoots/SAVE_20250328_244604-min_19_11zon.webp',
    label: 'Baby Shoot 19',
    category: 'Baby Shoots'
  },

  {
    thumbnail: 'image/Baby Shoots/DSC00022_11zon.webp',
    image: 'image/Baby Shoots/DSC00022_11zon.webp',
    label: 'Baby Shoot 21',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/DSC01611 copy_3_11zon.jpg',
    image: 'image/Baby Shoots/DSC01611 copy_3_11zon.jpg',
    label: 'Baby Shoot 22',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250705_113046_4_11zon.jpg',
    image: 'image/Baby Shoots/SAVE_20250705_113046_4_11zon.jpg',
    label: 'Baby Shoot 23',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/17.8.2.jpg',
    image: 'image/Baby Shoots/17.8.2.jpg',
    label: 'Baby Shoot 24',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/17.8.3.jpg',
    image: 'image/Baby Shoots/17.8.3.jpg',
    label: 'Baby Shoot 25',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/17.8.jpg',
    image: 'image/Baby Shoots/17.8.jpg',
    label: 'Baby Shoot 26',
    category: 'Baby Shoots'
  },
  // Festival images
  {
    thumbnail: 'image/festival/DSC04248_compressed_1_11zon_1_11zon.webp',
    image: 'image/festival/DSC04248_compressed_1_11zon_1_11zon.webp',
    label: 'Festival 1',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/DSC05086_compressed_2_11zon_2_11zon.webp',
    image: 'image/festival/DSC05086_compressed_2_11zon_2_11zon.webp',
    label: 'Festival 2',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1137672_compressed_3_11zon_3_11zon.webp',
    image: 'image/festival/P1137672_compressed_3_11zon_3_11zon.webp',
    label: 'Festival 3',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138193_compressed_4_11zon_4_11zon.webp',
    image: 'image/festival/P1138193_compressed_4_11zon_4_11zon.webp',
    label: 'Festival 4',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138369_compressed_5_11zon_5_11zon.webp',
    image: 'image/festival/P1138369_compressed_5_11zon_5_11zon.webp',
    label: 'Festival 5',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138409_compressed_6_11zon_6_11zon.webp',
    image: 'image/festival/P1138409_compressed_6_11zon_6_11zon.webp',
    label: 'Festival 6',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138934_compressed_7_11zon_7_11zon.webp',
    image: 'image/festival/P1138934_compressed_7_11zon_7_11zon.webp',
    label: 'Festival 7',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138962_compressed_8_11zon_8_11zon.webp',
    image: 'image/festival/P1138962_compressed_8_11zon_8_11zon.webp',
    label: 'Festival 8',
    category: 'Festival'
  },

  {
    thumbnail: 'image/festival/P1139037_compressed_10_11zon_10_11zon.webp',
    image: 'image/festival/P1139037_compressed_10_11zon_10_11zon.webp',
    label: 'Festival 10',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232634-min_compressed_11_11zon_11_11zon.webp',
    image: 'image/festival/SAVE_20240825_232634-min_compressed_11_11zon_11_11zon.webp',
    label: 'Festival 11',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232801_compressed_12_11zon_12_11zon.webp',
    image: 'image/festival/SAVE_20240825_232801_compressed_12_11zon_12_11zon.webp',
    label: 'Festival 12',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232815_compressed_13_11zon_13_11zon.webp',
    image: 'image/festival/SAVE_20240825_232815_compressed_13_11zon_13_11zon.webp',
    label: 'Festival 13',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20250225_155609_compressed_14_11zon_14_11zon.webp',
    image: 'image/festival/SAVE_20250225_155609_compressed_14_11zon_14_11zon.webp',
    label: 'Festival 14',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20250226_190800_compressed_15_11zon_15_11zon.webp',
    image: 'image/festival/SAVE_20250226_190800_compressed_15_11zon_15_11zon.webp',
    label: 'Festival 15',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/1.17.8.jpg',
    image: 'image/festival/1.17.8.jpg',
    label: 'Festival 16',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/2.17.8.jpg',
    image: 'image/festival/2.17.8.jpg',
    label: 'Festival 17',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/3.17.8.jpg',
    image: 'image/festival/3.17.8.jpg',
    label: 'Festival 18',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/4.17.8.jpg',
    image: 'image/festival/4.17.8.jpg',
    label: 'Festival 19',
    category: 'Festival'
  },
  // Special Shoot images
  {
    thumbnail: 'image/Special%20shoot/DSC02932_3_11zon.jpg',
    image: 'image/Special%20shoot/DSC02932_3_11zon.jpg',
    label: 'Special Shoot 1',
    category: 'Special Shoot'
  },
  {
    thumbnail: 'image/Special%20shoot/SAVE_20250711_212828_4_11zon.jpg',
    image: 'image/Special%20shoot/SAVE_20250711_212828_4_11zon.jpg',
    label: 'Special Shoot 2',
    category: 'Special Shoot'
  },
  {
    thumbnail: 'image/Special%20shoot/SAVE_20250711_212849_2_11zon.jpg',
    image: 'image/Special%20shoot/SAVE_20250711_212849_2_11zon.jpg',
    label: 'Special Shoot 3',
    category: 'Special Shoot'
  },
  {
    thumbnail: 'image/Special%20shoot/SAVE_20250711_212949_1_11zon.jpg',
    image: 'image/Special%20shoot/SAVE_20250711_212949_1_11zon.jpg',
    label: 'Special Shoot 4',
    category: 'Special Shoot'
  }
];

const categories = ['All', 'Maternity Shoot', 'New Born', 'Baby Shoots', 'Festival', 'Special Shoot'];

// --- Flickr integration (public feed via JSONP, no API key required) ---
// Adds N images from a Flickr user to a given gallery category
function loadFlickrImages(userId, count, category) {
  if (!userId || !count || !category) return;

  // Guard to avoid multiple insertions
  if (window.__flickrLoaded) return;
  window.__flickrLoaded = true;

  // Define the JSONP callback expected by Flickr public feed
  window.jsonFlickrFeed = function(data) {
    try {
      if (!data || !Array.isArray(data.items)) return;
      const items = data.items.slice(0, count);

      items.forEach((it, idx) => {
        // media.m looks like ..._m.jpg; build a larger version by replacing _m with _b for lightbox
        const mediaM = it.media && it.media.m ? it.media.m : null;
        if (!mediaM) return;
        const large = mediaM.replace('_m.', '_b.');

        portfolioItems.push({
          thumbnail: mediaM,
          image: large,
          label: (it.title || 'Flickr Photo') + ` #${idx + 1}`,
          category: category
        });
      });

      // Re-render if the user is viewing this category; otherwise keep current selection
      const activeCategoryBtn = document.querySelector('.gallery-filter button.active');
      const activeCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'All';
      if (activeCategory === 'All' || activeCategory === category) {
        renderGallery(activeCategory);
      }
    } catch (e) {
      console.error('Failed to process Flickr feed:', e);
    }
  };

  const script = document.createElement('script');
  script.src = `https://www.flickr.com/services/feeds/photos_public.gne?id=${encodeURIComponent(userId)}&format=json`;
  script.async = true;
  script.onerror = () => {
    console.error('Failed to load Flickr feed');
  };
  document.body.appendChild(script);
}

// Add a single Flickr shared image into a category using oEmbed (JSONP)
function loadFlickrShare(shareUrl, category) {
  if (!shareUrl || !category) return;

  if (window.__flickrShareLoaded) return;
  window.__flickrShareLoaded = true;

  let completed = false;

  window.flickrOembedCallback = function(data) {
    try {
      if (!data) return;
      completed = true;
      const rawThumb = data.thumbnail_url || data.url || '';
      if (!rawThumb) return;

      // Normalize to https and strip query params
      const thumbUrl = rawThumb.split('?')[0].replace(/^http:\/\//, 'https://');

      // Promote size: replace _q, _s, _t, _m, _n, _z, _c with _b (best effort)
      const fullUrl = thumbUrl.replace(/_q\.|_s\.|_t\.|_m\.|_n\.|_z\.|_c\.|_h\.|_k\./, '_b.');

      // Insert at the beginning so it appears early
      portfolioItems.unshift({
        thumbnail: thumbUrl,
        image: fullUrl,
        label: data.title || 'Flickr Photo',
        category: category
      });

      const activeCategoryBtn = document.querySelector('.gallery-filter button.active');
      const activeCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'All';
      if (activeCategory === 'All' || activeCategory === category) {
        renderGallery(activeCategory);
      }
    } catch (e) {
      console.error('Failed to process Flickr oEmbed:', e);
    }
  };

  const script = document.createElement('script');
  script.src = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(shareUrl)}&jsoncallback=flickrOembedCallback`;
  script.async = true;
  script.onerror = () => {
    console.error('Failed to load Flickr oEmbed');
    // Fallback to public feed (1 image)
    loadFlickrImages('203686649@N08', 1, category);
  };
  document.body.appendChild(script);

  // Fallback if oEmbed doesn’t fire (unsupported share URL)
  setTimeout(() => {
    if (!completed) {
      loadFlickrImages('203686649@N08', 1, category);
    }
  }, 4000);
}

// Load exactly one Flickr share into Maternity section
document.addEventListener('DOMContentLoaded', () => {
  // Add third Flickr image
  portfolioItems.unshift({
    thumbnail: 'https://live.staticflickr.com/65535/54829363198_864078383a_b.jpg',
    image: 'https://live.staticflickr.com/65535/54829363198_864078383a_b.jpg',
    label: 'DSC06494',
    category: 'Maternity Shoot'
  });
  // Add second Flickr image
  portfolioItems.unshift({
    thumbnail: 'https://live.staticflickr.com/65535/54829347174_18d7de98b0_b.jpg',
    image: 'https://live.staticflickr.com/65535/54829347174_18d7de98b0_b.jpg',
    label: 'DSC06469',
    category: 'Maternity Shoot'
  });
  // Insert the direct Flickr image as a normal gallery item (works with lightbox)
  portfolioItems.unshift({
    // Using provided direct URL; for a smaller thumb you can swap _b to _z
    thumbnail: 'https://live.staticflickr.com/65535/54829362774_b60d07ecbf_b.jpg',
    image: 'https://live.staticflickr.com/65535/54829362774_b60d07ecbf_b.jpg',
    label: 'DSC06482',
    category: 'Maternity Shoot'
  });
  // Re-render if needed
  const activeCategoryBtn = document.querySelector('.gallery-filter button.active');
  const activeCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'All';
  if (activeCategory === 'All' || activeCategory === 'Maternity Shoot') {
    renderGallery(activeCategory);
  }
});
