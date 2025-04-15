  // Web3 and Contract Initialization
  let web3;
  let portfolioContract;
  let currentAccount;

  // Initialize Web3 connection and contract
  async function initWeb3() {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3.eth.getAccounts();
          currentAccount = accounts[0];
          
          // Update displayed wallet address
          document.getElementById('walletAddressDisplay').innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
          
          // Initialize contract - replace with your contract address and ABI
          const contractAddress = "YOUR_CONTRACT_ADDRESS"; // Replace with your actual contract address
          const contractABI = []; // Replace with your actual contract ABI
          
          portfolioContract = new web3.eth.Contract(contractABI, contractAddress);
          
          // Load dashboard data
          loadDashboardData();
          
          // Setup event listeners for blockchain events
          setupEventListeners();
          
          showToast("Connected to blockchain successfully", "success");
        } catch (error) {
          console.error("User denied account access");
          showToast("Failed to connect to wallet. Please try again.", "error");
        }
      } 
      // Legacy dapp browsers
      else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        const accounts = await web3.eth.getAccounts();
        currentAccount = accounts[0];
        
        // Update displayed wallet address
        document.getElementById('walletAddressDisplay').innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        
        // Initialize contract
        const contractAddress = "YOUR_CONTRACT_ADDRESS"; // Replace with your actual contract address
        const contractABI = []; // Replace with your actual contract ABI
        
        portfolioContract = new web3.eth.Contract(contractABI, contractAddress);
        
        // Load dashboard data
        loadDashboardData();
        
        // Setup event listeners for blockchain events
        setupEventListeners();
        
        showToast("Connected to blockchain successfully", "success");
      } 
      else {
        console.error("No Ethereum browser extension detected");
        showToast("No Ethereum wallet detected. Please install MetaMask.", "error");
      }
    } catch (error) {
      console.error("Error initializing Web3:", error);
      showToast("Failed to initialize blockchain connection", "error");
    }
  }

  // Setup event listeners for contract events
  function setupEventListeners() {
    // Listen for document verification events
    portfolioContract.events.DocumentVerified()
      .on('data', (event) => {
        showToast("Document verified successfully!", "success");
        // Reload relevant data
        loadDashboardData();
        loadVerificationRequests();
      })
      .on('error', console.error);
    
    // Listen for document rejection events
    portfolioContract.events.DocumentRejected()
      .on('data', (event) => {
        showToast("Document rejected", "info");
        // Reload relevant data
        loadDashboardData();
        loadVerificationRequests();
      })
      .on('error', console.error);
  }

  // Load dashboard statistics and data
  async function loadDashboardData() {
    try {
      // Load statistics
      const stats = await portfolioContract.methods.getCollegeStatistics().call({ from: currentAccount });
      
      document.getElementById('pendingCount').textContent = stats.pendingCount;
      document.getElementById('verifiedCount').textContent = stats.verifiedCount;
      document.getElementById('newPortfolioCount').textContent = stats.newPortfolioCount;
      document.getElementById('companyRequestCount').textContent = stats.companyRequestCount;
      
      // Load recent verification requests
      await loadRecentVerificationRequests();
      
      // Load verification requests table
      await loadVerificationRequests();
      
      // Load student portfolios table
      await loadStudentPortfolios();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showToast("Failed to load dashboard data", "error");
    }
  }

  // Load recent verification requests for the dashboard
  async function loadRecentVerificationRequests() {
    try {
      const recentRequests = await portfolioContract.methods.getRecentVerificationRequests(2).call({ from: currentAccount });
      const container = document.getElementById('recentVerificationRequests');
      container.innerHTML = '';
      
      if (recentRequests.length === 0) {
        container.innerHTML = `
          <div class="verification-request">
            <h3>No Recent Verification Requests</h3>
            <p>There are no verification requests at this time.</p>
          </div>
        `;
        return;
      }
      
      for (const request of recentRequests) {
        const requestElement = document.createElement('div');
        requestElement.className = 'verification-request';
        requestElement.innerHTML = `
          <h3>Recent Verification Request</h3>
          <div class="request-meta">
            <span><strong>Student:</strong> ${request.studentName}</span>
            <span><strong>Date:</strong> ${new Date(request.submissionDate * 1000).toLocaleDateString()}</span>
          </div>
          <div class="request-details">
            <p><strong>Type:</strong> ${request.documentType}</p>
            <p><strong>Course:</strong> ${request.courseName}</p>
            <p><strong>Document ID:</strong> ${request.documentId}</p>
          </div>
          <div class="request-actions">
            <button class="btn btn-view" onclick="viewStudentPortfolio('${request.studentId}')">View Portfolio</button>
            <button class="btn btn-verify" onclick="verifyDocument('${request.requestId}')">Verify</button>
            <button class="btn btn-reject" onclick="rejectDocument('${request.requestId}')">Reject</button>
          </div>
        `;
        container.appendChild(requestElement);
      }
    } catch (error) {
      console.error("Error loading recent verification requests:", error);
      document.getElementById('recentVerificationRequests').innerHTML = `
        <div class="verification-request">
          <h3>Error Loading Requests</h3>
          <p>Failed to load recent verification requests. Please try again later.</p>
        </div>
      `;
    }
  }

  // Load all verification requests for the verify tab
  async function loadVerificationRequests() {
    try {
      const requests = await portfolioContract.methods.getAllVerificationRequests().call({ from: currentAccount });
      const tableBody = document.getElementById('verificationRequestsTable');
      tableBody.innerHTML = '';
      
      if (requests.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="no-items">No verification requests found</td>`;
        tableBody.appendChild(row);
        return;
      }
      
      for (const request of requests) {
        const row = document.createElement('tr');
        
        // Determine the badge class based on status
        let badgeClass = '';
        switch (request.status) {
          case '0': // Pending (assuming 0 is the enum value for Pending)
            badgeClass = 'badge-pending';
            break;
          case '1': // Verified
            badgeClass = 'badge-verified';
            break;
          case '2': // Rejected
            badgeClass = 'badge-rejected';
            break;
        }
        
        // Generate action buttons based on status
        let actionButtons = `<button class="btn btn-view" onclick="viewStudentPortfolio('${request.studentId}')">View</button>`;
        
        if (request.status === '0') { // If pending
          actionButtons += `
          <button class="btn btn-verify" onclick="verifyDocument('${request.requestId}')">Verify</button>
          <button class="btn btn-reject" onclick="rejectDocument('${request.requestId}')">Reject</button>
        `;
      }
      
      // Format date
      const submissionDate = new Date(request.submissionDate * 1000).toLocaleDateString();
      
      // Get status text
      let statusText = 'Unknown';
      switch(request.status) {
        case '0': statusText = 'Pending'; break;
        case '1': statusText = 'Verified'; break;
        case '2': statusText = 'Rejected'; break;
      }
      
      row.innerHTML = `
        <td>${request.studentName}</td>
        <td>${request.studentId}</td>
        <td>${request.documentType}</td>
        <td>${submissionDate}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            ${actionButtons}
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    }
  } catch (error) {
    console.error("Error loading verification requests:", error);
    document.getElementById('verificationRequestsTable').innerHTML = `
      <tr>
        <td colspan="6" class="no-items">Failed to load verification requests. Please try again later.</td>
      </tr>
    `;
  }
}

// Load student portfolios for the portfolios tab
async function loadStudentPortfolios() {
  try {
    const portfolios = await portfolioContract.methods.getAllStudentPortfolios().call({ from: currentAccount });
    const tableBody = document.getElementById('studentPortfoliosTable');
    tableBody.innerHTML = '';
    
    if (portfolios.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6" class="no-items">No student portfolios found</td>`;
      tableBody.appendChild(row);
      return;
    }
    
    for (const portfolio of portfolios) {
      const row = document.createElement('tr');
      
      // Determine verification status badge
      let badgeClass = '';
      let statusText = '';
      
      switch (portfolio.verificationStatus) {
        case '0': // Not verified
          badgeClass = 'badge-rejected';
          statusText = 'Not Verified';
          break;
        case '1': // Fully verified
          badgeClass = 'badge-verified';
          statusText = 'Verified';
          break;
        case '2': // Partially verified
          badgeClass = 'badge-pending';
          statusText = 'Partial';
          break;
      }
      
      row.innerHTML = `
        <td>${portfolio.studentName}</td>
        <td>${portfolio.studentId}</td>
        <td>${portfolio.department}</td>
        <td>${portfolio.year}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-view" onclick="viewStudentPortfolio('${portfolio.studentId}')">View Portfolio</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    }
  } catch (error) {
    console.error("Error loading student portfolios:", error);
    document.getElementById('studentPortfoliosTable').innerHTML = `
      <tr>
        <td colspan="6" class="no-items">Failed to load student portfolios. Please try again later.</td>
      </tr>
    `;
  }
}

// View student portfolio
async function viewStudentPortfolio(studentId) {
  try {
    // Show modal
    document.getElementById('portfolioModal').style.display = 'flex';
    
    // Reset modal content first
    document.getElementById('studentName').textContent = "Loading...";
    document.getElementById('studentDepartment').textContent = "Loading...";
    document.getElementById('studentAddress').textContent = "Wallet: Loading...";
    document.getElementById('portfolioContent').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div class="loading"></div>
        <p>Loading portfolio data...</p>
      </div>
    `;
    
    // Fetch portfolio data from blockchain
    const portfolioData = await portfolioContract.methods.getStudentPortfolio(studentId).call({ from: currentAccount });
    
    // Update basic information
    document.getElementById('studentName').textContent = portfolioData.studentName;
    document.getElementById('studentDepartment').textContent = `${portfolioData.department} - ${portfolioData.year}`;
    document.getElementById('studentAddress').textContent = `Wallet: ${portfolioData.walletAddress.substring(0, 6)}...${portfolioData.walletAddress.substring(38)}`;
    
    // Build portfolio content
    let portfolioContent = '';
    
    // Education section
    portfolioContent += `
      <div class="portfolio-section">
        <h3>Education</h3>
    `;
    
    if (portfolioData.education.length === 0) {
      portfolioContent += `<p class="no-items">No education records found</p>`;
    } else {
      for (const edu of portfolioData.education) {
        // Determine verification badge
        const badgeClass = edu.isVerified ? 'badge-verified' : 'badge-pending';
        const statusText = edu.isVerified ? 'Verified' : 'Pending Verification';
        
        portfolioContent += `
          <div class="education-item">
            <h4>${edu.degreeName}</h4>
            <div class="education-meta">
              <span>${edu.startDate} - ${edu.endDate}</span>
              <span>${edu.grade}</span>
            </div>
            <p>${edu.institution}</p>
            <p><span class="badge ${badgeClass}">${statusText}</span></p>
          </div>
        `;
      }
    }
    
    portfolioContent += `</div>`;
    
    // Projects section
    portfolioContent += `
      <div class="portfolio-section">
        <h3>Projects</h3>
    `;
    
    if (portfolioData.projects.length === 0) {
      portfolioContent += `<p class="no-items">No projects found</p>`;
    } else {
      for (const project of portfolioData.projects) {
        // Determine verification badge
        const badgeClass = project.isVerified ? 'badge-verified' : 'badge-pending';
        const statusText = project.isVerified ? 'Verified' : 'Pending Verification';
        
        portfolioContent += `
          <div class="project-item">
            <h4>${project.projectName}</h4>
            <div class="project-meta">
              <span>${project.startDate} - ${project.endDate}</span>
              <span>${project.projectType}</span>
            </div>
            <p>${project.description}</p>
            <p><span class="badge ${badgeClass}">${statusText}</span></p>
          </div>
        `;
      }
    }
    
    portfolioContent += `</div>`;
    
    // Certifications section
    portfolioContent += `
      <div class="portfolio-section">
        <h3>Certifications</h3>
    `;
    
    if (portfolioData.certifications.length === 0) {
      portfolioContent += `<p class="no-items">No certifications found</p>`;
    } else {
      for (const cert of portfolioData.certifications) {
        // Determine verification badge
        const badgeClass = cert.isVerified ? 'badge-verified' : 'badge-pending';
        const statusText = cert.isVerified ? 'Verified' : 'Pending Verification';
        
        portfolioContent += `
          <div class="certification-item">
            <h4>${cert.certificationName}</h4>
            <div class="certification-meta">
              <span>Issued: ${cert.issueDate}</span>
              <span>Issued By: ${cert.issuingAuthority}</span>
            </div>
            <p>${cert.description}</p>
            <p><span class="badge ${badgeClass}">${statusText}</span></p>
          </div>
        `;
      }
    }
    
    portfolioContent += `</div>`;
    
    // Update modal content
    document.getElementById('portfolioContent').innerHTML = portfolioContent;
    
    // Update action buttons
    const actionsDiv = document.getElementById('portfolioActions');
    actionsDiv.innerHTML = `
      <button class="btn btn-view" onclick="closeModal('portfolioModal')">Close</button>
    `;
  } catch (error) {
    console.error("Error loading student portfolio:", error);
    document.getElementById('portfolioContent').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
        <p>Failed to load portfolio data. Please try again later.</p>
      </div>
    `;
  }
}

// Verify document
async function verifyDocument(requestId) {
  try {
    showToast("Processing verification...", "info");
    
    // Call blockchain function to verify document
    await portfolioContract.methods.verifyDocument(requestId)
      .send({ from: currentAccount })
      .on('transactionHash', (hash) => {
        showToast("Transaction submitted, waiting for confirmation...", "info");
      });
    
    // Transaction successful
    showToast("Document verified successfully!", "success");
    
    // Reload data
    loadDashboardData();
  } catch (error) {
    console.error("Error verifying document:", error);
    showToast("Failed to verify document", "error");
  }
}

// Reject document
async function rejectDocument(requestId) {
  try {
    showToast("Processing rejection...", "info");
    
    // Call blockchain function to reject document
    await portfolioContract.methods.rejectDocument(requestId)
      .send({ from: currentAccount })
      .on('transactionHash', (hash) => {
        showToast("Transaction submitted, waiting for confirmation...", "info");
      });
    
    // Transaction successful
    showToast("Document rejected", "info");
    
    // Reload data
    loadDashboardData();
  } catch (error) {
    console.error("Error rejecting document:", error);
    showToast("Failed to reject document", "error");
  }
}

// Search verification requests
function searchVerificationRequests() {
  const searchTerm = document.getElementById('verifySearchInput').value.toLowerCase();
  const tableRows = document.querySelectorAll('#verificationRequestsTable tr');
  
  tableRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm) || searchTerm === '') {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Search student portfolios
function searchStudentPortfolios() {
  const searchTerm = document.getElementById('portfolioSearchInput').value.toLowerCase();
  const tableRows = document.querySelectorAll('#studentPortfoliosTable tr');
  
  tableRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm) || searchTerm === '') {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Display toast message
function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Show/hide tabs
function showTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    if (button.dataset.tab === tabId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === tabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // Update sidebar menu
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabId)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Logout function
function logout() {
  // Clear any stored session data
  localStorage.removeItem('collegeAuthToken');
  
  // Redirect to login page
  window.location.href = 'index.html';
}

// Initialize the application when the page loads
window.addEventListener('load', async () => {
  try {
    // Check if Web3 is already injected (MetaMask, etc.)
    if (typeof web3 !== 'undefined' || typeof window.ethereum !== 'undefined') {
      await initWeb3();
    } else {
      // If no web3 instance is detected, show a message to install MetaMask
      document.getElementById('statsContainer').innerHTML = `
        <div class="stat-card" style="grid-column: 1 / -1; text-align: center;">
          <div class="stat-value"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-label">Web3 Provider Not Found</div>
          <p style="margin-top: 10px;">Please install MetaMask or another Web3 wallet to use this application.</p>
          <a href="https://metamask.io/download.html" target="_blank" style="color: #57a6ff; text-decoration: underline; margin-top: 10px; display: inline-block;">
            Install MetaMask
          </a>
        </div>
      `;
      showToast("Web3 provider not detected. Please install MetaMask.", "error");
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    showToast("Failed to initialize the application", "error");
  }
});

// Event listener for when the blockchain account changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    currentAccount = accounts[0];
    document.getElementById('walletAddressDisplay').innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
    loadDashboardData();
    showToast("Account changed", "info");
  });
}