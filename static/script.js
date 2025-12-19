// DOM Elements
const red = document.getElementById("red");
const yellow = document.getElementById("yellow");
const green = document.getElementById("green");
const walkSignal = document.getElementById("walkSignal");
const stopSignal = document.getElementById("stopSignal");
const stateText = document.getElementById("state");
const timerText = document.getElementById("timer");
const statusDot = document.getElementById("statusDot");
const requestCount = document.getElementById("requestCount");
const cycleCount = document.getElementById("cycleCount");
const stateChanges = document.getElementById("stateChanges");
const lastChange = document.getElementById("lastChange");
const systemHealth = document.getElementById("systemHealth");
const systemStatus = document.getElementById("systemStatus");
const uptime = document.getElementById("uptime");
const cycleProgress = document.getElementById("cycleProgress");
const pedestrianBtn = document.getElementById("pedestrianBtn");
const suspendBtn = document.getElementById("suspendBtn");
const resetBtn = document.getElementById("resetBtn");
const lastUpdate = document.getElementById("lastUpdate");
const connectionStatus = document.getElementById("connectionStatus");
const dataPoints = document.getElementById("dataPoints");
const requestsRate = document.getElementById("requestsRate");
const cycleTime = document.getElementById("cycleTime");
const peakHour = document.getElementById("peakHour");
const avgWait = document.getElementById("avgWait");
const suspendDuration = document.getElementById("suspendDuration");
const durationValue = document.getElementById("durationValue");
const suspensionModal = document.getElementById("suspensionModal");
const suspensionMessage = document.getElementById("suspensionMessage");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const confirmSuspendBtn = document.getElementById("confirmSuspendBtn");
const stateOptions = document.getElementById("stateOptions");
const timeSelector = document.getElementById("timeSelector");
const viewSelector = document.getElementById("viewSelector");

// Data Storage
let stateHistory = [];
let pedestrianHistory = [];
let totalRequests = 0;
let totalCycles = 0;
let totalStateChanges = 0;
let lastPedestrianTime = null;
let systemStartTime = Date.now();
let isSuspended = false;
let selectedSuspendState = 'red';
let timeRange = '5m';
let currentView = 'requests';

// Chart Instances
let stateChart = null;
let pedestrianChart = null;

// Initialize Charts with triangle markers and lines
function initializeCharts() {
    // State Distribution Chart with triangle markers
    const stateCtx = document.getElementById('stateChart').getContext('2d');
    stateChart = new Chart(stateCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Red State',
                    data: [],
                    borderColor: '#FF4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.2,
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#FF4444',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    showLine: true
                },
                {
                    label: 'Yellow State',
                    data: [],
                    borderColor: '#FFDD44',
                    backgroundColor: 'rgba(255, 221, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.2,
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#FFDD44',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    showLine: true
                },
                {
                    label: 'Green State',
                    data: [],
                    borderColor: '#44FF44',
                    backgroundColor: 'rgba(68, 255, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.2,
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#44FF44',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y === 100 ? 'Active' : 'Inactive';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0c8ff',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0c8ff',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value === 100 ? 'Active' : '';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            elements: {
                line: {
                    tension: 0.2
                }
            }
        }
    });

    // Pedestrian Activity Chart as line chart
    const pedestrianCtx = document.getElementById('pedestrianChart').getContext('2d');
    pedestrianChart = new Chart(pedestrianCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pedestrian Requests',
                    data: [],
                    borderColor: '#4dabf7',
                    backgroundColor: 'rgba(77, 171, 247, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointStyle: 'circle',
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#4dabf7',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    showLine: true
                },
                {
                    label: 'Average Wait Time',
                    data: [],
                    borderColor: '#FFD43B',
                    backgroundColor: 'rgba(255, 212, 59, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointStyle: 'circle',
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#FFD43B',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    showLine: true,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 0) {
                                    label += context.parsed.y + ' requests';
                                } else {
                                    label += context.parsed.y.toFixed(1) + ' seconds';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0c8ff',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0c8ff',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

// Update Charts
function updateCharts() {
    // Update State Chart with triangle markers
    if (stateHistory.length > 0) {
        const recentData = getRecentStateData(timeRange);
        stateChart.data.labels = recentData.labels;
        stateChart.data.datasets[0].data = recentData.red;
        stateChart.data.datasets[1].data = recentData.yellow;
        stateChart.data.datasets[2].data = recentData.green;
        stateChart.update('none');
    }
    
    // Update Pedestrian Chart as line chart
    if (pedestrianHistory.length > 0) {
        const pedestrianData = getRecentPedestrianData(timeRange);
        pedestrianChart.data.labels = pedestrianData.labels;
        pedestrianChart.data.datasets[0].data = pedestrianData.requests;
        pedestrianChart.data.datasets[1].data = pedestrianData.waitTimes;
        pedestrianChart.update('none');
        
        // Update stats
        updatePedestrianStats(pedestrianData);
    }
}

function getRecentStateData(range) {
    const now = Date.now();
    let cutoff;
    
    switch(range) {
        case '5m':
            cutoff = now - 5 * 60 * 1000;
            break;
        case '15m':
            cutoff = now - 15 * 60 * 1000;
            break;
        case '1h':
            cutoff = now - 60 * 60 * 1000;
            break;
        default:
            cutoff = now - 5 * 60 * 1000;
    }
    
    const filtered = stateHistory.filter(item => item.timestamp >= cutoff);
    
    // Sample data for better visualization
    const sampleRate = Math.max(1, Math.floor(filtered.length / 20));
    const sampledData = filtered.filter((_, index) => index % sampleRate === 0);
    
    return {
        labels: sampledData.map(item => {
            const date = new Date(item.timestamp);
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }),
        red: sampledData.map(item => item.state === 'CAR_RED' ? 100 : 0),
        yellow: sampledData.map(item => item.state === 'CAR_YELLOW' ? 100 : 0),
        green: sampledData.map(item => (item.state === 'CAR_GREEN' || item.state === 'PENDING') ? 100 : 0)
    };
}

function getRecentPedestrianData(range) {
    const now = Date.now();
    let cutoff;
    
    switch(range) {
        case '5m':
            cutoff = now - 5 * 60 * 1000;
            break;
        case '15m':
            cutoff = now - 15 * 60 * 1000;
            break;
        case '1h':
            cutoff = now - 60 * 60 * 1000;
            break;
        default:
            cutoff = now - 5 * 60 * 1000;
    }
    
    const filtered = pedestrianHistory.filter(item => item.timestamp >= cutoff);
    
    if (filtered.length === 0) {
        return {
            labels: [],
            requests: [],
            waitTimes: []
        };
    }
    
    // Group by 1-minute intervals for smooth lines
    const intervalData = {};
    filtered.forEach(item => {
        const date = new Date(item.timestamp);
        // Round to nearest minute
        const timeKey = date.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        
        if (!intervalData[timeKey]) {
            intervalData[timeKey] = {
                count: 0,
                waitTimes: []
            };
        }
        
        intervalData[timeKey].count++;
        if (item.waitTime > 0) {
            intervalData[timeKey].waitTimes.push(item.waitTime);
        }
    });
    
    // Sort by time and prepare data
    const sortedKeys = Object.keys(intervalData).sort();
    const labels = sortedKeys.map(key => {
        const date = new Date(key);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const requests = sortedKeys.map(key => intervalData[key].count);
    const waitTimes = sortedKeys.map(key => {
        const waits = intervalData[key].waitTimes;
        return waits.length > 0 ? 
            Math.round(waits.reduce((a, b) => a + b, 0) / waits.length * 10) / 10 : 0;
    });
    
    return {
        labels: labels,
        requests: requests,
        waitTimes: waitTimes
    };
}

function updatePedestrianStats(data) {
    if (data.requests.length > 0) {
        // Find peak time
        const maxRequests = Math.max(...data.requests);
        const maxIndex = data.requests.indexOf(maxRequests);
        peakHour.textContent = data.labels[maxIndex];
        
        // Calculate average wait time
        const allWaitTimes = [];
        pedestrianHistory.forEach(item => {
            if (item.waitTime > 0) {
                allWaitTimes.push(item.waitTime);
            }
        });
        
        if (allWaitTimes.length > 0) {
            const avg = allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length;
            avgWait.textContent = `${avg.toFixed(1)}s`;
        } else {
            avgWait.textContent = "0s";
        }
    } else {
        peakHour.textContent = "--:--";
        avgWait.textContent = "--s";
    }
}

// System Functions
function resetLights() {
    [red, yellow, green].forEach(light => {
        light.classList.remove("active");
    });
    walkSignal.classList.remove("active");
    stopSignal.classList.remove("active");
}

function updateUI(data) {
    if (isSuspended) return;
    
    resetLights();
    statusDot.classList.add("active");
    connectionStatus.textContent = "Connected";

    // Store history
    const historyEntry = {
        timestamp: Date.now(),
        state: data.state,
        timer: data.timer
    };
    stateHistory.push(historyEntry);
    
    // Keep history manageable
    if (stateHistory.length > 1000) {
        stateHistory = stateHistory.slice(-1000);
    }
    
    dataPoints.textContent = stateHistory.length;

    // Update based on state
    if (data.state === "CAR_GREEN") {
        green.classList.add("active");
        stopSignal.classList.add("active");
        stateText.innerHTML = `<i class="fas fa-car"></i> Vehicles: GREEN &nbsp;&nbsp; <i class="fas fa-person-walking"></i> Pedestrians: STOP`;
        stateText.style.color = "#51cf66";
        
    } else if (data.state === "PENDING") {
        green.classList.add("active");
        yellow.classList.add("active");
        stopSignal.classList.add("active");
        stateText.innerHTML = `<i class="fas fa-clock"></i> Pedestrian Request Pending`;
        stateText.style.color = "#ffd43b";
        
    } else if (data.state === "CAR_YELLOW") {
        yellow.classList.add("active");
        stateText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Vehicles: YELLOW - Prepare to Stop`;
        stateText.style.color = "#ffd43b";
        
    } else if (data.state === "CAR_RED") {
        red.classList.add("active");
        walkSignal.classList.add("active");
        stateText.innerHTML = `<i class="fas fa-person-walking"></i> Pedestrians: WALK`;
        stateText.style.color = "#ff6b6b";
    }

    // Update timer with visual feedback
    const timer = data.timer;
    timerText.textContent = timer;
    
    if (timer <= 3) {
        timerText.style.color = "#ff6b6b";
        timerText.style.animation = "pulse 1s infinite";
    } else if (timer <= 10) {
        timerText.style.color = "#ffd43b";
        timerText.style.animation = "none";
    } else {
        timerText.style.color = "#51cf66";
        timerText.style.animation = "none";
    }

    // Update statistics from backend if available
    if (data.cycles_completed !== undefined) {
        cycleCount.textContent = data.cycles_completed;
        totalCycles = data.cycles_completed;
    }
    
    if (data.state_changes !== undefined) {
        stateChanges.textContent = data.state_changes;
        totalStateChanges = data.state_changes;
        const lastChangeTime = new Date();
        lastChange.textContent = lastChangeTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    if (data.avg_cycle_time !== undefined) {
        cycleTime.textContent = `Avg: ${data.avg_cycle_time}s`;
    }

    // Update uptime
    const currentTime = Date.now();
    const elapsed = Math.floor((currentTime - systemStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    uptime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress bar
    if (data.cycle_progress !== undefined) {
        const progress = data.cycle_progress || 0;
        cycleProgress.style.width = `${progress}%`;
    }

    // Update system health
    const health = calculateSystemHealth(data);
    systemHealth.textContent = `${health}%`;
    systemHealth.style.color = health >= 80 ? "#51cf66" : health >= 50 ? "#ffd43b" : "#ff6b6b";
    systemStatus.textContent = health >= 80 ? "Excellent" : health >= 50 ? "Good" : "Needs Attention";

    // Update last update time
    const now = new Date();
    lastUpdate.textContent = now.toLocaleTimeString();
    
    // Update charts
    updateCharts();
}

function calculateSystemHealth(data) {
    let health = 100;
    
    // Penalize for long pending times
    if (data.state === "PENDING" && data.timer > 5) {
        health -= 20;
    }
    
    // Penalize for high request rate with no response
    if (data.pedestrian && data.timer > 15) {
        health -= 30;
    }
    
    // Bonus for quick cycles
    if (data.avg_cycle_time && data.avg_cycle_time < 20) {
        health += 10;
    }
    
    return Math.max(0, Math.min(100, health));
}

function fetchState() {
    fetch("/state")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            updateUI(data);
        })
        .catch(error => {
            console.error('Error fetching state:', error);
            handleConnectionError();
        });
}

function handlePedestrianRequest() {
    if (isSuspended) {
        showNotification("System is suspended. Please resume first.", "warning");
        return;
    }
    
    // Visual feedback
    pedestrianBtn.classList.add('pressed');
    const originalHTML = pedestrianBtn.innerHTML;
    pedestrianBtn.innerHTML = '<i class="fas fa-check"></i><span>Request Sent</span>';
    
    // Disable button temporarily
    pedestrianBtn.disabled = true;
    
    fetch("/pedestrian", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Pedestrian request successful:', data);
        
        // Update request count
        totalRequests++;
        requestCount.textContent = totalRequests;
        requestsRate.textContent = `Today: ${totalRequests}`;
        
        // Record in history with wait time
        const currentState = stateHistory[stateHistory.length - 1];
        const waitTime = currentState && currentState.state === "CAR_GREEN" ? currentState.timer : 0;
        
        pedestrianHistory.push({
            timestamp: Date.now(),
            waitTime: waitTime
        });
        
        // Keep pedestrian history manageable
        if (pedestrianHistory.length > 500) {
            pedestrianHistory = pedestrianHistory.slice(-500);
        }
        
        showNotification("Pedestrian crossing request registered", "success");
        
        // Refresh state to see changes
        setTimeout(() => fetchState(), 1000);
    })
    .catch(error => {
        console.error('Error sending pedestrian request:', error);
        showNotification("Failed to send request. Please try again.", "error");
    })
    .finally(() => {
        // Reset button after 2 seconds
        setTimeout(() => {
            pedestrianBtn.classList.remove('pressed');
            pedestrianBtn.innerHTML = originalHTML;
            pedestrianBtn.disabled = false;
        }, 2000);
    });
}

// Suspension Functions
function handleSuspendRequest() {
    if (!isSuspended) {
        showSuspensionModal();
    } else {
        resumeSystem();
    }
}

function showSuspensionModal() {
    suspensionMessage.textContent = "The system is about to be suspended. Traffic lights will stop cycling.";
    suspensionModal.style.display = 'flex';
    
    // Reset selection
    document.querySelectorAll('.state-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector('.state-option[data-state="red"]').classList.add('selected');
    selectedSuspendState = 'red';
}

function closeModal() {
    suspensionModal.style.display = 'none';
}

function confirmSuspend() {
    const duration = parseInt(suspendDuration.value);
    suspendSystem(duration);
    closeModal();
}

function suspendSystem(durationMinutes) {
    fetch("/suspend", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            duration: durationMinutes,
            state: selectedSuspendState
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isSuspended = true;
            suspendBtn.classList.add('suspended');
            suspendBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume System</span>';
            
            showNotification(`System suspended for ${durationMinutes} minutes. Lights set to ${selectedSuspendState.toUpperCase()}`, "info");
            
            // Update UI for suspension
            resetLights();
            stateText.innerHTML = `<i class="fas fa-pause-circle"></i> SYSTEM SUSPENDED`;
            stateText.style.color = "#ff922b";
            timerText.textContent = "SUSP";
            timerText.style.color = "#ff922b";
            statusDot.style.background = "#ff922b";
            
            // Set lights based on selected state
            if (selectedSuspendState === 'red') {
                red.classList.add('active');
            } else if (selectedSuspendState === 'yellow') {
                yellow.classList.add('active');
            } else if (selectedSuspendState === 'green') {
                green.classList.add('active');
            } else if (selectedSuspendState === 'flashing') {
                // Flashing yellow
                let flashInterval = setInterval(() => {
                    if (isSuspended) {
                        yellow.classList.toggle('active');
                    } else {
                        clearInterval(flashInterval);
                    }
                }, 500);
            }
            
            // Auto-resume after duration
            setTimeout(() => {
                if (isSuspended) {
                    resumeSystem();
                }
            }, durationMinutes * 60 * 1000);
        } else {
            showNotification(data.message || "Failed to suspend system", "error");
        }
    })
    .catch(error => {
        console.error('Error suspending system:', error);
        showNotification("Failed to suspend system", "error");
    });
}

function resumeSystem() {
    fetch("/resume", {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isSuspended = false;
            suspendBtn.classList.remove('suspended');
            suspendBtn.innerHTML = '<i class="fas fa-pause"></i><span>Suspend System</span>';
            
            showNotification("System resumed. Normal operation restored.", "success");
            
            // Force refresh
            fetchState();
        } else {
            showNotification(data.message || "Failed to resume system", "error");
        }
    })
    .catch(error => {
        console.error('Error resuming system:', error);
        showNotification("Failed to resume system", "error");
    });
}

function handleResetRequest() {
    if (confirm("Are you sure you want to reset the system? This will clear all statistics and graphs.")) {
        fetch("/reset", {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset local data
                stateHistory = [];
                pedestrianHistory = [];
                totalRequests = 0;
                totalCycles = 0;
                totalStateChanges = 0;
                systemStartTime = Date.now();
                
                // Reset UI
                requestCount.textContent = "0";
                cycleCount.textContent = "0";
                stateChanges.textContent = "0";
                systemHealth.textContent = "100%";
                systemStatus.textContent = "Normal";
                dataPoints.textContent = "0";
                requestsRate.textContent = "Today: 0";
                peakHour.textContent = "--:--";
                avgWait.textContent = "--s";
                
                // Reset charts
                if (stateChart && pedestrianChart) {
                    stateChart.data.labels = [];
                    stateChart.data.datasets.forEach(dataset => dataset.data = []);
                    stateChart.update();
                    
                    pedestrianChart.data.labels = [];
                    pedestrianChart.data.datasets.forEach(dataset => dataset.data = []);
                    pedestrianChart.update();
                }
                
                showNotification("System has been reset successfully.", "success");
                
                // Refresh state
                fetchState();
            } else {
                showNotification(data.message || "Failed to reset system", "error");
            }
        })
        .catch(error => {
            console.error('Error resetting system:', error);
            showNotification("Failed to reset system", "error");
        });
    }
}

// Utility Functions
function handleConnectionError() {
    stateText.innerHTML = `<i class="fas fa-exclamation-circle"></i> Connection Error`;
    stateText.style.color = "#ff6b6b";
    statusDot.classList.remove("active");
    connectionStatus.textContent = "Disconnected";
    
    // Try to reconnect after 5 seconds
    setTimeout(fetchState, 5000);
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function changeTimeRange(range) {
    timeRange = range;
    
    // Update button states
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.range === range) {
            btn.classList.add('active');
        }
    });
    
    // Update chart immediately
    updateCharts();
}

function changeView(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide datasets based on view
    if (pedestrianChart) {
        if (view === 'requests') {
            pedestrianChart.data.datasets[0].hidden = false;
            pedestrianChart.data.datasets[1].hidden = true;
        } else {
            pedestrianChart.data.datasets[0].hidden = true;
            pedestrianChart.data.datasets[1].hidden = false;
        }
        pedestrianChart.update();
    }
}

// Initialize
function init() {
    // Initialize charts with triangle markers and lines
    initializeCharts();
    
    // Event Listeners
    pedestrianBtn.addEventListener('click', handlePedestrianRequest);
    suspendBtn.addEventListener('click', handleSuspendRequest);
    resetBtn.addEventListener('click', handleResetRequest);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    confirmSuspendBtn.addEventListener('click', confirmSuspend);
    
    // State options
    document.querySelectorAll('.state-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.state-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSuspendState = btn.dataset.state;
        });
    });
    
    // Time selector
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeTimeRange(btn.dataset.range);
        });
    });
    
    // View selector
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeView(btn.dataset.view);
        });
    });
    
    // Duration slider
    suspendDuration.addEventListener('input', function() {
        durationValue.textContent = this.value + ' min';
    });
    
    // Initial fetch
    fetchState();
    
    // Update every second
    const stateUpdateInterval = setInterval(fetchState, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            handlePedestrianRequest();
        } else if (e.code === 'Escape') {
            if (suspensionModal.style.display === 'flex') {
                closeModal();
            }
        }
    });
    
    // Add notification and chart styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 10000;
            transform: translateY(-100%);
            opacity: 0;
            transition: all 0.3s ease;
            border-left: 4px solid #4dabf7;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        .notification.success {
            border-left-color: #40c057;
        }
        .notification.error {
            border-left-color: #ff6b6b;
        }
        .notification.warning {
            border-left-color: #ffd43b;
        }
        .notification.info {
            border-left-color: #4dabf7;
        }
        .notification i {
            font-size: 1.2rem;
        }
        .notification.success i {
            color: #40c057;
        }
        .notification.error i {
            color: #ff6b6b;
        }
        .notification.warning i {
            color: #ffd43b;
        }
        .notification.info i {
            color: #4dabf7;
        }
        
        /* Ensure buttons are properly styled when disabled */
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        button:disabled:hover {
            transform: none !important;
            box-shadow: none !important;
        }
        
        /* Pulse animation for timer */
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .pulse {
            animation: pulse 1s infinite;
        }
    `;
    document.head.appendChild(style);
    
    // Add offline/online detection
    window.addEventListener('online', () => {
        showNotification("Back online. Reconnecting...", "success");
        fetchState();
    });
    
    window.addEventListener('offline', () => {
        showNotification("Network connection lost. Attempting to reconnect...", "warning");
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (stateUpdateInterval) {
            clearInterval(stateUpdateInterval);
        }
    });
}

// Start the system when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}