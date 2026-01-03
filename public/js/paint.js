import { togglePaintMode, setEraseMode } from "./grid.js";

const startPaintBtn = document.getElementById('startPaint');
const colorsChoices = document.getElementById('colorsChoices');
const closeColorsChoiceBtn = document.getElementById('closeColorsChoice');
const colorOptions = Array.from(document.querySelectorAll('.color-option'));
const eraseBtn = document.getElementById('eraseBtn');

export let selectedColor = colorOptions[0]?.dataset.color || 'red';
export let isErasing = false;

startPaintBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startPaintBtn.classList.add('hidden');
    colorsChoices.classList.remove('hidden');
    document.getElementById('center-btn').classList.add('hidden');
    togglePaintMode();
});

closeColorsChoiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorsChoices.classList.add('hidden');
    startPaintBtn.classList.remove('hidden');
    document.getElementById('center-btn').classList.remove('hidden');
    togglePaintMode();
});

colorOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        colorOptions.forEach((btn) => btn.classList.remove('active'));
        if (eraseBtn) eraseBtn.classList.remove('active');
        option.classList.add('active');
        selectedColor = option.dataset.color;
        isErasing = false;
        setEraseMode(false);
    });
});

if (eraseBtn) {
    eraseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorOptions.forEach((btn) => btn.classList.remove('active'));
        eraseBtn.classList.add('active');
        isErasing = true;
        setEraseMode(true);
    });
}
