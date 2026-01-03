const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderbordModal');
const closeButton = leaderboardModal.querySelector('.close-button');
const leaderboardBody = leaderboardModal.querySelector('.modal-body');

leaderboardBtn.addEventListener('click', async () => {
    leaderboardModal.classList.remove('modal-hidden');
    await loadLeaderboard();
});

closeButton.addEventListener('click', () => {
    leaderboardModal.classList.add('modal-hidden');
});

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/pixels/leaderboard');
        if (response.ok) {
            const data = await response.json();
            displayLeaderboard(data.leaderboard);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardBody.innerHTML = '<p>Error loading leaderboard</p>';
    }
}

function displayLeaderboard(leaderboard) {
    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<p>No painters yet</p>';
        return;
    }

    let html = '<div style="max-height: 400px; overflow-y: auto;">';
    leaderboard.forEach((entry, index) => {
        html += `
            <div style="padding: 10px; border-bottom: 1px solid #ccc; display: flex; justify-content: space-between;">
                <div>
                    <strong>#${index + 1}</strong> ${entry.userId}
                </div>
                <div>
                    <strong>${entry.pixelsPainted}</strong> pixels
                </div>
            </div>
        `;
    });
    html += '</div>';
    leaderboardBody.innerHTML = html;
}
