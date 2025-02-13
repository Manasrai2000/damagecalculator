let selectedItem = null;
let matches = new Map();
const canvas = document.getElementById('connectionsCanvas');
const ctx = canvas.getContext('2d');

// Set title and heading
document.getElementById('title').textContent = data.PR_TITLE;
document.getElementById('heading').textContent = data.PR_HEADING;

function initializeGame() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');

    // Clear columns while keeping the headers
    leftColumn.innerHTML = "<h3>Column A</h3>";
    rightColumn.innerHTML = "<h3>Column B</h3>";

    // Shuffle only Column B answers
    let shuffledAnswers = [...data.PR_QUESTIONS.map(q => q.PR_DATA[0].PR_ANSWER)];
    shuffledAnswers.sort(() => Math.random() - 0.5);

    // Add items to columns
    data.PR_QUESTIONS.forEach((question, index) => {
        const leftItem = createItem(question.PR_DATA[0].PR_QUESTION, 'left', index);
        const rightItem = createItem(shuffledAnswers[index], 'right', index);

        leftColumn.appendChild(leftItem);
        rightColumn.appendChild(rightItem);
    });

    resizeCanvas();
}

function createItem(content, side, index) {
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.side = side;
    item.dataset.index = index;

    if (content.PR_TYPE === "img") {
        const img = document.createElement('img');
        img.src = `./${content.PR_VALUE}`;
        img.alt = content.PR_VALUE.split('/').pop().split('.')[0];
        item.appendChild(img);
    } else {
        item.textContent = content.PR_VALUE;
    }

    // Ensure it works on both mobile & desktop
    item.addEventListener('pointerdown', handleClick);

    return item;
}

function handleClick(e) {
    e.preventDefault(); // Prevent unintended double clicks

    let clickedItem = e.target.closest('.item'); // Ensure only .item is selected
    if (!clickedItem) return;

    console.log("Item Clicked:", clickedItem.dataset.index, clickedItem.dataset.side);

    if (clickedItem.classList.contains('complete')) return;

    if (!selectedItem) {
        selectedItem = clickedItem;
        clickedItem.classList.add('selected');
    } else {
        if (selectedItem === clickedItem) {
            selectedItem.classList.remove('selected');
            selectedItem = null;
            return;
        }

        if (selectedItem.dataset.side !== clickedItem.dataset.side) {
            const leftItem = selectedItem.dataset.side === 'left' ? selectedItem : clickedItem;
            const rightItem = selectedItem.dataset.side === 'right' ? selectedItem : clickedItem;

            matches.set(leftItem, rightItem);

            leftItem.classList.add('complete');
            rightItem.classList.add('complete');

            drawConnections();
        }

        selectedItem.classList.remove('selected');
        selectedItem = null;
    }
}

function drawConnections() {
    const container = document.querySelector('.game-container');
    const rect = container.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    matches.forEach((rightItem, leftItem) => {
        const leftRect = leftItem.getBoundingClientRect();
        const rightRect = rightItem.getBoundingClientRect();

        const startX = leftRect.right - rect.left;
        const startY = leftRect.top - rect.top + leftRect.height / 2;
        const endX = rightRect.left - rect.left;
        const endY = rightRect.top - rect.top + rightRect.height / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawConnections();
}

// Adjust styles dynamically for mobile
function makeResponsive() {
    const container = document.querySelector('.game-container');
    if (window.innerWidth < 600) {
        container.style.flexDirection = "column"; // Stack items vertically
    } else {
        container.style.flexDirection = "row"; // Normal side-by-side layout
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    makeResponsive();
});

// Initialize game and styles
initializeGame();
makeResponsive();

function checkAnswers() {
    let score = 0;
    const totalQuestions = data.PR_QUESTIONS.length;

    matches.forEach((rightItem, leftItem) => {
        const leftIndex = parseInt(leftItem.dataset.index);
        let rightValue = '';

        // Get the value based on whether it's an image or text
        if (rightItem.querySelector('img')) {
            rightValue = rightItem.querySelector('img').alt;
        } else {
            rightValue = rightItem.textContent;
        }

        const correctAnswer = data.PR_QUESTIONS[leftIndex].PR_DATA[0].PR_ANSWER.PR_VALUE;
        const correctValue = correctAnswer.split('/').pop().split('.')[0];

        if (rightValue === correctValue) {
            score++;
            leftItem.classList.remove('incorrect');
            rightItem.classList.remove('incorrect');
        } else {
            leftItem.classList.add('incorrect');
            rightItem.classList.add('incorrect');
        }
    });

    document.getElementById('score').textContent = `Score: ${score}/${totalQuestions}`;
}
