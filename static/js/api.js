// A central helper to extract cookies if CSRF token protection is required by your configuration
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Global secure fetch wrapper to handle tokens and silent refreshes automatically
async function secureFetch(url, options = {}) {
    options.headers = options.headers || {};
    
    let accessToken = localStorage.getItem('access_token');
    let refreshToken = localStorage.getItem('refresh_token');

    if (accessToken) {
        try {
            // Safe Base64URL string decoding for isolated payload indexing
            const base64Url = accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            const expiryTime = payload.exp * 1000; // Synchronize Unix time stamps to JS milliseconds
            const bufferTime = 10000; // 10-second safety window to clear network transit lags

            // SILENT REFRESH TIMELINE WATCH
            if (Date.now() >= (expiryTime - bufferTime)) {
                console.log("Access token expiring soon. Executing silent rotation...");
                
                const refreshResponse = await fetch("/api/token/refresh/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie('csrftoken')
                    },
                    body: JSON.stringify({ refresh: refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    
                    // Instantly capture and update the rotated key pairings inside browser memory
                    localStorage.setItem('access_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    accessToken = data.access;
                } else {
                    // Collision caught or token naturally dead. Terminate memory context.
                    console.warn("Session compromised or dead. Logging out.");
                    localStorage.clear();
                    window.location.href = "/login/";
                    return;
                }
            }
        } catch (err) {
            console.error("Token decoding error. Forcing login fallback.", err);
            localStorage.clear();
            window.location.href = "/login/";
            return;
        }
    }

    // Attach active valid credentials to request headers and dispatch
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';

    return fetch(url, options);
}

//  Use it in every page you need to refresh token after access token expires ....

 // <script src="{% static 'js/api.js' %}"></script>

// <script>
    // Call any private view cleanly. The background script takes care of the security checks!
   // secureFetch("/api/dashboard-metrics/")
    //    .then(response => response.json())
     //   .then(data => {
      //      document.getElementById("user-profile-display").textContent = data.username;
    //    });
//</script>
