import { tooglePaintMode } from "./grid.js";

const startPaintBtn = document.getElementById('startPaint');
const colorsChoices = document.getElementById('colorsChoices');
const closeColorsChoiceBtn = document.getElementById('closeColorsChoice');
const colorOptions = Array.from(document.querySelectorAll('.color-option'));

export let selectedColor = colorOptions[0]?.dataset.color || null;

startPaintBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startPaintBtn.classList.add('hidden');
    colorsChoices.classList.remove('hidden');
    document.getElementById('center-btn').classList.add('hidden');
    tooglePaintMode();
});

closeColorsChoiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorsChoices.classList.add('hidden');
    startPaintBtn.classList.remove('hidden');
    document.getElementById('center-btn').classList.remove('hidden');
    tooglePaintMode();
});

colorOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        colorOptions.forEach((btn) => btn.classList.remove('active'));
        option.classList.add('active');
        selectedColor = option.dataset.color;
    });
});