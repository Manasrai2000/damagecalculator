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
    
    // Clear existing content except headers
    while (leftColumn.children.length > 1) leftColumn.removeChild(leftColumn.lastChild);
    while (rightColumn.children.length > 1) rightColumn.removeChild(rightColumn.lastChild);

    // Create shuffled array for right column
    const rightItems = [...data.PR_QUESTIONS];
    for (let i = rightItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rightItems[i], rightItems[j]] = [rightItems[i], rightItems[j]];
    }

    // Add items to columns
    data.PR_QUESTIONS.forEach((question, index) => {
        const leftItem = createItem(question.PR_DATA[0].PR_QUESTION, 'left', index);
        const rightItem = createItem(rightItems[index].PR_DATA[0].PR_ANSWER, 'right', index);
        
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
    
    // Check if content is an image or text
    if (content.PR_TYPE === "img") {
        const img = document.createElement('img');
        // Using placeholder API for demo since actual images might not be available
        img.src = `./${content.PR_VALUE}`;
        img.alt = content.PR_VALUE.split('/').pop().split('.')[0];
        item.appendChild(img);
    } else {
        item.textContent = content.PR_VALUE;
    }
    
    item.addEventListener('click', handleClick);
    return item;
}

function handleClick(e) {
    const clickedItem = e.target;
    
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
            
            // Update matches
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all connections
    matches.forEach((rightItem, leftItem) => {
        const leftRect = leftItem.getBoundingClientRect();
        const rightRect = rightItem.getBoundingClientRect();
        
        const startX = leftRect.right - rect.left;
        const startY = leftRect.top - rect.top + leftRect.height/2;
        const endX = rightRect.left - rect.left;
        const endY = rightRect.top - rect.top + rightRect.height/2;
        
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

// Initialize game and set up event listeners
window.addEventListener('resize', resizeCanvas);
initializeGame();