// FearLess Travel 360 - Admin Analytics & Controls Console
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dashboard panels data
  loadAdminStats();
  renderIncidentTable();
  initializeCharts();
});

function loadAdminStats() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
    // Live counts from Supabase
    Promise.all([
      supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseClient.from('sos_alerts').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
      supabaseClient.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'under review'),
      supabaseClient.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
    ]).then(([profilesRes, sosRes, incReviewRes, incResolvedRes]) => {
      setWidgetText('stat-admin-users', profilesRes.count || 0);
      setWidgetText('stat-admin-sos', sosRes.count || 0);
      setWidgetText('stat-admin-incidents', incReviewRes.count || 0);
      setWidgetText('stat-admin-resolved', incResolvedRes.count || 0);
    }).catch(err => {
      console.error("Supabase count fetch failed, local fallback:", err);
      loadLocalAdminStats();
    });
  } else {
    loadLocalAdminStats();
  }
}

function setWidgetText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function loadLocalAdminStats() {
  const users = JSON.parse(localStorage.getItem('sih_users') || '[]');
  const incidents = JSON.parse(localStorage.getItem('sih_incidents') || '[]');
  const sosAlerts = JSON.parse(localStorage.getItem('sih_sos_alerts') || '[]');

  setWidgetText('stat-admin-users', users.length);
  setWidgetText('stat-admin-sos', sosAlerts.filter(a => a.status === 'Active').length);
  setWidgetText('stat-admin-incidents', incidents.filter(i => i.status === 'under review').length);
  setWidgetText('stat-admin-resolved', incidents.filter(i => i.status === 'resolved').length);
}

function renderIncidentTable() {
  const tableBody = document.getElementById('incidents-table-body');
  if (!tableBody) return;

  if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
    supabaseClient.from('incidents')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Supabase fetch incidents failed, local fallback:", error.message);
          renderLocalIncidentTable(tableBody);
        } else {
          populateTableBody(tableBody, data || []);
        }
      }).catch(err => {
        console.error("Supabase incidents fetch error, local fallback:", err);
        renderLocalIncidentTable(tableBody);
      });
  } else {
    renderLocalIncidentTable(tableBody);
  }
}

function renderLocalIncidentTable(tableBody) {
  const incidents = JSON.parse(localStorage.getItem('sih_incidents') || '[]');
  // Map local storage fields to match DB column names (e.g. touristName -> tourist_name)
  const mapped = incidents.map(inc => ({
    id: inc.id,
    type: inc.type,
    tourist_name: inc.touristName,
    location: inc.location,
    description: inc.description,
    status: inc.status,
    date: inc.date
  }));
  populateTableBody(tableBody, mapped);
}

function populateTableBody(tableBody, list) {
  tableBody.innerHTML = "";

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>No active incidents found in database logs.</p>
        </td>
      </tr>
    `;
    return;
  }

  list.forEach((inc) => {
    let badgeClass = "badge-info";
    if (inc.status === 'resolved') badgeClass = "badge-success";
    if (inc.status === 'under review') badgeClass = "badge-warning";

    const dateStr = new Date(inc.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowHTML = `
      <tr>
        <td><b>${inc.id}</b></td>
        <td>${inc.type}</td>
        <td>${inc.tourist_name || "Guest Tourist"}</td>
        <td>${inc.location}</td>
        <td>${dateStr}</td>
        <td><span class="badge ${badgeClass}">${inc.status}</span></td>
        <td>
          <div class="action-buttons-group">
            ${inc.status !== 'resolved' ? `
              <button class="btn-table-action btn-approve" onclick="resolveIncident('${inc.id}')" title="Approve & Resolve">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            <button class="btn-table-action btn-delete" onclick="deleteIncident('${inc.id}')" title="Delete Report">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', rowHTML);
  });
}

// Global scope bindings for inline onclick attributes
window.resolveIncident = function(incidentId) {
  Swal.fire({
    title: 'Resolve Incident Report?',
    text: `Mark incident ${incidentId} as resolved in SIH logs.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6C757D',
    confirmButtonText: 'Yes, Resolve'
  }).then((result) => {
    if (result.isConfirmed) {
      if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        supabaseClient.from('incidents')
          .update({ status: 'resolved' })
          .eq('id', incidentId)
          .then(({ error }) => {
            if (error) {
              Swal.fire('Error', 'Failed to resolve online: ' + error.message, 'error');
            } else {
              Swal.fire('Updated', `Incident report ${incidentId} resolved.`, 'success');
              loadAdminStats();
              renderIncidentTable();
            }
          });
      } else {
        // Local fallback
        const incidents = JSON.parse(localStorage.getItem('sih_incidents') || '[]');
        const idx = incidents.findIndex(i => i.id === incidentId);
        if (idx !== -1) {
          incidents[idx].status = 'resolved';
          localStorage.setItem('sih_incidents', JSON.stringify(incidents));
          Swal.fire('Updated (Local Mode)', `Incident report ${incidentId} resolved.`, 'success');
          loadAdminStats();
          renderIncidentTable();
        }
      }
    }
  });
};

window.deleteIncident = function(incidentId) {
  Swal.fire({
    title: 'Delete Incident Record?',
    text: `Are you sure you want to remove report ${incidentId} permanently?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6C757D',
    confirmButtonText: 'Delete'
  }).then((result) => {
    if (result.isConfirmed) {
      if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        supabaseClient.from('incidents')
          .delete()
          .eq('id', incidentId)
          .then(({ error }) => {
            if (error) {
              Swal.fire('Error', 'Failed to delete online: ' + error.message, 'error');
            } else {
              Swal.fire('Deleted', `Incident report ${incidentId} removed from database.`, 'success');
              loadAdminStats();
              renderIncidentTable();
            }
          });
      } else {
        // Local fallback
        let incidents = JSON.parse(localStorage.getItem('sih_incidents') || '[]');
        incidents = incidents.filter(i => i.id !== incidentId);
        localStorage.setItem('sih_incidents', JSON.stringify(incidents));
        Swal.fire('Deleted (Local Mode)', `Incident report ${incidentId} deleted from local records.`, 'success');
        loadAdminStats();
        renderIncidentTable();
      }
    }
  });
};

// --- Chart.js Data Initializer ---
function initializeCharts() {
  const ctxAlerts = document.getElementById('chart-sos-alerts');
  const ctxTypes = document.getElementById('chart-incident-types');

  if (ctxAlerts) {
    new Chart(ctxAlerts, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'SOS Alerts Received',
          data: [12, 19, 3, 5, 2, 3, 15],
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  if (ctxTypes) {
    new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: ['Theft', 'Medical', 'Harassment', 'Accident', 'Natural Alert'],
        datasets: [{
          data: [25, 15, 30, 10, 20],
          backgroundColor: ['#0D6EFD', '#28a745', '#ffc107', '#dc3545', '#17a2b8'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12 } }
        }
      }
    });
  }
}
