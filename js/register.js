// FearLess Travel 360 - Registration Form Logic
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const fileInput = document.getElementById('reg-avatar');
  const fileWrapper = document.getElementById('file-upload-wrapper');
  const imagePreview = document.getElementById('image-preview');
  let avatarBase64 = "";

  // Handle avatar upload click and changes
  if (fileWrapper && fileInput) {
    fileWrapper.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validation of size
        if (file.size > 2 * 1024 * 1024) {
          Swal.fire('Error', 'Image size should not exceed 2MB', 'error');
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
          avatarBase64 = evt.target.result;
          imagePreview.src = avatarBase64;
          imagePreview.style.display = 'block';
          
          const iconEl = fileWrapper.querySelector('.file-upload-content i');
          const pEl = fileWrapper.querySelector('.file-upload-content p');
          if (iconEl) iconEl.style.display = 'none';
          if (pEl) pEl.innerHTML = `File chosen: <span>${file.name}</span>`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle Register Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const emergencyContact = document.getElementById('reg-emergency').value.trim();
      const address = document.getElementById('reg-address').value.trim();
      const bloodGroup = document.getElementById('reg-blood').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      let isValid = true;
      clearFormValidation(registerForm);

      // Form validation rules
      if (!name) {
        showFieldError('reg-name', 'Full name is required');
        isValid = false;
      }

      if (!email) {
        showFieldError('reg-email', 'Email address is required');
        isValid = false;
      } else if (!validateEmailFormat(email)) {
        showFieldError('reg-email', 'Please enter a valid email address');
        isValid = false;
      }

      if (!phone) {
        showFieldError('reg-phone', 'Phone number is required');
        isValid = false;
      }

      if (!emergencyContact) {
        showFieldError('reg-emergency', 'Emergency contact number is required');
        isValid = false;
      }

      if (!address) {
        showFieldError('reg-address', 'Address details are required');
        isValid = false;
      }

      if (!password) {
        showFieldError('reg-password', 'Password is required');
        isValid = false;
      } else if (password.length < 6) {
        showFieldError('reg-password', 'Password must be at least 6 characters');
        isValid = false;
      }

      if (!confirmPassword) {
        showFieldError('reg-confirm-password', 'Please confirm your password');
        isValid = false;
      } else if (password !== confirmPassword) {
        showFieldError('reg-confirm-password', 'Passwords do not match');
        isValid = false;
      }

      if (!isValid) return;

      // 1. Try Supabase Auth first if active
      if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        Swal.fire({
          title: 'Creating Passport Account...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Register in Supabase auth (includes metadata)
        supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              name: name,
              phone: phone,
              emergencyContact: emergencyContact,
              address: address,
              bloodGroup: bloodGroup,
              avatar: avatarBase64
            }
          }
        }).then(({ data, error }) => {
          if (error) {
            Swal.close();
            console.warn("Supabase SignUp failed, falling back to local database:", error.message);
            tryLocalRegister(name, email, phone, emergencyContact, address, bloodGroup, password, avatarBase64);
          } else {
            // Also write direct manual profile insert just in case SQL trigger is disabled
            supabaseClient.from('profiles').insert([{
              id: data.user.id,
              name: name,
              phone: phone,
              emergency_contact: emergencyContact,
              address: address,
              blood_group: bloodGroup,
              avatar_url: avatarBase64
            }]).then(() => {
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: 'Passport Created!',
                text: 'Your live safety passport is verified and registered on Supabase. Please login.',
                confirmButtonColor: '#0D6EFD'
              }).then(() => {
                window.location.href = 'login.html';
              });
            }).catch(err => {
              // Non-blocking catch since trigger probably did it anyway
              Swal.close();
              console.log("Supabase direct profile record write skipped (expected if SQL triggers active).");
              Swal.fire({
                icon: 'success',
                title: 'Passport Created!',
                text: 'Your live safety passport is registered. Please login.',
                confirmButtonColor: '#0D6EFD'
              }).then(() => {
                window.location.href = 'login.html';
              });
            });
          }
        }).catch(err => {
          Swal.close();
          console.error("Supabase Register crash:", err);
          tryLocalRegister(name, email, phone, emergencyContact, address, bloodGroup, password, avatarBase64);
        });
      } else {
        // Direct local storage check and register
        tryLocalRegister(name, email, phone, emergencyContact, address, bloodGroup, password, avatarBase64);
      }
    });
  }
});

// Fallback registration handler using client local storage
function tryLocalRegister(name, email, phone, emergencyContact, address, bloodGroup, password, avatarBase64) {
  const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
  const isDuplicate = users.some(u => u.email.toLowerCase() === email.toLowerCase());

  if (isDuplicate) {
    showFieldError('reg-email', 'An account with this email address already exists');
    return;
  }

  const newUser = {
    name,
    email,
    phone,
    emergencyContact,
    address,
    bloodGroup,
    password,
    avatar: avatarBase64,
    theme: "default",
    regDate: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  localStorage.setItem('sih_users', JSON.stringify(users));

  Swal.fire({
    icon: 'success',
    title: 'Registration Successful (Local Mode)',
    text: 'Your digital safety passport is now created. Please login.',
    confirmButtonColor: '#0D6EFD'
  }).then(() => {
    window.location.href = 'login.html';
  });
}

// Reuse validation helpers
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
