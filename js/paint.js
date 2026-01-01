import { paintMode } from "./grid.js";

const startPaintBtn = document.getElementById('startPaint');
const colorsChoices = document.getElementById('colorsChoices');
const closeColorsChoiceBtn = document.getElementById('closeColorsChoice');
const colorOptions = Array.from(document.querySelectorAll('.color-option'));

export let selectedColor = colorOptions[0]?.dataset.color || null;

startPaintBtn.addEventListener('click', () => {
    startPaintBtn.classList.add('hidden');
    colorsChoices.classList.remove('hidden');
    paintMode = true;
});

closeColorsChoiceBtn.addEventListener('click', () => {
    colorsChoices.classList.add('hidden');
    startPaintBtn.classList.remove('hidden');
});

colorOptions.forEach((option) => {
    option.addEventListener('click', () => {
        colorOptions.forEach((btn) => btn.classList.remove('active'));
        option.classList.add('active');
        selectedColor = option.dataset.color;
    });
});