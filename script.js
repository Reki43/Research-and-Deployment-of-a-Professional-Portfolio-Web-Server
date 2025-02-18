/* Preloader & Initialization */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  preloader.style.opacity = '0';
  setTimeout(() => { preloader.style.display = 'none'; }, 500);

  // Initialize AOS for scroll animations
  AOS.init({ duration: 800, once: true });

  // Initialize Particles.js
  particlesJS('particles-js', {
    "particles": {
      "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
      "color": { "value": "#00AEEF" },
      "shape": { "type": "circle", "stroke": { "width": 0, "color": "#00AEEF" } },
      "opacity": { "value": 0.5, "random": true },
      "size": { "value": 3, "random": true },
      "line_linked": { "enable": true, "distance": 150, "color": "#00AEEF", "opacity": 0.4, "width": 1 },
      "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } },
      "modes": { "grab": { "distance": 200, "line_linked": { "opacity": 0.7 } }, "push": { "particles_nb": 4 } }
    },
    "retina_detect": true
  });

  // EDIT: Your Typed.js Text - Single string for one-time typing
  new Typed('#typed-text', {
    strings: ['Computer Information Technology Student'],
    typeSpeed: 70,
    backSpeed: 40,
    backDelay: 2000,
    loop: false,
    showCursor: false
  });

  // Removed Typed.js initialization as the text is now static
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
  });
});

// Back to Top Button
const backToTopButton = document.createElement('button');
backToTopButton.id = 'back-to-top';
backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(backToTopButton);

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) backToTopButton.classList.add('show');
  else backToTopButton.classList.remove('show');
});

backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Hamburger Menu Toggle */
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

/* Navigation Highlight on Scroll */
const navItems = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    if (pageYOffset >= sectionTop) current = section.getAttribute('id');
  });
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href').includes(current)) item.classList.add('active');
  });
});

/* Project Modal Functionality */
const projectCards = document.querySelectorAll('.project-card');
const projectModal = document.getElementById('project-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const closeModal = document.querySelector('.close-modal');

projectCards.forEach(card => {
  card.addEventListener('click', () => {
    modalTitle.textContent = card.getAttribute('data-project-title');
    modalDesc.textContent = card.getAttribute('data-project-desc');
    modalImg.src = card.getAttribute('data-project-img');
    projectModal.style.display = 'flex';
  });
});
closeModal.addEventListener('click', () => {
  projectModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === projectModal) projectModal.style.display = 'none';
});

/* Contact Form Submission */
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formFeedback.textContent = 'Message sent successfully!';
  contactForm.reset();
  setTimeout(() => { formFeedback.textContent = ''; }, 3000);
});

/* Enhanced Navigation Transform Logic */
const header = document.querySelector('header');
const sidebarNav = document.createElement('nav');
sidebarNav.className = 'sidebar-nav';

// Clone navigation items for sidebar
const navLinksClone = document.querySelector('.nav-links').cloneNode(true);
// Add icons to navigation items
navLinksClone.querySelectorAll('a').forEach(link => {
  const icon = document.createElement('i');
  switch(link.getAttribute('href')) {
    case '#home': icon.className = 'fas fa-home'; break;
    case '#about': icon.className = 'fas fa-user'; break;
    case '#skills': icon.className = 'fas fa-laptop-code'; break;
    case '#projects': icon.className = 'fas fa-project-diagram'; break;
    case '#contact': icon.className = 'fas fa-envelope'; break;
  }
  link.prepend(icon);
});
sidebarNav.appendChild(navLinksClone);

// Add social links to sidebar
const sidebarSocial = document.createElement('div');
sidebarSocial.className = 'sidebar-social';
sidebarSocial.innerHTML = `
  <a href="https://linkedin.com/in/YOUR_LINKEDIN" target="_blank" rel="noopener">
    <i class="fab fa-linkedin"></i>
  </a>
  <a href="https://github.com/YOUR_GITHUB" target="_blank" rel="noopener">
    <i class="fab fa-github"></i>
  </a>
`;
sidebarNav.appendChild(sidebarSocial);

document.body.appendChild(sidebarNav);

// Simplified scroll handling
let lastScroll = 0;
let isTransitioning = false;

window.addEventListener('scroll', () => {
  if (isTransitioning) return;
  
  const currentScroll = window.pageYOffset;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Check if we're at the bottom of the page
  const isBottom = currentScroll + windowHeight >= documentHeight - 50; // 50px threshold
  
  if (currentScroll <= 50) {
    header.classList.remove('scrolled');
    setTimeout(() => {
      sidebarNav.classList.remove('active');
    }, 200);
  } else if (currentScroll > lastScroll && !header.classList.contains('scrolled')) {
    isTransitioning = true;
    header.classList.add('scrolled');
    
    setTimeout(() => {
      sidebarNav.classList.add('active');
      isTransitioning = false;
    }, 300);
  }

  lastScroll = currentScroll;
  
  // Update active section
  let currentSectionId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.offsetHeight;
    
    // If we're at the bottom of the page, activate the contact section
    if (isBottom && section.id === 'contact') {
      currentSectionId = 'contact';
    }
    // Otherwise use normal scroll position detection
    else if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
      currentSectionId = section.id;
    }
  });
  
  // Update active states in both navigations
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('active');
    }
  });
});
