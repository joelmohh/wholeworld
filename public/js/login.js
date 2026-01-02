const loginModalBtn = document.getElementById('loginModalBtn');
const loginModal = document.getElementById('loginModal');
const closeButton = loginModal.querySelector('.close-button');

loginModalBtn.addEventListener('click', () => {
    loginModal.classList.remove('modal-hidden');
});

closeButton.addEventListener('click', () => {
    loginModal.classList.add('modal-hidden');
});