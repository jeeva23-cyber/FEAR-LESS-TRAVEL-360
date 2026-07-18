// FearLess Travel 360 - Common / Global JavaScript Core
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Database in LocalStorage if not exists
  initMockDatabase();

  // Highlight active link in primary header navigation
  highlightActiveNavigation();

  // Bind responsive nav hamburger triggers
  bindResponsiveNavs();

  // Load common user dashboard details (if logged in)
  loadGlobalUserDetails();
});

// --- Database Initializer ---
function initMockDatabase() {
  // 1. Registered Tourists
  if (!localStorage.getItem('sih_users')) {
    const mockUsers = [
      {
        name: "Aarav Sharma",
        email: "tourist@example.com",
        phone: "+91 98765 43210",
        emergencyContact: "+91 99999 88888",
        address: "New Delhi, India",
        password: "password123",
        bloodGroup: "O+",
        avatar: "",
        theme: "default",
        regDate: "2026-07-01"
      },
      {
        name: "Sarah Jenkins",
        email: "sarah@domain.com",
        phone: "+1 555 123 4567",
        emergencyContact: "+1 555 987 6543",
        address: "California, USA",
        password: "password123",
        bloodGroup: "A-",
        avatar: "",
        theme: "default",
        regDate: "2026-07-05"
      }
    ];
    localStorage.setItem('sih_users', JSON.stringify(mockUsers));
  }

  // 2. Administrators
  if (!localStorage.getItem('sih_admins')) {
    const mockAdmins = [
      {
        name: "SIH Safety Moderator",
        email: "admin@sih.gov.in",
        password: "admin123"
      }
    ];
    localStorage.setItem('sih_admins', JSON.stringify(mockAdmins));
  }

  // 3. Incident Reports
  if (!localStorage.getItem('sih_incidents')) {
    const mockIncidents = [
      {
        id: "INC-9382",
        type: "Theft",
        touristName: "Sarah Jenkins",
        location: "Colaba Causeway, Mumbai",
        description: "Bag pickpocketed near the local market stalls. Contained passport and cash.",
        status: "under review",
        date: "2026-07-09T14:32:00.000Z"
      },
      {
        id: "INC-1294",
        type: "Medical",
        touristName: "Aarav Sharma",
        location: "Kullu Valley trek path, HP",
        description: "Trekker suffered minor ankle sprain. Emergency bandage applied, needs transportation down.",
        status: "resolved",
        date: "2026-07-08T09:15:00.000Z"
      },
      {
        id: "INC-7439",
        type: "Harassment",
        touristName: "Emily Watson",
        location: "Red Fort outer ring road, Delhi",
        description: "Followed by three unlicensed guides. Resolved after police booth intervention.",
        status: "resolved",
        date: "2026-07-06T18:45:00.000Z"
      }
    ];
    localStorage.setItem('sih_incidents', JSON.stringify(mockIncidents));
  }

  // 4. SOS Emergency Alerts Logs
  if (!localStorage.getItem('sih_sos_alerts')) {
    const mockSosLogs = [
      {
        id: "SOS-7264",
        touristName: "Sarah Jenkins",
        coordinates: "18.9220, 72.8347",
        address: "Gateway of India, Mumbai",
        time: "2026-07-10T02:15:00.000Z",
        status: "Active"
      },
      {
        id: "SOS-1829",
        touristName: "Aarav Sharma",
        coordinates: "28.6562, 77.2410",
        address: "Red Fort, Delhi",
        time: "2026-07-09T11:40:00.000Z",
        status: "Resolved"
      }
    ];
    localStorage.setItem('sih_sos_alerts', JSON.stringify(mockSosLogs));
  }
}

// --- Active Link Highlighter ---
function highlightActiveNavigation() {
  const currentPath = window.location.pathname;
  const fileName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  // Public Nav Link highlights
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === fileName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Dashboard Sidebar Highlights
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    const link = item.querySelector('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href === fileName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
  });
}

// --- Navigation Hamburgers ---
function bindResponsiveNavs() {
  // Mobile Header Nav Menu Toggle
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = hamburgerBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });
  }

  // Dashboard Sidebar Toggle
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

// --- User Profile Header loader ---
function loadGlobalUserDetails() {
  // Check standard tourist session
  const activeUserEmail = localStorage.getItem('sih_active_user_email');
  if (activeUserEmail) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
      supabaseClient.auth.getUser().then(({ data: { user } }) => {
        if (user && user.email === activeUserEmail) {
          const name = user.user_metadata.name || "Tourist User";
          const avatar = user.user_metadata.avatar || "";
          updateHeaderProfileDetails(name, avatar);
        } else {
          loadLocalUserDetails(activeUserEmail);
        }
      }).catch(err => {
        loadLocalUserDetails(activeUserEmail);
      });
    } else {
      loadLocalUserDetails(activeUserEmail);
    }
    return;
  }
}

function loadLocalUserDetails(email) {
  const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
  const user = users.find(u => u.email === email);
  if (user) {
    updateHeaderProfileDetails(user.name, user.avatar);
  }
}

function updateHeaderProfileDetails(name, avatar) {
  const nameElements = document.querySelectorAll('.user-name-small');
  nameElements.forEach(el => el.textContent = name);

  const avatarElements = document.querySelectorAll('.user-avatar-small');
  avatarElements.forEach(el => {
    el.textContent = name.charAt(0).toUpperCase();
    if (avatar) {
      el.style.backgroundImage = `url(${avatar})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = ''; // clear text letter
    } else {
      el.style.backgroundImage = 'none';
    }
  });
}

  // Check admin session
  const activeAdminEmail = localStorage.getItem('sih_active_admin_email');
  if (activeAdminEmail) {
    const admins = JSON.parse(localStorage.getItem('sih_admins') || '[]');
    const admin = admins.find(a => a.email === activeAdminEmail);
    if (admin) {
      const nameElements = document.querySelectorAll('.user-name-small');
      nameElements.forEach(el => el.textContent = admin.name);

      const roleElements = document.querySelectorAll('.user-role-small');
      roleElements.forEach(el => el.textContent = "Administrator");

      const avatarElements = document.querySelectorAll('.user-avatar-small');
      avatarElements.forEach(el => {
        el.textContent = 'A';
        el.style.background = '#FF6B35'; // Admin distinct header color
      });
    }
  }
}
