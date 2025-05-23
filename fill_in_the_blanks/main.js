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
        dropTarget.style.border = '2px dashed rgba(151, 151, 151, 0)';
        const resetButton = document.getElementById('resetBtn');
        resetButton.style.display = 'inline-block';
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
    // First check if any answers are filled
    const blanks = document.querySelectorAll('.blank');
    const filledAnswers = Array.from(blanks).filter(blank => blank.dataset.userAnswer);
    
    if (filledAnswers.length === 0) {
        alert('Please fill at least one answer before submitting.');
        return;
    }

    let correctCount = 0;
    let totalQuestions = data.PR_QUESTIONS.length;
    let questionCorrect = new Array(totalQuestions).fill(true);

    const containers = document.querySelectorAll('.container');
    
    containers.forEach((container, questionIndex) => {
        const blanksInContainer = container.querySelectorAll('.blank');
        let isQuestionCorrect = true;

        blanksInContainer.forEach(blank => {
            const correctAnswer = blank.dataset.answer || blank.dataset.answerImg;
            const userAnswer = blank.dataset.userAnswer;

            if (!userAnswer || userAnswer !== correctAnswer) {
                blank.style.border = "2px solid red";
                isQuestionCorrect = false;
            } else {
                blank.style.border = "2px solid green";
            }
        });

        questionCorrect[questionIndex] = isQuestionCorrect;
    });

    correctCount = questionCorrect.filter(isCorrect => isCorrect).length;
    document.getElementById('result').textContent = `Correct: ${correctCount}/${totalQuestions}`;

    // Change button to "Show Answers"
    const submitButton = document.getElementById('submitBtn');
    
    submitButton.textContent = 'Show Answers';
    submitButton.onclick = showCorrectAnswers;
}

function showCorrectAnswers() {
    const containers = document.querySelectorAll('.container');
    
    containers.forEach((container) => {
        const blanksInContainer = container.querySelectorAll('.blank');
        
        blanksInContainer.forEach(blank => {
            const correctAnswer = blank.dataset.answer || blank.dataset.answerImg;
            
            // Reset border to default
            blank.removeAttribute('style');
            
            // Show correct answer
            if (correctAnswer.endsWith('.jpeg') || correctAnswer.endsWith('.png') || correctAnswer.endsWith('.jpg')) {
                blank.innerHTML = `<img src='${correctAnswer}' style='width:50px; height:50px;'>`;
            } else {
                blank.textContent = correctAnswer;
            }
        });
    });

    const resetButton = document.getElementById('resetBtn');
    resetButton.style.display = 'none';
    // Change button to "Reset"
    const button = document.getElementById('submitBtn');
    button.textContent = 'Reset';
    button.onclick = resetActivity;
}

function resetActivity() {
    // Clear all blanks
    document.querySelectorAll('.blank').forEach(blank => {
        blank.innerHTML = '';
        blank.removeAttribute('style');
        blank.removeAttribute('data-user-answer');
    });

    // Reset result text
    document.getElementById('result').textContent = '';

    // Reset button to original state
    const button = document.getElementById('submitBtn');
    button.textContent = 'Submit';
    button.onclick = checkAnswers;

    // Regenerate activity
    generateActivity();
}

generateActivity();