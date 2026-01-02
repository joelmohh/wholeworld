const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeButton = leaderboardModal.querySelector('.close-button');

leaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.remove('modal-hidden');
});

closeButton.addEventListener('click', () => {
    leaderboardModal.classList.add('modal-hidden');
});