// FearLess Travel 360 - AI Safety Assistant Chatbot Logic
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-msg-input');
  const sendBtn = document.getElementById('btn-send-chat');
  const chatMessages = document.getElementById('chat-box-messages');
  const quickReplyButtons = document.querySelectorAll('.quick-reply-btn');

  // Quick replies click bindings
  quickReplyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent;
      sendUserMessage(text);
      getBotResponse(text);
    });
  });

  // Text Send binding
  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => {
      handleChatSubmit();
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleChatSubmit();
      }
    });
  }

  function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    sendUserMessage(text);

    // Mock bot reply typing animation simulation
    setTimeout(() => {
      getBotResponse(text);
    }, 800);
  }

  function sendUserMessage(text) {
    if (!chatMessages) return;

    const messageHTML = `
      <div class="message user">
        ${text}
      </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
  }

  function getBotResponse(userQuery) {
    if (!chatMessages) return;

    const query = userQuery.toLowerCase();
    let reply = "";

    // NLP basic checks
    if (query.includes('hospital') || query.includes('medical') || query.includes('doctor')) {
      reply = `🏥 <b>Nearest Medical Assistance:</b><br>
      1. <b>St. George Hospital</b> (0.8km away) - Helpline: +91 22 2262 0242<br>
      2. <b>Gokuldas Tejpal Hospital</b> (1.2km away) - Helpline: +91 22 2262 1464<br>
      Would you like to trigger an automated GPS ambulance dispatch?`;
    } 
    else if (query.includes('police') || query.includes('cop') || query.includes('security')) {
      reply = `🚨 <b>Nearest Safety Booths:</b><br>
      1. <b>Colaba Police Station</b> (0.4km away) - Phone: +91 22 2285 6817<br>
      2. <b>Marine Drive Police Booth</b> (1.5km away) - Phone: +91 22 2281 2235<br>
      Emergency Safety Helpline is active: <b>112</b>.`;
    }
    else if (query.includes('number') || query.includes('helpline') || query.includes('contact')) {
      reply = `📞 <b>National Emergency Contacts (India):</b><br>
      • <b>All-in-one Emergency:</b> 112<br>
      • <b>Police:</b> 100<br>
      • <b>Fire Services:</b> 101<br>
      • <b>Ambulance Helpline:</b> 102 / 108<br>
      • <b>Women Safety Helpline:</b> 1091`;
    }
    else if (query.includes('route') || query.includes('safe path') || query.includes('destination')) {
      reply = `🧭 <b>Route Safety Analysis:</b><br>
      • path from <i>Gateway of India</i> to <i>Colaba Causeway</i> has a **98% Safety Index** based on active patrol logs.<br>
      • **Tip:** Avoid dark alleyways near the shipyard after 9 PM. Stay on the lit boulevard paths.`;
    }
    else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      reply = `👋 Hello! I am your AI Safety Assistant. Ask me about nearby hospitals, police stations, safe routes, or emergency contacts. How can I help you feel secure today?`;
    }
    else {
      reply = `ℹ️ <b>Safety Protocol Advisory:</b><br>
      Stay inside designated geofence limits. Ensure your location permissions are on and keep emergency contacts ready. If in danger, trigger the red <b>SOS Emergency Button</b> immediately.`;
    }

    const botHTML = `
      <div class="message bot">
        ${reply}
      </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', botHTML);
    scrollToBottom();
  }

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
});
