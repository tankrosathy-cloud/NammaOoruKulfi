let currentFranchiseId = null;
function setCurrentFranchiseId(id) {
  currentFranchiseId = id;
}

function StoreProvider() {
  // useEffect simulation
  setTimeout(() => {
    console.log("useEffect running. currentFranchiseId:", currentFranchiseId);
  }, 0);
}

function AppShell() {
  setCurrentFranchiseId('F-123');
  StoreProvider();
}

AppShell();
