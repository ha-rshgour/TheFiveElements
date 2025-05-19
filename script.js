// Loading state handling
let pageLoaded = false;
let minimumLoadTime = 5000; // 5 seconds in milliseconds
let startTime = Date.now();

// Function to create loading animation container
function createLoadingAnimation(container) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'image-loading-animation';
  
  const loaderImg = document.createElement('img');
  loaderImg.src = 'image/Image loader.gif';
  loaderImg.alt = 'Loading...';
  loaderImg.className = 'loader-gif';
  
  loadingDiv.appendChild(loaderImg);
  container.appendChild(loadingDiv);
  
  return loadingDiv;
}

// Cache for loaded images
const imageCache = new Map();

// Function to preload images
function preloadImage(src) {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Function to render gallery items in chunks
async function renderGalleryChunk(items, startIndex, chunkSize) {
  const endIndex = Math.min(startIndex + chunkSize, items.length);
  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    const div = document.createElement('div');
    div.className = 'item';
    
    // Create and add loading animation first
    const loadingAnimation = createLoadingAnimation(div);
    
    const img = document.createElement('img');
    img.className = 'gallery-image';
    img.alt = item.label || '';
    
    // Load image directly
    img.onload = function() {
      this.classList.add('loaded');
      loadingAnimation.style.opacity = '0';
      setTimeout(() => {
        loadingAnimation.remove();
      }, 300);
    };
    
    img.onerror = function() {
      this.src = 'image/placeholder.jpg';
      loadingAnimation.remove();
    };
    
    // Set the image source
    img.src = item.thumbnail || item.image;
    
    div.appendChild(img);
    div.addEventListener('click', () => openLightbox(item.image));
    fragment.appendChild(div);
  }

  gallery.appendChild(fragment);
  return endIndex;
}

async function renderGallery(selectedCategory = 'All') {
  gallery.innerHTML = '';

  let itemsToShow;
  if (selectedCategory === 'All') {
    itemsToShow = portfolioItems.filter(item =>
      ['Baby Shoots', 'New Born', 'Maternity Shoot'].includes(item.category)
    );
  } else {
    itemsToShow = portfolioItems.filter(item => item.category === selectedCategory);
  }

  // Shuffle array for 'All' category
  if (selectedCategory === 'All') {
    for (let i = itemsToShow.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsToShow[i], itemsToShow[j]] = [itemsToShow[j], itemsToShow[i]];
    }
  }

  // Render all items but initially hide those beyond the first 6
  for (let i = 0; i < itemsToShow.length; i++) {
    const item = itemsToShow[i];
    const div = document.createElement('div');
    div.className = 'item';
    
    // Hide items beyond first 6 for 'All' category
    if (selectedCategory === 'All' && i >= 6) {
      div.style.display = 'none';
    }
    
    // Create and add loading animation first
    const loadingAnimation = createLoadingAnimation(div);
    
    const img = document.createElement('img');
    img.className = 'gallery-image';
    img.alt = item.label || '';
    
    // Load image directly
    img.onload = function() {
      this.classList.add('loaded');
      loadingAnimation.style.opacity = '0';
      setTimeout(() => {
        loadingAnimation.remove();
      }, 300);
    };
    
    img.onerror = function() {
      this.src = 'image/placeholder.jpg';
      loadingAnimation.remove();
    };
    
    // Set the image source
    img.src = item.thumbnail || item.image;
    
    div.appendChild(img);
    div.addEventListener('click', () => openLightbox(item.image));
    gallery.appendChild(div);
  }

  // Update show more button visibility
  const showMoreBtn = document.getElementById('show-more-btn');
  if (showMoreBtn) {
    showMoreBtn.style.display = (selectedCategory === 'All' && itemsToShow.length > 6) ? 'block' : 'none';
  }

  // Reset expanded state when changing categories
  if (selectedCategory !== 'All') {
    isExpanded = false;
    if (showMoreBtn) {
      showMoreBtn.textContent = 'Show More';
    }
  }
}

// Optimize image loading with Intersection Observer
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        preloadImage(img.dataset.src).then(() => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }).catch(() => {
          img.src = 'image/placeholder.jpg';
        });
        observer.unobserve(img);
      }
    }
  });
}, {
  rootMargin: '50px 0px',
  threshold: 0.01
});

function loadVisibleImages() {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => imageObserver.observe(img));
}

window.addEventListener('load', function() {
  pageLoaded = true;
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);

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

// Portfolio items data
const portfolioItems = [
  // --- Baby Shoots (all images from folder) ---
  {
    thumbnail: 'image/Baby Shoots/DSC05880-min.jpg',
    image: 'image/Baby Shoots/DSC05880-min.jpg',
    label: 'Baby Shoot 1',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240819_222506-min.jpg',
    image: 'image/Baby Shoots/SAVE_20240819_222506-min.jpg',
    label: 'Baby Shoot 2',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240925_154029-min.jpg',
    image: 'image/Baby Shoots/SAVE_20240925_154029-min.jpg',
    label: 'Baby Shoot 3',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20240925_154037-min.jpg',
    image: 'image/Baby Shoots/SAVE_20240925_154037-min.jpg',
    label: 'Baby Shoot 4',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123509-min.jpg',
    image: 'image/Baby Shoots/SAVE_20241022_123509-min.jpg',
    label: 'Baby Shoot 5',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123521-min.jpg',
    image: 'image/Baby Shoots/SAVE_20241022_123521-min.jpg',
    label: 'Baby Shoot 6',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241022_123537-min.jpg',
    image: 'image/Baby Shoots/SAVE_20241022_123537-min.jpg',
    label: 'Baby Shoot 7',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20241127_214936-min.jpg',
    image: 'image/Baby Shoots/SAVE_20241127_214936-min.jpg',
    label: 'Baby Shoot 8',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250205_130119-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250205_130119-min.jpg',
    label: 'Baby Shoot 9',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250205_130129-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250205_130129-min.jpg',
    label: 'Baby Shoot 10',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250206_081640-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250206_081640-min.jpg',
    label: 'Baby Shoot 11',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250206_081648-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250206_081648-min.jpg',
    label: 'Baby Shoot 12',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250306_104604-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250306_104604-min.jpg',
    label: 'Baby Shoot 13',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250309_195742-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250309_195742-min.jpg',
    label: 'Baby Shoot 14',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250309_195800-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250309_195800-min.jpg',
    label: 'Baby Shoot 15',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_144028-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250328_144028-min.jpg',
    label: 'Baby Shoot 16',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_152510-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250328_152510-min.jpg',
    label: 'Baby Shoot 17',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_152522-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250328_152522-min.jpg',
    label: 'Baby Shoot 18',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_244554-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250328_244554-min.jpg',
    label: 'Baby Shoot 19',
    category: 'Baby Shoots'
  },
  {
    thumbnail: 'image/Baby Shoots/SAVE_20250328_244604-min.jpg',
    image: 'image/Baby Shoots/SAVE_20250328_244604-min.jpg',
    label: 'Baby Shoot 20',
    category: 'Baby Shoots'
  },
  // --- Maternity Shoot (all images from folder) ---
  {
    thumbnail: 'image/Maternity Shoot/SAVE_20240924_133845.jpg',
    image: 'image/Maternity Shoot/SAVE_20240924_133845.jpg',
    label: 'Maternity Shoot 1',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04614 Logo.jpg',
    image: 'image/Maternity Shoot/DSC04614 Logo.jpg',
    label: 'Maternity Shoot 2',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/ABP06330.jpg',
    image: 'image/Maternity Shoot/ABP06330.jpg',
    label: 'Maternity Shoot 3',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/ABP05999 Logo.jpg',
    image: 'image/Maternity Shoot/ABP05999 Logo.jpg',
    label: 'Maternity Shoot 4',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04821.jpg',
    image: 'image/Maternity Shoot/DSC04821.jpg',
    label: 'Maternity Shoot 5',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04737.jpg',
    image: 'image/Maternity Shoot/DSC04737.jpg',
    label: 'Maternity Shoot 6',
    category: 'Maternity Shoot'
  },
  {
    thumbnail: 'image/Maternity Shoot/DSC04721.jpg',
    image: 'image/Maternity Shoot/DSC04721.jpg',
    label: 'Maternity Shoot 7',
    category: 'Maternity Shoot'
  },
//new born
  {
    thumbnail: 'image/New Born/SAVE_20250509_101639_compressed.jpg',
    image: 'image/New Born/SAVE_20250509_101639_compressed.jpg',
    label: 'New Born 1',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200231_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200231_compressed.jpg',
    label: 'New Born 2',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20241225_141330_compressed.jpg',
    image: 'image/New Born/SAVE_20241225_141330_compressed.jpg',
    label: 'New Born 3',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240912_204409_compressed.jpg',
    image: 'image/New Born/SAVE_20240912_204409_compressed.jpg',
    label: 'New Born 4',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20241031_125823_compressed.jpg',
    image: 'image/New Born/SAVE_20241031_125823_compressed.jpg',
    label: 'New Born 5',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240912_204419_compressed.jpg',
    image: 'image/New Born/SAVE_20240912_204419_compressed.jpg',
    label: 'New Born 6',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240914_214641_compressed.jpg',
    image: 'image/New Born/SAVE_20240914_214641_compressed.jpg',
    label: 'New Born 7',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240911_173857_compressed.jpg',
    image: 'image/New Born/SAVE_20240911_173857_compressed.jpg',
    label: 'New Born 8',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240911_203030_compressed.jpg',
    image: 'image/New Born/SAVE_20240911_203030_compressed.jpg',
    label: 'New Born 9',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200257_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200257_compressed.jpg',
    label: 'New Born 10',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191123_compressed.jpg',
    image: 'image/New Born/SAVE_20250130_191123_compressed.jpg',
    label: 'New Born 11',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191053_compressed.jpg',
    image: 'image/New Born/SAVE_20250130_191053_compressed.jpg',
    label: 'New Born 12',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240911_203022_compressed.jpg',
    image: 'image/New Born/SAVE_20240911_203022_compressed.jpg',
    label: 'New Born 13',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20240911_203036_compressed.jpg',
    image: 'image/New Born/SAVE_20240911_203036_compressed.jpg',
    label: 'New Born 14',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200014_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200014_compressed.jpg',
    label: 'New Born 15',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250130_191118_compressed.jpg',
    image: 'image/New Born/SAVE_20250130_191118_compressed.jpg',
    label: 'New Born 16',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200020_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200020_compressed.jpg',
    label: 'New Born 17',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200248_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200248_compressed.jpg',
    label: 'New Born 18',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200027_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200027_compressed.jpg',
    label: 'New Born 19',
    category: 'New Born'
  },
  {
    thumbnail: 'image/New Born/SAVE_20250504_200241_compressed.jpg',
    image: 'image/New Born/SAVE_20250504_200241_compressed.jpg',
    label: 'New Born 20',
    category: 'New Born'
  },
  // --- Festival Images ---
  {
    thumbnail: 'image/festival/DSC04248_compressed.jpg',
    image: 'image/festival/DSC04248_compressed.jpg',
    label: 'Festival 1',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/DSC05086_compressed.JPG',
    image: 'image/festival/DSC05086_compressed.JPG',
    label: 'Festival 2',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1137672_compressed.jpg',
    image: 'image/festival/P1137672_compressed.jpg',
    label: 'Festival 3',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138193_compressed.jpg',
    image: 'image/festival/P1138193_compressed.jpg',
    label: 'Festival 4',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138369_compressed.jpg',
    image: 'image/festival/P1138369_compressed.jpg',
    label: 'Festival 5',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138409_compressed.jpg',
    image: 'image/festival/P1138409_compressed.jpg',
    label: 'Festival 7',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138934_compressed.jpg',
    image: 'image/festival/P1138934_compressed.jpg',
    label: 'Festival 10',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1138962_compressed.jpg',
    image: 'image/festival/P1138962_compressed.jpg',
    label: 'Festival 11',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1139025_compressed.jpg',
    image: 'image/festival/P1139025_compressed.jpg',
    label: 'Festival 12',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/P1139037_compressed.jpg',
    image: 'image/festival/P1139037_compressed.jpg',
    label: 'Festival 13',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232634-min_compressed.jpg',
    image: 'image/festival/SAVE_20240825_232634-min_compressed.jpg',
    label: 'Festival 14',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232801_compressed.jpg',
    image: 'image/festival/SAVE_20240825_232801_compressed.jpg',
    label: 'Festival 15',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20240825_232815_compressed.jpg',
    image: 'image/festival/SAVE_20240825_232815_compressed.jpg',
    label: 'Festival 16',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20250225_155609_compressed.jpg',
    image: 'image/festival/SAVE_20250225_155609_compressed.jpg',
    label: 'Festival 17',
    category: 'Festival'
  },
  {
    thumbnail: 'image/festival/SAVE_20250226_190800_compressed.jpg',
    image: 'image/festival/SAVE_20250226_190800_compressed.jpg',
    label: 'Festival 18',
    category: 'Festival'
  }
];

const categories = ['Baby Shoots', 'New Born', 'Maternity Shoot', 'Pre-Wedding', 'Engagement', 'Wedding', 'Festival'];
const gallery = document.getElementById('gallery');
const filterBar = document.getElementById('gallery-filter');

// Filter bar event
filterBar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    // Remove active from all
    filterBar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    // Add active to clicked
    e.target.classList.add('active');
    // Render gallery
    renderGallery(e.target.dataset.category);
  }
});

// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.close');

function openLightbox(imgSrc) {
  lightbox.style.display = 'block';
  lightboxImg.src = imgSrc;
  lightboxCaption.textContent = '';
}

closeBtn.onclick = function() {
  lightbox.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target == lightbox) {
    lightbox.style.display = 'none';
  }
}

// Hamburger menu functionality
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      const navLinks = document.getElementById('nav-links');
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
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
  
  items.forEach((item, index) => {
    if (selectedCategory === 'All') {
      if (isExpanded || index < 6) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    } else {
      item.style.display = 'block';
    }
  });

  // Update button text
  if (showMoreBtn) {
    showMoreBtn.textContent = isExpanded ? 'Show Less' : 'Show More';
  }
}

// Initialize gallery display
updateGalleryDisplay();

if (showMoreBtn) {
  showMoreBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    updateGalleryDisplay();
  });
}

// Initial render
renderGallery();
