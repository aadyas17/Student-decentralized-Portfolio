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
          
          // Load initial data
          fetchStudentsFromBlockchain();
        } else {
          // If not connected, prompt user to connect
          connectWallet();
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        alert("Error connecting to blockchain. Please make sure MetaMask is installed and unlocked.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to use this feature.");
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
        
        // Load initial data
        fetchStudentsFromBlockchain();
        
      } catch (error) {
        console.error("Error connecting wallet:", error);
        if (error.code === -32002) {
          alert("MetaMask connection is pending. Please check your MetaMask popup.");
        } else {
          alert("Error connecting to MetaMask: " + error.message);
        }
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to use this feature.");
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
    window.location.href = "index.html";
  }
  
  // Search for students based on form criteria
  function searchStudents(event) {
    event.preventDefault();
    
    const nameQuery = document.getElementById('search-name').value.trim().toLowerCase();
    const collegeQuery = document.getElementById('search-college').value.trim().toLowerCase();
    const skillsQuery = document.getElementById('search-skills').value.trim().toLowerCase();
    const cgpaQuery = document.getElementById('search-cgpa').value;
    
    // Show loader
    document.getElementById('search-loader').style.display = 'block';
    document.getElementById('student-results').innerHTML = '';
    document.getElementById('no-results').style.display = 'none';
    
    // Call function to fetch students from blockchain with search criteria
    fetchStudentsFromBlockchain(nameQuery, collegeQuery, skillsQuery, cgpaQuery);
  }
  
  // Fetch student data from blockchain
  async function fetchStudentsFromBlockchain(name = '', college = '', skills = '', minCgpa = '') {
    try {
      // In a real implementation, this would call your blockchain integration
      // For now, we'll simulate with a timeout and mock data
      
      setTimeout(() => {
        // This is where you would integrate your actual blockchain data fetch
        // Replace this with actual blockchain integration code
        
        // Mock student data for demonstration
        const mockStudentData = getMockStudentData();
        
        // Filter based on search criteria
        const filteredStudents = mockStudentData.filter(student => {
          const nameMatch = name ? student.name.toLowerCase().includes(name) : true;
          const collegeMatch = college ? student.college.toLowerCase().includes(college) : true;
          
          const skillsMatch = skills ? skills.split(',').some(skill => 
            student.skills.some(s => s.toLowerCase().includes(skill.trim().toLowerCase()))
          ) : true;
          
          const cgpaMatch = minCgpa ? parseFloat(student.cgpa) >= parseFloat(minCgpa) : true;
          
          return nameMatch && collegeMatch && skillsMatch && cgpaMatch;
        });
        
        // Hide loader
        document.getElementById('search-loader').style.display = 'none';
        
        // Display results
        displayStudentResults(filteredStudents);
        
      }, 1500); // Simulated blockchain delay
      
    } catch (error) {
      console.error("Error fetching student data:", error);
      document.getElementById('search-loader').style.display = 'none';
      alert("Error fetching student data from blockchain: " + error.message);
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
      const studentCard = document.createElement('div');
      studentCard.className = 'student-card';
      studentCard.innerHTML = `
        <div class="student-header">
          <h4>${student.name}</h4>
          <p>${student.degree} - ${student.department}</p>
        </div>
        <div class="student-body">
          <div class="student-info">
            <div class="info-label">College/University</div>
            <div class="info-value">${student.college}</div>
          </div>
          <div class="student-info">
            <div class="info-label">CGPA</div>
            <div class="info-value">${student.cgpa}</div>
          </div>
          <div class="student-info">
            <div class="info-label">Key Skills</div>
            <div class="info-value">${student.skills.slice(0, 3).join(', ')}${student.skills.length > 3 ? '...' : ''}</div>
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
  function viewStudentDetails(studentId) {
    // In a real implementation, fetch specific student data from blockchain
    // For now, use mock data
    const students = getMockStudentData();
    const student = students.find(s => s.id === studentId);
    
    if (student) {
      // Populate modal with student details
      document.getElementById('modal-student-name').textContent = student.name;
      document.getElementById('modal-student-email').textContent = student.email;
      document.getElementById('modal-student-contact').textContent = student.contact;
      document.getElementById('modal-student-college').textContent = student.college;
      document.getElementById('modal-student-blockchain-id').textContent = student.id;
      document.getElementById('modal-student-degree').textContent = student.degree;
      document.getElementById('modal-student-department').textContent = student.department;
      document.getElementById('modal-student-cgpa').textContent = student.cgpa;
      document.getElementById('modal-student-year').textContent = student.year;
      
      // Populate semester results
      const semesterContainer = document.getElementById('semester-results');
      semesterContainer.innerHTML = '';
      
      if (student.semesters && student.semesters.length > 0) {
        student.semesters.forEach(semester => {
          const semesterElement = document.createElement('div');
          semesterElement.className = 'detail-item';
          semesterElement.innerHTML = `
            <h4>Semester ${semester.number}</h4>
            <div class="detail-label">GPA: ${semester.gpa}</div>
            <div class="detail-value">
              <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                ${semester.subjects.map(subject => `
                  <li>${subject.name}: ${subject.grade}</li>
                `).join('')}
              </ul>
            </div>
          `;
          semesterContainer.appendChild(semesterElement);
        });
      } else {
        semesterContainer.innerHTML = '<p>No semester results available</p>';
      }
      
      // Populate certificates
      const certificateList = document.getElementById('certificate-list');
      certificateList.innerHTML = '';
      
      if (student.certificates && student.certificates.length > 0) {
        student.certificates.forEach(cert => {
          const certElement = document.createElement('div');
          certElement.className = 'certificate-item';
          certElement.innerHTML = `
            <h4>${cert.name}</h4>
            <p>${cert.description}</p>
            <div class="certificate-issuer">
              <i class="fas fa-award"></i>
              <span>Issued by: ${cert.issuer}</span>
            </div>
            <div class="certificate-verification">
              <i class="fas fa-check-circle"></i> Verified by ${cert.verifiedBy}
            </div>
          `;
          certificateList.appendChild(certElement);
        });
      } else {
        certificateList.innerHTML = '<p>No certificates available</p>';
      }
      
      // Populate projects
      const projectList = document.getElementById('project-list');
      projectList.innerHTML = '';
      
      if (student.projects && student.projects.length > 0) {
        student.projects.forEach(project => {
          const projectElement = document.createElement('div');
          projectElement.className = 'project-item';
          projectElement.innerHTML = `
            <h4>${project.name}</h4>
            <div class="project-description">${project.description}</div>
            <div class="project-tech">
              ${project.technologies.map(tech => `
                <span class="tech-tag">${tech}</span>
              `).join('')}
            </div>
          `;
          projectList.appendChild(projectElement);
        });
      } else {
        projectList.innerHTML = '<p>No projects available</p>';
      }
      
      // Populate skills
      const skillsContainer = document.getElementById('skills-container');
      skillsContainer.innerHTML = '';
      
      if (student.skills && student.skills.length > 0) {
        const skillsElement = document.createElement('div');
        skillsElement.className = 'detail-grid';
        
        student.skills.forEach(skill => {
          const skillItem = document.createElement('div');
          skillItem.className = 'detail-item';
          skillItem.innerHTML = `
            <div class="detail-value">${skill}</div>
            <div class="detail-label">
              <div class="verification-badge" style="margin-top: 8px;">
                <i class="fas fa-shield-check"></i> Verified Skill
              </div>
            </div>
          `;
          skillsElement.appendChild(skillItem);
        });
        
        skillsContainer.appendChild(skillsElement);
      } else {
        skillsContainer.innerHTML = '<p>No skills available</p>';
      }
      
      // Show modal
      document.getElementById('studentDetailsModal').style.display = 'flex';
      
      // Set first tab as active
      openTab({currentTarget: document.querySelector('.tab-button')}, 'tab-personal');
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
  
  // Mock student data function
  // In a real implementation, this would be replaced by blockchain data
  function getMockStudentData() {
    return [
      {
        id: "0x7a58c0be32bce2975f647a0bd0ed0b10a0ce9f91",
        name: "Alex Johnson",
        email: "alex.johnson@university.edu",
        contact: "+1 (555) 123-4567",
        college: "University of Technology",
        degree: "B.Tech",
        department: "Computer Science",
        year: "3rd Year",
        cgpa: "8.7",
        skills: ["Java", "Python", "Blockchain", "Machine Learning", "Database Management"],
        semesters: [
          {
            number: 1,
            gpa: "8.5",
            subjects: [
              { name: "Introduction to Programming", grade: "A" },
              { name: "Mathematics I", grade: "A-" },
              { name: "Physics", grade: "B+" },
              { name: "English Communication", grade: "A" }
            ]
          },
          {
            number: 2,
            gpa: "8.7",
            subjects: [
              { name: "Data Structures", grade: "A" },
              { name: "Mathematics II", grade: "B+" },
              { name: "Digital Electronics", grade: "A-" },
              { name: "Professional Ethics", grade: "A" }
            ]
          },
          {
            number: 3,
            gpa: "8.9",
            subjects: [
              { name: "Object-Oriented Programming", grade: "A+" },
              { name: "Computer Networks", grade: "A" },
              { name: "Algorithms", grade: "A-" },
              { name: "Database Systems", grade: "B+" }
            ]
          }
        ],
        certificates: [
          {
            name: "Introduction to Blockchain Technology",
            description: "Comprehensive course covering blockchain fundamentals, Bitcoin, Ethereum, and smart contracts",
            issuer: "Coursera",
            verifiedBy: "University Blockchain Council"
          },
          {
            name: "Advanced Python Programming",
            description: "Mastering Python programming with focus on data structures and algorithms",
            issuer: "Udemy",
            verifiedBy: "Department of Computer Science"
          },
          {
            name: "Web Development Bootcamp",
            description: "Full-stack web development with MERN stack",
            issuer: "freeCodeCamp",
            verifiedBy: "Department Faculty"
          }
        ],
        projects: [
          {
            name: "Decentralized Student Record System",
            description: "Blockchain-based solution for storing and verifying academic credentials with Ethereum smart contracts",
            technologies: ["Solidity", "Web3.js", "React", "Node.js"]
          },
          {
            name: "Intelligent Tutoring System",
            description: "AI-powered learning platform that adapts to individual student needs",
            technologies: ["Python", "TensorFlow", "Flask", "MongoDB"]
          }
        ]
      },
      {
        id: "0x3e82c7eb7cb4a80e8d2fe250fe6a3782968a5aa4",
        name: "Sarah Williams",
        email: "sarah.williams@techacademy.edu",
        contact: "+1 (555) 987-6543",
        college: "Tech Academy Institute",
        degree: "B.Sc",
        department: "Data Science",
        year: "4th Year",
        cgpa: "9.2",
        skills: ["Python", "R", "Data Analysis", "Machine Learning", "Deep Learning", "SQL"],
        semesters: [
          {
            number: 1,
            gpa: "9.0",
            subjects: [
              { name: "Introduction to Computing", grade: "A" },
              { name: "Calculus", grade: "A" },
              { name: "Statistics I", grade: "A+" },
              { name: "Technical Writing", grade: "A-" }
            ]
          },
          {
            number: 2,
            gpa: "9.1",
            subjects: [
              { name: "Programming for Data Science", grade: "A+" },
              { name: "Linear Algebra", grade: "A" },
              { name: "Statistics II", grade: "A" },
              { name: "Data Visualization", grade: "A-" }
            ]
          }
        ],
        certificates: [
          {
            name: "Deep Learning Specialization",
            description: "Five-course specialization covering neural networks, hyperparameter tuning, and machine learning projects",
            issuer: "Coursera",
            verifiedBy: "Department of Data Science"
          },
          {
            name: "Big Data Analysis with Hadoop",
            description: "Processing large datasets using Hadoop and MapReduce",
            issuer: "edX",
            verifiedBy: "Tech Academy Faculty"
          }
        ],
        projects: [
          {
            name: "Predictive Healthcare Analytics",
            description: "ML model to predict potential health risks based on patient data",
            technologies: ["Python", "TensorFlow", "Pandas", "Scikit-learn"]
          },
          {
            name: "Stock Market Analysis Tool",
            description: "Real-time stock market analysis and prediction system",
            technologies: ["R", "Shiny", "ggplot2", "quantmod"]
          }
        ]
      },
      {
        id: "0xf92c94f3d57d0c6ee3e752f79f91c132d7c152f7",
        name: "Michael Chen",
        email: "michael.chen@engcollege.edu",
        contact: "+1 (555) 456-7890",
        college: "Engineering College of Innovation",
        degree: "B.E",
        department: "Electronics Engineering",
        year: "3rd Year",
        cgpa: "8.5",
        skills: ["Circuit Design", "VLSI", "IoT", "Embedded Systems", "Arduino", "C++"],
        semesters: [
          {
            number: 1,
            gpa: "8.3",
            subjects: [
              { name: "Basic Electronics", grade: "A-" },
              { name: "Engineering Mathematics", grade: "B+" },
              { name: "Physics for Engineers", grade: "A" },
              { name: "Workshop Practice", grade: "A" }
            ]
          },
          {
            number: 2,
            gpa: "8.5",
            subjects: [
              { name: "Digital Logic Design", grade: "A" },
              { name: "Electric Circuits", grade: "A-" },
              { name: "Programming for Engineers", grade: "B+" },
              { name: "Communication Skills", grade: "A" }
            ]
          }
        ],
        certificates: [
          {
            name: "IoT Fundamentals",
            description: "Building connected devices and IoT solutions",
            issuer: "Cisco Networking Academy",
            verifiedBy: "Engineering College Faculty"
          },
          {
            name: "PCB Design and Fabrication",
            description: "Comprehensive course on PCB design principles and manufacturing",
            issuer: "Electronics Engineering Association",
            verifiedBy: "Department of Electronics"
          }
        ],
        projects: [
          {
            name: "Smart Home Automation System",
            description: "IoT-based home automation system with voice control and energy monitoring",
            technologies: ["Arduino", "ESP8266", "MQTT", "Node-RED"]
          },
          {
            name: "Wearable Health Monitor",
            description: "Wearable device for real-time health parameter monitoring",
            technologies: ["Embedded C", "BLE", "PCB Design", "3D Printing"]
          }
        ]
      }
    ];
  }
  
  // For a real implementation, you would include your blockchain integration code here
  // Connect to Ethereum blockchain and smart contracts
  async function connectToBlockchain() {
    // This is where you would add your actual blockchain connection code
    // For example:
    
    /*
    // Sample code for connecting to Ethereum using ethers.js
    // Note: You would need to include ethers.js in your project
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Connect to your deployed smart contract
    const contractAddress = "YOUR_CONTRACT_ADDRESS";
    const contractABI = [...]; // Your contract ABI
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    return { provider, signer, contract };
    */
    
    // For now, return a placeholder
    return { connected: true };
  }
  
  // Function to fetch actual student data from blockchain
  async function getStudentDataFromBlockchain(studentId) {
    // Example implementation:
    
    /*
    try {
      // Connect to blockchain
      const { contract } = await connectToBlockchain();
      
      // Call smart contract function to get student data
      const studentData = await contract.getStudentDetails(studentId);
      
      // Process and return the data
      return {
        id: studentId,
        name: studentData.name,
        email: studentData.email,
        // ... process other fields
      };
    } catch (error) {
      console.error("Error fetching student data from blockchain:", error);
      throw error;
    }
    */
    
    // For demo purposes, return mock data
    const students = getMockStudentData();
    return students.find(s => s.id === studentId) || null;
  }
  
  // Function to fetch all students from blockchain
  async function getAllStudentsFromBlockchain() {
    // Example implementation:
    
    /*
    try {
      // Connect to blockchain
      const { contract } = await connectToBlockchain();
      
      // Call smart contract function to get all student IDs
      const studentIds = await contract.getAllStudentIds();
      
      // Fetch details for each student
      const studentsPromises = studentIds.map(id => getStudentDataFromBlockchain(id));
      const students = await Promise.all(studentsPromises);
      
      return students;
    } catch (error) {
      console.error("Error fetching all students from blockchain:", error);
      throw error;
    }
    */
    
    // For demo purposes, return mock data
    return getMockStudentData();
  }