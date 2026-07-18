// FearLess Travel 360 - QR Code Passport Generator
document.addEventListener('DOMContentLoaded', () => {
  const qrCanvas = document.getElementById('qr-canvas');
  const btnDownload = document.getElementById('btn-download-qr');
  const btnPrint = document.getElementById('btn-print-qr');

  if (qrCanvas) {
    // 1. Fetch active session user info
    const activeEmail = localStorage.getItem('sih_active_user_email') || "sarah@domain.com";
    const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
    const user = users.find(u => u.email === activeEmail) || {
      name: "Aarav Sharma",
      email: "tourist@example.com",
      phone: "+91 98765 43210",
      emergencyContact: "+91 99999 88888",
      bloodGroup: "O+"
    };

    // Populate passport details text on the screen
    document.getElementById('passport-name').textContent = user.name;
    document.getElementById('passport-blood').textContent = user.bloodGroup || "O+";
    document.getElementById('passport-contact').textContent = user.emergencyContact;
    document.getElementById('passport-phone').textContent = user.phone;

    // 2. Format QR Data String (contain medical and emergency details)
    const qrString = `FEARLESS_PASSPORT_ID:
Name: ${user.name}
Blood: ${user.bloodGroup || "O+"}
Emergency Contact: ${user.emergencyContact}
Phone: ${user.phone}
Email: ${user.email}
Verification: SIH Safe-Certified`;

    // 3. Generate QR code on the canvas using QRious library
    try {
      const qr = new QRious({
        element: qrCanvas,
        value: qrString,
        size: 200,
        background: '#ffffff',
        foreground: '#0D6EFD', // Primary Color theme accent!
        level: 'H' // High correction
      });

      // Bind download option
      if (btnDownload) {
        btnDownload.addEventListener('click', () => {
          const dataURL = qrCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `FearLess_Passport_${user.name.replace(/\s+/g, '_')}.png`;
          link.click();
          Swal.fire('Downloaded', 'Your digital safety ID card image is saved.', 'success');
        });
      }

      // Bind print option
      if (btnPrint) {
        btnPrint.addEventListener('click', () => {
          const dataURL = qrCanvas.toDataURL('image/png');
          const windowContent = `
            <!DOCTYPE html>
            <html>
            <head><title>Print Tourist Safety Pass</title></head>
            <body style="text-align: center; font-family: sans-serif; padding: 40px;">
              <h2>FearLess Travel 360</h2>
              <h3>Digital Tourist Safety ID</h3>
              <hr style="max-width: 400px; margin: 20px auto;">
              <img src="${dataURL}" style="margin: 20px 0; border: 1px solid #ccc; padding: 10px; border-radius: 10px;">
              <p><b>Name:</b> ${user.name}</p>
              <p><b>Blood Type:</b> ${user.bloodGroup || "O+"}</p>
              <p><b>Emergency Helpline:</b> ${user.emergencyContact}</p>
              <p>Scan this QR code in emergency stations to view safe logs.</p>
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
          `;
          const printWindow = window.open('', '', 'width=600,height=600');
          printWindow.document.open();
          printWindow.document.write(windowContent);
          printWindow.document.close();
        });
      }

    } catch (err) {
      console.error("QR Code generator script error.", err);
      qrCanvas.innerHTML = `<span style="color:red">Failed to initialize QR canvas.</span>`;
    }
  }
});
