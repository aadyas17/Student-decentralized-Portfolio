 // Function to handle student login
 function openStudentLogin() {
    // Redirect to the student login page with MetaMask
    window.location.href = "second.html";
  }
  
  // Function to open college modal
  function openCollegeModal() {
    document.getElementById("collegeModal").style.display = "flex";

  }
  
  // Function for company login
  function openCompanyLogin() {
    // Redirect to company view page
    window.location.href = "company.html";
  }
  
  // Function to close modals
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }
  
  // Function to handle role selection and login
  function loginWithRole(role) {
    // Set all radio buttons to unchecked
    const roleOptions = document.querySelectorAll('input[name="collegeRole"]');
    roleOptions.forEach(option => {
      option.checked = false;
    });
    
    // Check the selected role
    const selectedOption = document.querySelector(`input[value="${role}"]`);
    if (selectedOption) {
      selectedOption.checked = true;
    }
    
    // Store the selected role in localStorage for use after wallet connection
    localStorage.setItem("selectedCollegeRole", role);
  }
  
  // Function to connect wallet for college roles
  async function connectCollegeWallet() {
    const selectedRole = localStorage.getItem("selectedCollegeRole");
    
    if (!selectedRole) {
      alert("Please select a role first");
      return;
    }
    
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const walletAddress = accounts[0];
        console.log("Connected wallet:", walletAddress);
        
        // Store wallet address and role in localStorage or session
        localStorage.setItem("walletAddress", walletAddress);
        localStorage.setItem("userRole", selectedRole);
        
        // Redirect to college dashboard
        window.location.href = "college.html";
        
      } catch (error) {
        console.error("Error connecting wallet:", error);
        if (error.code === -32002) {
          alert("MetaMask connection is pending. Please check your MetaMask popup.");
        } else {
          alert("Error connecting to MetaMask: " + error.message);
        }
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  }
  
  // Close modal if clicked outside
  window.onclick = function(event) {
    const collegeModal = document.getElementById("collegeModal");
    if (event.target === collegeModal) {
      collegeModal.style.display = "none";
    }
  }