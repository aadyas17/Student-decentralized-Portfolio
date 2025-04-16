const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];
        alert("Connected wallet: " + walletAddress);
        // Redirect to portfolio form
        // window.location.href = "portfolio.html";
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("MetaMask not installed!");
    }
  };
  
  document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);
  