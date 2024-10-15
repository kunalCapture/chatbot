document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup loaded, fetching user info..."); // Debugging log
    
    // Fetch user info from chrome.storage.local
    const updateUserInfo = async () => {
        const data = await chrome.storage.session.get('userInfo');
        console.log("Data fetched from storage:", data && data.userInfo && JSON.parse(data.userInfo)); // Debugging log
        const userInfo = data && data.userInfo && JSON.parse(data.userInfo);

        console.log(userInfo);

        // If user info exists, display it; otherwise, show a default message
        if (userInfo) {
          document.getElementById('user-info').innerHTML = `
            <p><strong>Session ID:</strong> ${userInfo.sessionId}</p>
            <p><strong>Name:</strong> ${userInfo.name || 'N/A'}</p>
            <p><strong>Location:</strong> ${userInfo.location || 'N/A'}</p>
            <p><strong>Current Education:</strong> ${userInfo.current_education || 'N/A'}</p>
            <p><strong>Interests:</strong> ${userInfo.academic_interest || 'N/A'}</p>
            <p><strong>Program:</strong> ${userInfo.program_level || 'N/A'}</p>
            <p><strong>Application Stage:</strong> ${userInfo.application_stage || 'N/A'}</p>
            <p><strong>Email:</strong> ${userInfo.email || 'N/A'}</p>
            <p><strong>Concerns:</strong> ${userInfo.concerns || 'N/A'}</p>
          `;
        } else {
          document.getElementById('user-info').innerHTML = '<p>No session info available.</p>';
        }
    };

    // Update user info on initial load
    updateUserInfo();

    // Set an interval to keep updating user info every 2 seconds
    setInterval(updateUserInfo, 5000); // Adjust time as necessary
  });