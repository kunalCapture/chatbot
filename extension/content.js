(function () {
  // Create the chatbot container
  const chatbotContainer = document.createElement("div");
  chatbotContainer.id = "chatbot-extension-container";

  // Create the chatbot icon
  const chatbotIcon = document.createElement("div");
  chatbotIcon.id = "chatbot-icon";
  chatbotIcon.innerHTML = "💬";
  chatbotContainer.appendChild(chatbotIcon);

  // Create the chatbot UI container (initially hidden)
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-container";
  chatContainer.style.display = "none"; // Hidden initially
  chatContainer.innerHTML = `
    <div class="chat-header">
      Capture AI Admissions Counselor
      <span id="close-chat">✖</span>
    </div>
    <div id="chat-box"></div>
    <input type="text" id="user-input" class="user-input" placeholder="Type a message...">
  `;
  chatbotContainer.appendChild(chatContainer);

  // Append the chatbot to the body of the page
  document.body.appendChild(chatbotContainer);

  // Inactivity timer variables
  let inactivityTimer;
  const inactivityTimeout = 30000; // 30 seconds of inactivity

  let sessionId = Math.random().toString(36).substr(2, 9);
  // Function to reset inactivity timer
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer); // Clear previous timer
    inactivityTimer = setTimeout(closeChatDueToInactivity, inactivityTimeout); // Start a new timer
  }

  // Function to close chat due to inactivity
  function closeChatDueToInactivity() {
    addMessage("Thank you for contacting us. To begin a new chat, click on the chat icon.", 'bot');
    setTimeout(() => {
      resetChat(); // Reset chat after showing the message
    }, 1000); // Show the message for 3 seconds before closing
  }

// Function to reset chat and send user information
async function resetChat() {
  // Gather user information you want to send (example: name and sessionId)
  const userInfo = {
    sessionId: sessionId, // or any other user info you have
    // Add more user information if needed
  };

  // Make API call to send user information
  const userData = await sendUserInfo(userInfo);
  console.log(JSON.stringify(userData));

  // Check if userData is an object before storing
  if (userData && typeof userData === 'object') {
    // Store the user information in Chrome storage
    chrome.storage.session.set({ userInfo: JSON.stringify(userData) }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error storing user info:', chrome.runtime.lastError); // Log any error
      } else {
        console.log('User info stored successfully'); // Log success
      }
    });
  } else {
    console.error('User data is not valid:', userData); // Log if user data is invalid
  }

  chatContainer.style.display = "none"; // Hide chat window
  chatbotIcon.style.display = "block";   // Show chat icon
  document.getElementById('chat-box').innerHTML = ''; // Clear chat content
  clearTimeout(inactivityTimer); // Clear inactivity timer
  sessionId = Math.random().toString(36).substr(2, 9); // Reset session ID for the new chat
}

// Function to send user information to the backend
async function sendUserInfo(userInfo) {
  try {
    const res =  await fetch('http://localhost:3000/send-user-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    return res.json();
  } catch (error) {
    console.error('Error sending user information:', error);
  }
}

  // Open and close chat functionality
  document.getElementById('chatbot-icon').addEventListener('click', () => {
    chatContainer.style.display = "flex";  // Show chat window
    chatbotIcon.style.display = "none";    // Hide chat icon
    document.getElementById('user-input').focus(); // Focus on the input
    resetInactivityTimer(); // Start inactivity timer when chat is opened
    chrome.storage.session.clear(function() {
        if (chrome.runtime.lastError) {
            console.error('Error clearing user info:', chrome.runtime.lastError);
        } else {
            console.log('User info cleared from local storage');
        }
    });
  });

  document.getElementById('close-chat').addEventListener('click', () => {
    resetChat(); // Reset chat when closed manually
  });

  // Add an event listener for 'Enter' keypress on the input field
  document.getElementById('user-input').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      handleInput(event);
    }
    resetInactivityTimer(); // Reset inactivity timer on user input
  });

  // Function to handle user input and fetch bot response
  async function handleInput(event) {
    const input = document.getElementById('user-input').value.trim();
    document.getElementById('user-input').value = '';  // Clear input field

    if (input === '') return;  // Ignore empty messages

    // Add user message to the chat
    addMessage(input, 'user');

    // Fetch bot response from the backend
    const website = window.location.hostname; // Get the current website
    const { response } = await fetchBotResponse(input, website);  // Get response
    await displayTypingEffect(response, 'bot');  // Show the bot typing effect with words
    resetInactivityTimer(); // Reset inactivity timer after bot response
  }


  // Function to fetch bot response from backend (OpenAI API)
  async function fetchBotResponse(input, website) {
    try {
      const response = await fetch('http://localhost:3000/get-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, sessionId, website }),
      });

      const data = await response.json();
      return { response: data.response };  // Return the AI's response
    } catch (error) {
      console.error('Error fetching bot response:', error);
      return { response: 'Sorry, there was an error processing your request.' };
    }
  }

  async function displayTypingEffect(text, sender) {
    text = formatLinks(text);  // Convert URLs to HTML anchor tags
  
    const messageBox = document.createElement('div');
    messageBox.classList.add('message', sender);
    document.getElementById('chat-box').appendChild(messageBox);
  
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;  // Set the inner HTML to include links
  
    const nodes = Array.from(tempDiv.childNodes);  // Get all child nodes
  
    // Initialize an empty string for displayed content
    let displayedHTML = '';
  
    // Iterate through each node to maintain their order
    for (let node of nodes) {
      // If it's a text node, split into words
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(' ');  // Split text into words
        for (let word of words) {
          // Add each word to the displayed HTML
          displayedHTML += word + ' ';
          messageBox.innerHTML = displayedHTML.trim();  // Update the innerHTML progressively
          document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;  // Auto-scroll
          await new Promise(resolve => setTimeout(resolve, 150));  // Delay between words
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // If it's an element node (like <a>), add its outerHTML
        displayedHTML += node.outerHTML + ' ';
        messageBox.innerHTML = displayedHTML.trim();  // Update the innerHTML progressively
        document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;  // Auto-scroll
        await new Promise(resolve => setTimeout(resolve, 150));  // Delay for the link
      }
    }
  
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;  // Final scroll to the bottom
  }
  

  // Function to display user and bot messages in the chatbox
  function addMessage(text, sender) {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message', sender);

    // Check if the message contains a URL and convert it to a clickable link
    const formattedText = formatLinks(text);
    messageBox.innerHTML = formattedText; // Use innerHTML to support links

    document.getElementById('chat-box').appendChild(messageBox);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;  // Auto-scroll to the latest message
  }
 
  // Function to format links in text
  function formatLinks(text) {
    const urlPattern1 = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern1, '<a href="$1" target="_blank" style="text-decoration: underline; color: blue;">$1</a>');
  }
})();
