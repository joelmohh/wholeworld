const startPaintBtn = document.getElementById('startPaint');

startPaintBtn.addEventListener('click', () => {
    const colorsChoices = document.getElementById('colorsChoices');
    document.getElementById('center-btn').classList.toggle('hidden');
    colorsChoices.classList.toggle('hidden');
    startPaintBtn.classList.toggle('hidden');
});