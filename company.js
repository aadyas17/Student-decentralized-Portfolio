// Global variables for blockchain integration
let studentPortfolioContract;
let collegAuthStatus = false;

// Check if MetaMask is installed and connected
document.addEventListener('DOMContentLoaded', async function() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Check if already connected
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        displayWalletAddress(walletAddress);
        
        // Check if previously authenticated with college
        const isAuthenticated = localStorage.getItem("collegeAuthStatus");
        if (isAuthenticated === "true") {
          collegAuthStatus = true;
          document.getElementById('college-auth-section').style.display = 'none';
          document.getElementById('search-container').style.display = 'block';
          
          // Connect to blockchain contract
          await initializeBlockchainConnection();
        }
      } else {
        // If not connected, prompt user to connect
        connectWallet();
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      showAlert("Error connecting to blockchain. Please make sure MetaMask is installed and unlocked.");
    }
  } else {
    showAlert("MetaMask is not installed. Please install MetaMask to use this feature.");
    window.location.href = "index.html";
  }
});

// Connect to MetaMask wallet
async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const walletAddress = accounts[0];
      displayWalletAddress(walletAddress);
      
      // Store wallet address in local storage
      localStorage.setItem("companyWalletAddress", walletAddress);
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error.code === -32002) {
        showAlert("MetaMask connection is pending. Please check your MetaMask popup.");
      } else {
        showAlert("Error connecting to MetaMask: " + error.message);
      }
    }
  } else {
    showAlert("MetaMask is not installed. Please install MetaMask to use this feature.");
    window.location.href = "index.html";
  }
}

// Display the connected wallet address
function displayWalletAddress(address) {
  const walletElement = document.getElementById('company-wallet-address');
  if (address) {
    // Format address for display (show first 6 and last 4 characters)
    const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    walletElement.textContent = formattedAddress;
    walletElement.title = address; // Show full address on hover
  } else {
    walletElement.textContent = "Not connected";
  }
}

// Disconnect wallet and return to homepage
function disconnectWallet() {
  localStorage.removeItem("companyWalletAddress");
  localStorage.removeItem("collegeAuthStatus");
  window.location.href = "index.html";
}

// Initialize connection to blockchain contract
async function initializeBlockchainConnection() {
  try {
    // Connect to Ethereum network
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Replace with your actual contract address and ABI
    const contractAddress = "YOUR_CONTRACT_ADDRESS";
    const contractABI = [
      // Your contract ABI goes here
      // Example of Portfolio struct methods:
      "function getStudentPortfolio(address studentAddress) view returns (string, string[], string[], string[], string[])",
      "function getAllStudents() view returns (address[])",
      "function verifyCompanyAccess(address companyAddress, bool status) external",
      "function isCompanyVerified(address companyAddress) view returns (bool)"
    ];
    
    // Connect to the contract
    studentPortfolioContract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("Successfully connected to StudentPortfolio contract");
    
    // Check if company is already verified
    const isVerified = await checkCompanyVerification();
    if (isVerified) {
      collegAuthStatus = true;
      document.getElementById('college-auth-section').style.display = 'none';
      document.getElementById('search-container').style.display = 'block';
    }
    
  } catch (error) {
    console.error("Error initializing blockchain connection:", error);
    showAlert("Error connecting to blockchain contract. Please try again later.");
  }
}

// Check if company is verified by any college
async function checkCompanyVerification() {
  try {
    if (!studentPortfolioContract) await initializeBlockchainConnection();
    
    const companyAddress = localStorage.getItem("companyWalletAddress");
    const isVerified = await studentPortfolioContract.isCompanyVerified(companyAddress);
    return isVerified;
  } catch (error) {
    console.error("Error checking company verification:", error);
    return false;
  }
}

// Request authentication from college
async function requestCollegeAuth() {
  try {
    const collegeAddress = document.getElementById('college-address').value;
    if (!collegeAddress || !ethers.utils.isAddress(collegeAddress)) {
      showAlert("Please enter a valid college wallet address");
      return;
    }
    
    const authStatus = document.getElementById('auth-status');
    authStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Requesting authentication from college...`;
    
    // In a real implementation, this would send a request to the college
    // For now, we'll simulate the process
    
    if (!studentPortfolioContract) await initializeBlockchainConnection();
    
    // Simulating a blockchain call (in a real app, this would trigger an event for the college to respond)
    setTimeout(() => {
      // Simulate successful authentication
      authStatus.innerHTML = `<i class="fas fa-check-circle" style="color: #57a6ff"></i> Authentication successful! Redirecting to search...`;
      
      localStorage.setItem("collegeAuthStatus", "true");
      collegAuthStatus = true;
      
      setTimeout(() => {
        document.getElementById('college-auth-section').style.display = 'none';
        document.getElementById('search-container').style.display = 'block';
      }, 1500);
    }, 2000);
    
  } catch (error) {
    console.error("Error requesting college authentication:", error);
    const authStatus = document.getElementById('auth-status');
    authStatus.innerHTML = `<i class="fas fa-times-circle" style="color: #ff5757"></i> Authentication failed: ${error.message}`;
  }
}

// Search for students based on form criteria
function searchStudents(event) {
  event.preventDefault();
  
  if (!collegAuthStatus) {
    showAlert("Please authenticate with a college first");
    return;
  }
  
  const nameQuery = document.getElementById('search-name').value.trim().toLowerCase();
  const collegeQuery = document.getElementById('search-college').value.trim().toLowerCase();
  const skillsQuery = document.getElementById('search-skills').value.trim().toLowerCase();
  
  // Show loader
  document.getElementById('search-loader').style.display = 'block';
  document.getElementById('student-results').innerHTML = '';
  document.getElementById('no-results').style.display = 'none';
  
  // Call function to fetch students from blockchain with search criteria
  fetchStudentsFromBlockchain(nameQuery, collegeQuery, skillsQuery);
}

// Fetch student data from blockchain
async function fetchStudentsFromBlockchain(name = '', college = '', skills = '') {
  try {
    if (!studentPortfolioContract) await initializeBlockchainConnection();
    
    // Call the contract to get all student addresses
    const studentAddresses = await studentPortfolioContract.getAllStudents();
    
    const studentPromises = studentAddresses.map(async (address) => {
      try {
        // Get portfolio data for each student
        const portfolioData = await studentPortfolioContract.getStudentPortfolio(address);
        
        // The return format matches our struct: [name, academicAchievements[], projects[], extracurricularActivities[], certificates[]]
        return {
          id: address,
          name: portfolioData[0],
          academicAchievements: portfolioData[1],
          projects: portfolioData[2],
          extracurricularActivities: portfolioData[3],
          certificates: portfolioData[4]
        };
      } catch (err) {
        console.error(`Error fetching data for student ${address}:`, err);
        return null;
      }
    });
    
    const allStudents = await Promise.all(studentPromises);
    const validStudents = allStudents.filter(student => student !== null);
    
    // Filter based on search criteria
    const filteredStudents = validStudents.filter(student => {
      const nameMatch = name ? student.name.toLowerCase().includes(name) : true;
      
      // For college, we'll check academic achievements since we don't have a specific college field
      const collegeMatch = college ? 
        student.academicAchievements.some(achievement => 
          achievement.toLowerCase().includes(college)
        ) : true;
      
      // For skills, we'll check certificates and projects
      const skillsMatch = skills ? (
        student.certificates.some(cert => cert.toLowerCase().includes(skills)) ||
        student.projects.some(project => project.toLowerCase().includes(skills))
      ) : true;
      
      return nameMatch && collegeMatch && skillsMatch;
    });
    
    // Hide loader
    document.getElementById('search-loader').style.display = 'none';
    
    // Display results
    displayStudentResults(filteredStudents);
    
  } catch (error) {
    console.error("Error fetching student data:", error);
    document.getElementById('search-loader').style.display = 'none';
    showAlert("Error fetching student data from blockchain: " + error.message);
  }
}

// Display student search results
function displayStudentResults(students) {
  const resultsContainer = document.getElementById('student-results');
  resultsContainer.innerHTML = '';
  
  if (students.length === 0) {
    document.getElementById('no-results').style.display = 'block';
    return;
  }
  
  students.forEach(student => {
    // Get key skills from certificates and projects
    const allSkills = [...student.certificates, ...student.projects]
      .join(' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    const studentCard = document.createElement('div');
    studentCard.className = 'student-card';
    studentCard.innerHTML = `
      <div class="student-header">
        <h4>${student.name}</h4>
        <p>${student.academicAchievements[0] || 'Student'}</p>
      </div>
      <div class="student-body">
        <div class="student-info">
          <div class="info-label">Academic Achievements</div>
          <div class="info-value">${student.academicAchievements.length} records</div>
        </div>
        <div class="student-info">
          <div class="info-label">Projects</div>
          <div class="info-value">${student.projects.length} projects</div>
        </div>
        <div class="student-info">
          <div class="info-label">Certificates</div>
          <div class="info-value">${student.certificates.length} certificates</div>
        </div>
        <button class="view-details-btn" onclick="viewStudentDetails('${student.id}')">
          <i class="fas fa-eye"></i> View Full Profile
        </button>
      </div>
    `;
    
    resultsContainer.appendChild(studentCard);
  });
}

// View detailed student information
async function viewStudentDetails(studentId) {
  try {
    if (!studentPortfolioContract) await initializeBlockchainConnection();
    
    // Get student portfolio from blockchain
    const portfolioData = await studentPortfolioContract.getStudentPortfolio(studentId);
    
    const student = {
      id: studentId,
      name: portfolioData[0],
      academicAchievements: portfolioData[1],
      projects: portfolioData[2],
      extracurricularActivities: portfolioData[3],
      certificates: portfolioData[4]
    };
    
    // Populate modal with student details
    document.getElementById('modal-student-name').textContent = student.name;
    document.getElementById('modal-student-blockchain-id').textContent = student.id;
    
    // Populate academic achievements
    const academicList = document.getElementById('academic-list');
    academicList.innerHTML = '';
    
    if (student.academicAchievements && student.academicAchievements.length > 0) {
      student.academicAchievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'academic-item';
        achievementElement.innerHTML = `
          <div class="achievement-content">
            <p>${achievement}</p>
          </div>
          <div class="verification-badge">
            <i class="fas fa-check-circle"></i> Verified
          </div>
        `;
        academicList.appendChild(achievementElement);
      });
    } else {
      academicList.innerHTML = '<p>No academic achievements available</p>';
    }
    
    // Populate projects
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '';
    
    if (student.projects && student.projects.length > 0) {
      student.projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project-item';
        projectElement.innerHTML = `
          <div class="project-content">
            <p>${project}</p>
          </div>
          <div class="verification-badge">
            <i class="fas fa-check-circle"></i> Verified
          </div>
        `;
        projectList.appendChild(projectElement);
      });
    } else {
      projectList.innerHTML = '<p>No projects available</p>';
    }
    
    // Populate extracurricular activities
    const extracurricularList = document.getElementById('extracurricular-list');
    extracurricularList.innerHTML = '';
    
    if (student.extracurricularActivities && student.extracurricularActivities.length > 0) {
      student.extracurricularActivities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'extracurricular-item';
        activityElement.innerHTML = `
          <div class="activity-content">
            <p>${activity}</p>
          </div>
          <div class="verification-badge">
            <i class="fas fa-check-circle"></i> Verified
          </div>
        `;
        extracurricularList.appendChild(activityElement);
      });
    } else {
      extracurricularList.innerHTML = '<p>No extracurricular activities available</p>';
    }
    
    // Populate certificates
    const certificateList = document.getElementById('certificate-list');
    certificateList.innerHTML = '';
    
    if (student.certificates && student.certificates.length > 0) {
      student.certificates.forEach(cert => {
        const certElement = document.createElement('div');
        certElement.className = 'certificate-item';
        certElement.innerHTML = `
          <div class="certificate-content">
            <p>${cert}</p>
          </div>
          <div class="verification-badge">
            <i class="fas fa-check-circle"></i> Verified
          </div>
        `;
        certificateList.appendChild(certElement);
      });
    } else {
      certificateList.innerHTML = '<p>No certificates available</p>';
    }
    
    // Show modal
    document.getElementById('studentDetailsModal').style.display = 'flex';
    
    // Set first tab as active
    openTab({currentTarget: document.querySelector('.tab-button')}, 'tab-personal');
    
  } catch (error) {
    console.error("Error viewing student details:", error);
    showAlert("Error fetching student details from blockchain: " + error.message);
  }
}

// Close student details modal
function closeStudentDetails() {
  document.getElementById('studentDetailsModal').style.display = 'none';
}

// Tab navigation
function openTab(event, tabId) {
  // Hide all tab contents
  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
  }
  
  // Deactivate all tab buttons
  const tabButtons = document.getElementsByClassName('tab-button');
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove('active');
  }
  
  // Show the selected tab and activate the button
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Close modal if clicked outside
window.onclick = function(event) {
  const modal = document.getElementById('studentDetailsModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// Helper function to show alerts
function showAlert(message) {
  alert(message);
}

// Add CSS for new components
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .college-auth-section {
      background-color: #1a2332;
      border-radius: 10px;
      padding: 2rem;
      margin: 2rem 0;
      border: 1px solid #263141;
      animation: fadeInUp 1s ease;
    }
    
    .auth-form {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .request-auth-btn {
      background-color: #57a6ff;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      font-size: 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .request-auth-btn:hover {
      background-color: #4098f7;
    }
    
    .auth-status {
      margin-top: 1rem;
      color: #e0e8f0;
    }
    
    .academic-item, .project-item, .extracurricular-item, .certificate-item {
      background-color: #1a2332;
      border: 1px solid #263141;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .achievement-content, .project-content, .activity-content, .certificate-content {
      flex: 1;
    }
    
    .verification-badge {
      color: #57a6ff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .fa-spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});