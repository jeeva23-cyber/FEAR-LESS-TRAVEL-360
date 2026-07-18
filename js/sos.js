// FearLess Travel 360 - SOS Emergency Dispatch Core
let alarmOscillator = null;
let audioCtx = null;

document.addEventListener('DOMContentLoaded', () => {
  const sosBtn = document.getElementById('btn-trigger-sos');
  const stopAlarmBtn = document.getElementById('btn-stop-alarm');

  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Confirm Emergency SOS?',
        text: 'This will immediately broadcast your coordinates to local safety authorities and emergency contacts.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6C757D',
        confirmButtonText: 'Yes, Send SOS!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          triggerEmergencyActions();
        }
      });
    });
  }

  if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener('click', () => {
      stopBuzzerAlarm();
      stopAlarmBtn.style.display = 'none';
      Swal.fire('Alarm Silenced', 'Local emergency buzzer has been stopped.', 'info');
    });
  }
});

function triggerEmergencyActions() {
  // 1. Fetch current details
  const activeEmail = localStorage.getItem('sih_active_user_email') || "sarah@domain.com";
  const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
  const user = users.find(u => u.email === activeEmail) || { name: "Guest Tourist", emergencyContact: "+91 99999 88888" };

  // Coordinates Mock/GPS lookup
  const coords = "18.9220, 72.8347";
  const address = "Gateway of India, Colaba, Mumbai";

  // 2. Write alert to local storage list (simulating cloud database sync)
  const alerts = JSON.parse(localStorage.getItem('sih_sos_alerts') || '[]');
  const newAlert = {
    id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
    touristName: user.name,
    coordinates: coords,
    address: address,
    time: new Date().toISOString(),
    status: "Active"
  };

  alerts.unshift(newAlert);
  localStorage.setItem('sih_sos_alerts', JSON.stringify(alerts));

  // Sync to Supabase in parallel
  if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
    supabaseClient.from('sos_alerts').insert([{
      id: newAlert.id,
      tourist_name: newAlert.touristName,
      coordinates: newAlert.coordinates,
      address: newAlert.address,
      status: newAlert.status
    }]).then(() => {
      console.log("SOS alert logged online in Supabase DB.");
    }).catch(err => {
      console.error("Supabase SOS log failed:", err);
    });
  }

  // 3. Show dynamic emergency display updates (if on screen)
  const listEl = document.getElementById('emergency-logs');
  if (listEl) {
    const itemHTML = `
      <div class="info-item">
        <div class="info-label">Active alert dispatched</div>
        <div class="info-value text-danger" style="color:#dc3545">${newAlert.id} - Sent ${new Date().toLocaleTimeString()}</div>
      </div>
    `;
    listEl.insertAdjacentHTML('afterbegin', itemHTML);
  }

  // 4. Start Local Audio Buzzer
  startBuzzerAlarm();
  const stopAlarmBtn = document.getElementById('btn-stop-alarm');
  if (stopAlarmBtn) stopAlarmBtn.style.display = 'block';

  // 5. Fire SweetAlert confirmation display
  Swal.fire({
    title: '🚨 EMERGENCY SOS ACTIVE 🚨',
    html: `
      <div style="text-align: left; padding: 10px;">
        <p><b>Alert Reference:</b> ${newAlert.id}</p>
        <p><b>Dispatched GPS:</b> ${coords}</p>
        <p><b>SMS broadcasted to emergency contact:</b> ${user.emergencyContact}</p>
        <p style="margin-top: 15px; color: #dc3545; font-weight: bold;">Local dispatch centers and police stations have been alerted. Stand by.</p>
      </div>
    `,
    icon: 'error',
    confirmButtonText: 'Acknowledge',
    confirmButtonColor: '#dc3545'
  });
}

// Web Audio API Synthesizer alarm
function startBuzzerAlarm() {
  try {
    // If audioCtx already running, return
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create dual tone oscillators
    alarmOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    alarmOscillator.type = 'sawtooth';
    alarmOscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch

    // Pulse volume modification loop
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);

    alarmOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    alarmOscillator.start();
    
    // Continuous alarm buzzer simulator
    alarmInterval = setInterval(() => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    }, 1000);

  } catch(e) {
    console.error("Audio Context initialization failed.", e);
  }
}

function stopBuzzerAlarm() {
  if (alarmOscillator) {
    try {
      alarmOscillator.stop();
    } catch(e) {}
    alarmOscillator = null;
  }
  if (typeof alarmInterval !== 'undefined') {
    clearInterval(alarmInterval);
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}
