class TrueFalseActivity {
    constructor() {
        this.answerFormats = {
            'english': ['true', 'false'],
            'symbols': ['✓', '✕'],
            'hindi': ['सत्य', 'असत्य'],
            'sahi': ['सही', 'गलत']
        };
    }

    // Initialize the activity with JSON data
    init(jsonData) {
        try {
            this.data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            this.detectAndSetFormat();
            this.render();
            this.addEventListeners();
        } catch (error) {
            this.showError('Error initializing activity: ' + error.message);
        }
    }

    // Detect answer format from the questions
    detectAndSetFormat() {
        if (!this.data.PR_QUESTIONS || !this.data.PR_QUESTIONS.length) {
            throw new Error('No questions found in data');
        }

        const firstAnswer = this.data.PR_QUESTIONS[0].PR_ANSWER.toLowerCase();

        for (const [format, [trueVal, falseVal]] of Object.entries(this.answerFormats)) {
            if (firstAnswer === trueVal.toLowerCase() ||
                firstAnswer === falseVal.toLowerCase()) {
                this.currentFormat = format;
                return;
            }
        }

        // If no match found, create custom format from unique answers
        const uniqueAnswers = [...new Set(
            this.data.PR_QUESTIONS.map(q => q.PR_ANSWER)
        )];
        this.answerFormats.custom = uniqueAnswers;
        this.currentFormat = 'custom';
    }

    // Render the activity
    render() {
        document.getElementById('title').textContent = this.data.PR_TITLE;
        document.getElementById('heading').textContent = this.data.PR_HEADING;

        this.renderQuestions();
        this.renderOptions();
    }

    // Render questions
    renderQuestions() {
        const questionsDiv = document.getElementById('questions');
        questionsDiv.innerHTML = '';

        this.data.PR_QUESTIONS.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-container';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'question-content';

            // Add question text
            if (question.PR_QUESTION) {
                const questionText = document.createElement('div');
                questionText.className = 'question-text';
                questionText.textContent = question.PR_QUESTION;
                contentDiv.appendChild(questionText);
            }

            // Add image if present
            if (question.PR_QUESTION_IMG) {
                const img = document.createElement('img');
                img.src = question.PR_QUESTION_IMG;
                img.alt = `Question ${index + 1} Image`;
                img.className = 'question-image';
                img.onerror = () => {
                    img.style.display = 'none';
                };
                contentDiv.appendChild(img);
            }

            questionDiv.appendChild(contentDiv);

            // Add drop zone
            const dropZone = document.createElement('div');
            dropZone.className = 'blank';
            dropZone.setAttribute('data-answer', question.PR_ANSWER);
            questionDiv.appendChild(dropZone);

            questionsDiv.appendChild(questionDiv);
        });
    }

    // Render draggable options
    renderOptions() {
        const wordsDiv = document.getElementById('words');
        wordsDiv.innerHTML = '';

        const [trueVal, falseVal] = this.answerFormats[this.currentFormat];
        [trueVal, falseVal].forEach(option => {
            const draggable = document.createElement('div');
            draggable.className = 'draggable';
            draggable.setAttribute('draggable', 'true');
            draggable.setAttribute('data-word', option);
            draggable.textContent = option;
            wordsDiv.appendChild(draggable);
        });
    }

    // Add all event listeners
    addEventListeners() {
        this.addDragAndDropEvents();
        this.addSubmitEvent();
    }

    // Add drag and drop functionality
    addDragAndDropEvents() {
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
            document.getElementById('resetBtn').style.display = 'inline-block';
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

    // Show correct answers
    showAnswer() {
        document.querySelectorAll('.blank').forEach(zone => {
            zone.textContent = zone.getAttribute('data-answer');
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
        });
        document.getElementById('submitBtn').style.display = 'none';
        document.getElementById('showAnswerBtn').style.display = 'none';
        document.getElementById('result').textContent = 'Correct answers displayed!';
    }

    // Reset the game to initial state
    resetGame() {
        document.querySelectorAll('.blank').forEach(zone => {
            zone.textContent = ''; // Clear user input
            zone.style.border = '2px dashed #666';
            zone.classList.remove('correct', 'incorrect');
        });

        document.getElementById('result').textContent = '';
        document.getElementById('showAnswerBtn').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'inline-block';
    }

    // Add submit button functionality
    addSubmitEvent() {
        document.getElementById('submitBtn').addEventListener('click', () => {
            const dropZones = document.querySelectorAll('.blank');
            let correct = 0;
            let total = dropZones.length;

            dropZones.forEach(zone => {
                const userAnswer = zone.textContent;
                const correctAnswer = zone.getAttribute('data-answer');

                if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                    correct++;
                    zone.classList.add('correct');
                    zone.classList.remove('incorrect');
                } else {
                    zone.classList.add('incorrect');
                    zone.classList.remove('correct');
                }
            });
            document.getElementById('showAnswerBtn').style.display = 'inline-block';
            document.getElementById('resetBtn').style.display = 'inline-block';
            document.getElementById('submitBtn').style.display = 'none';
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = `Score: ${correct}/${total}`;
        });
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.activity-container').appendChild(errorDiv);
    }
}

// Initialize the activity
const activity = new TrueFalseActivity();

// Function to load activity with JSON data
function loadActivity(jsonData) {
    activity.init(jsonData);
}

// Example: Adding event listeners for "Show Answer" and "Reset" buttons
document.getElementById('showAnswerBtn').addEventListener('click', () => activity.showAnswer());
document.getElementById('resetBtn').addEventListener('click', () => activity.resetGame());
document.getElementById('showAnswerBtn').style.display = 'none';
document.getElementById('resetBtn').style.display = 'none';

// Function to load activity with JSON data
function loadActivity(jsonData) {
    activity.init(jsonData);
}