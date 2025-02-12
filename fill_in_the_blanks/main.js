function generateActivity() {
    let wordSet = new Set();
    let questionsDiv = document.getElementById('questions');
    let wordsDiv = document.getElementById('words');

    document.getElementById('title').textContent = data.PR_TITLE;
    document.getElementById('heading').textContent = data.PR_HEADING;

    questionsDiv.innerHTML = '';
    wordsDiv.innerHTML = '';

    data.PR_QUESTIONS.forEach((item, index) => {
        let answers = item.PR_ANSWER ? item.PR_ANSWER.split(', ') : [];
        let blankPlaceholders = answers.map(answer => `<span class='blank' data-answer='${answer}'></span>`);

        if (item.PR_ANSWER_IMG) {
            blankPlaceholders.push(`<span class='blank' data-answer-img='${item.PR_ANSWER_IMG}'></span>`);
        }

        let questionText = `${index + 1}: ` + item.PR_QUESTION;
        blankPlaceholders.forEach(placeholder => {
            questionText = questionText.replace('_____', placeholder);
        });

        let questionHTML = `<div class="container">`;
        if (item.PR_QUESTION_IMG) {
            questionHTML += `<img src="${item.PR_QUESTION_IMG}" alt="Question Image">`;
        }
        questionHTML += `<p>${questionText}</p></div>`;
        questionsDiv.innerHTML += questionHTML;

        answers.forEach(answer => {
            wordSet.add(`<span class='draggable' draggable='true' data-word='${answer}'>${answer}</span>`);
        });
        if (item.PR_ANSWER_IMG) {
            wordSet.add(`<img class='draggable' draggable='true' src='${item.PR_ANSWER_IMG}' data-word='${item.PR_ANSWER_IMG}' style='width:50px; height:50px;'>`);
        }
    });

    wordSet.forEach(word => {
        wordsDiv.innerHTML += word;
    });

    addDragAndDropEvents();
}

function addDragAndDropEvents() {
    let draggedItem = null;
    let initialX = 0;
    let initialY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollInterval = null;

    // Auto-scroll function
    function checkScrolling(y) {
        const scrollThreshold = 50; // pixels from bottom to trigger scroll
        const scrollSpeed = 5; // pixels per scroll
        const windowHeight = window.innerHeight;
        
        // Clear any existing scroll interval
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }

        // If near bottom of screen, start scrolling
        if (y > windowHeight - scrollThreshold) {
            scrollInterval = setInterval(() => {
                window.scrollBy(0, scrollSpeed);
            }, 16); // ~60fps
        }
    }

    function handleDrop(dropTarget, draggable) {
        if (!dropTarget || !dropTarget.classList.contains('blank')) return;
        
        const word = draggable.dataset.word;
        if (word.endsWith('.jpeg') || word.endsWith('.png') || word.endsWith('.jpg')) {
            dropTarget.innerHTML = `<img src='${word}' style='width:50px; height:50px;'>`;
        } else {
            dropTarget.textContent = word;
        }
        dropTarget.dataset.userAnswer = word;
    }

    document.querySelectorAll('.draggable').forEach(item => {
        item.addEventListener('dragstart', event => {
            event.dataTransfer.setData('text', event.target.dataset.word);
        });

        item.addEventListener('touchstart', event => {
            event.preventDefault();
            draggedItem = item;
            const touch = event.touches[0];
            
            const rect = item.getBoundingClientRect();
            initialX = touch.clientX - rect.left;
            initialY = touch.clientY - rect.top;
            
            item.classList.add('dragging');
            
            const clone = item.cloneNode(true);
            clone.style.opacity = '0.5';
            clone.style.position = 'fixed';
            clone.style.pointerEvents = 'none';
            clone.id = 'dragGhost';
            document.body.appendChild(clone);
        });

        item.addEventListener('touchmove', event => {
            event.preventDefault();
            if (!draggedItem) return;

            const touch = event.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;

            // Check for auto-scrolling
            checkScrolling(touch.clientY);

            const ghost = document.getElementById('dragGhost');
            if (ghost) {
                ghost.style.left = `${currentX}px`;
                ghost.style.top = `${currentY}px`;
            }
        });

        item.addEventListener('touchend', event => {
            event.preventDefault();
            if (!draggedItem) return;

            // Clear scroll interval if it exists
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }

            const touch = event.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            
            handleDrop(dropTarget, draggedItem);

            draggedItem.classList.remove('dragging');
            const ghost = document.getElementById('dragGhost');
            if (ghost) ghost.remove();
            draggedItem = null;
        });
    });

    document.querySelectorAll('.blank').forEach(blank => {
        blank.addEventListener('dragover', event => {
            event.preventDefault();
            blank.classList.add('drag-over');
        });

        blank.addEventListener('dragleave', () => {
            blank.classList.remove('drag-over');
        });

        blank.addEventListener('drop', event => {
            event.preventDefault();
            blank.classList.remove('drag-over');
            const word = event.dataTransfer.getData('text');
            handleDrop(blank, { dataset: { word } });
        });
    });
}

// Add some CSS for visual feedback
const style = document.createElement('style');
style.textContent = `
    .dragging {
        opacity: 0.5;
    }
    .drag-over {
        background-color: rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

function checkAnswers() {
    let correctCount = 0;
    let totalQuestions = data.PR_QUESTIONS.length;
    let questionCorrect = new Array(totalQuestions).fill(true);

    document.querySelectorAll('.blank').forEach((blank, index) => {
        let correctAnswer = blank.dataset.answer || blank.dataset.answerImg;
        let userAnswer = blank.dataset.userAnswer;

        if (userAnswer !== correctAnswer) {
            blank.style.border = "2px solid red";
            questionCorrect[Math.floor(index / 2)] = false;
        } else {
            blank.style.border = "2px solid green";
        }
    });

    correctCount = questionCorrect.filter(isCorrect => isCorrect).length;
    document.getElementById('result').textContent = `Correct: ${correctCount}/${totalQuestions}`;
}

generateActivity();