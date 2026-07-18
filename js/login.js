// FearLess Travel 360 - Login Logic Handler
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('login-remember') ? document.getElementById('login-remember').checked : false;

      let isValid = true;
      clearFormValidation(loginForm);

      // Validation
      if (!email) {
        showFieldError('login-email', 'Email address is required');
        isValid = false;
      } else if (!validateEmailFormat(email)) {
        showFieldError('login-email', 'Please enter a valid email address');
        isValid = false;
      }

      if (!password) {
        showFieldError('login-password', 'Password is required');
        isValid = false;
      }

      if (!isValid) return;

      // 1. Verify against Administrators list
      const admins = JSON.parse(localStorage.getItem('sih_admins') || '[]');
      const adminMatch = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);

      if (adminMatch) {
        localStorage.setItem('sih_active_admin_email', adminMatch.email);
        localStorage.removeItem('sih_active_user_email'); // clear tourist session

        Swal.fire({
          icon: 'success',
          title: 'Admin Verification Granted',
          text: 'Logging in to FearLess Admin Dashboard...',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = 'admin.html';
        });
        return;
      }

      // 2. Try Supabase Auth first if initialized
      if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        // Show loading spinner
        Swal.fire({
          title: 'Verifying Credentials...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        }).then(({ data, error }) => {
          Swal.close();
          if (error) {
            console.warn("Supabase Auth failed, trying local fallback:", error.message);
            // Fall back to local check
            tryLocalLogin(email, password);
          } else {
            localStorage.setItem('sih_active_user_email', data.user.email);
            localStorage.removeItem('sih_active_admin_email');

            Swal.fire({
              icon: 'success',
              title: 'Access Approved',
              text: `Welcome back! User verified via Supabase.`,
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              window.location.href = 'dashboard.html';
            });
          }
        }).catch(err => {
          Swal.close();
          console.error("Supabase signin error:", err);
          tryLocalLogin(email, password);
        });
      } else {
        // Direct local storage check
        tryLocalLogin(email, password);
      }
    });
  }
});

// Fallback login logic checking local storage database
function tryLocalLogin(email, password) {
  const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
  const userMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (userMatch) {
    localStorage.setItem('sih_active_user_email', userMatch.email);
    localStorage.removeItem('sih_active_admin_email'); // clear admin session

    Swal.fire({
      icon: 'success',
      title: 'Access Approved (Local Mode)',
      text: `Welcome back, ${userMatch.name}!`,
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.href = 'dashboard.html';
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Authentication Failed',
      text: 'Invalid email address or security password. Please try again.',
      confirmButtonColor: '#0D6EFD'
    });
  }
}

// Helper validation functions
function validateEmailFormat(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function showFieldError(fieldId, message) {
  const inputEl = document.getElementById(fieldId);
  if (!inputEl) return;

  inputEl.classList.add('error');
  const errorEl = inputEl.closest('.form-group').querySelector('.error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFormValidation(form) {
  const inputs = form.querySelectorAll('.form-control');
  inputs.forEach(input => input.classList.remove('error'));

  const errors = form.querySelectorAll('.error-message');
  errors.forEach(err => {
    err.textContent = '';
    err.style.display = 'none';
  });
}
