/**
 * Risk Meter Component
 * Displays and animates the player's risk profile
 */
function displayRiskProfile(profileData) {
    // Hide loading spinner
    document.getElementById('risk-loading').classList.add('d-none');
    document.getElementById('risk-profile-content').classList.remove('d-none');
    
    // Get risk profile elements
    const riskMeterFill = document.getElementById('risk-meter-fill');
    const riskProfileDetails = document.getElementById('risk-profile-details');
    const riskProfileType = document.getElementById('risk-profile-type');
    const riskAnalysisText = document.getElementById('risk-analysis-text');
    
    // Reveal risk profile details
    riskProfileDetails.classList.remove('d-none');
    
    // Update risk meter fill based on risk score
    const riskScore = profileData.riskScore;
    riskMeterFill.style.width = `${riskScore}%`;
    
    // Determine color class based on risk profile
    let colorClass = '';
    if (riskScore < 33) {
        colorClass = 'text-success';
    } else if (riskScore < 66) {
        colorClass = 'text-warning';
    } else {
        colorClass = 'text-danger';
    }
    
    // Update profile type with appropriate color
    riskProfileType.textContent = profileData.riskProfile;
    riskProfileType.className = `fw-bold ${colorClass}`;
    
    // Update analysis text
    riskAnalysisText.textContent = profileData.analysis;
    
    // Apply animation effect to the risk meter
    riskMeterFill.style.transition = 'width 1.5s ease-in-out';
    
    // Add blink effect to highlight the result
    setTimeout(() => {
        riskMeterFill.classList.add('blink-animation');
        setTimeout(() => {
            riskMeterFill.classList.remove('blink-animation');
        }, 1000);
    }, 1500);
}
