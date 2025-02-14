// Load Quiz Data
document.getElementById("quiz-title").innerText = jsonData.PR_TITLE;
document.getElementById("quiz-heading").innerText = jsonData.PR_HEADING;

const quizContainer = document.getElementById("quiz-container");
const submitButton = document.getElementById("submit-button");
const resetButton = document.getElementById("resetBtn");
const showAnswerButton = document.getElementById("showAnswerBtn");
const resultMessage = document.getElementById("result-message");

let isQuizSubmitted = false;
let hasSelectedAnswer = false;

// Initially hide reset and show answer buttons
resetButton.style.display = 'none';
showAnswerButton.style.display = 'none';

function createQuiz() {
    quizContainer.innerHTML = ''; // Clear existing content
    
    jsonData.PR_QUESTIONS.forEach((questionData, index) => {
        const questionBlock = document.createElement("div");
        questionBlock.classList.add("question-block");

        // Question Text
        const questionTitle = document.createElement("p");
        questionTitle.classList.add("question");
        questionTitle.innerText = `${index + 1}. ${questionData.PR_QUESTION}`;
        questionBlock.appendChild(questionTitle);

        // Question Image (if available)
        if (questionData.PR_QUESTION_IMG && questionData.PR_QUESTION_IMG !== "") {
            const questionImage = document.createElement("img");
            questionImage.src = questionData.PR_QUESTION_IMG;
            questionImage.alt = "Question Image";
            questionImage.classList.add("question-image");
            questionBlock.appendChild(questionImage);
        }

        // Options List
        const optionsList = document.createElement("ul");
        optionsList.classList.add("options");

        questionData.PR_OPTIONS.forEach((option, optionIndex) => {
            const optionItem = document.createElement("li");
            const radioContainer = document.createElement("div");
            radioContainer.classList.add("radio-option");

            // Create radio button
            const radioButton = document.createElement("input");
            radioButton.type = "radio";
            radioButton.name = `question-${index}`;
            radioButton.value = option.PR_TEXT || `option-${optionIndex + 1}`;
            radioButton.id = `q${index}-option${optionIndex}`;

            // Add change event listener to radio buttons
            radioButton.addEventListener('change', () => {
                hasSelectedAnswer = true;
                resetButton.style.display = 'inline-block';
            });

            // Create label for both text and image
            const label = document.createElement("label");
            label.htmlFor = `q${index}-option${optionIndex}`;
            
            // Handle option text if available
            if (option.PR_TEXT) {
                const optionText = document.createElement("span");
                optionText.innerText = option.PR_TEXT;
                label.appendChild(optionText);
            }

            // Handle option image if available
            if (option.PR_IMAGE && option.PR_IMAGE !== "") {
                const optionImage = document.createElement("img");
                optionImage.src = option.PR_IMAGE;
                optionImage.alt = `Option ${optionIndex + 1} Image`;
                optionImage.classList.add("option-image");
                label.appendChild(optionImage);
            }

            radioContainer.appendChild(radioButton);
            radioContainer.appendChild(label);
            optionItem.appendChild(radioContainer);

            // Store correct answer flag
            optionItem.dataset.isCorrect = option.IS_CORRECT;

            // Click handler for the entire option item
            optionItem.addEventListener("click", function() {
                radioButton.checked = true;
                hasSelectedAnswer = true;
                resetButton.style.display = 'inline-block';
            });

            optionsList.appendChild(optionItem);
        });

        questionBlock.appendChild(optionsList);
        quizContainer.appendChild(questionBlock);
    });
}

// Create initial quiz
createQuiz();

// Handle Submit Button
submitButton.addEventListener("click", function() {
    if (!hasSelectedAnswer) {
        alert("Please select at least one answer before submitting.");
        return;
    }

    let correctAnswers = 0;
    const allQuestions = document.querySelectorAll(".question-block");
    
    allQuestions.forEach((questionBlock, index) => {
        const options = questionBlock.querySelectorAll(".options li input");
        let questionAnswered = false;

        options.forEach(option => {
            const optionItem = option.closest("li");
            if (option.checked) {
                questionAnswered = true;
                if (optionItem.dataset.isCorrect === "true") {
                    optionItem.classList.add("correct");
                    correctAnswers++;
                } else {
                    optionItem.classList.add("incorrect");
                }
            }
            // Disable all radio buttons after submission
            option.disabled = true;
        });
    });

    // Display Result
    resultMessage.classList.remove("hidden");
    document.getElementById("correct-answer-count").innerText = 
        `You got ${correctAnswers} out of ${jsonData.PR_QUESTIONS.length} correct!`;
    
    // Show the show answer button and hide submit button
    showAnswerButton.style.display = 'inline-block';
    submitButton.style.display = 'none';
    isQuizSubmitted = true;
});

// Handle Reset Button
resetButton.addEventListener("click", function() {
    // Reset all selections and remove styling
    createQuiz();
    
    // Hide result message
    resultMessage.classList.add("hidden");
    
    // Reset buttons
    submitButton.style.display = 'inline-block';
    showAnswerButton.style.display = 'none';
    resetButton.style.display = 'none';
    
    // Reset state
    isQuizSubmitted = false;
    hasSelectedAnswer = false;
});

// Handle Show Answer Button
showAnswerButton.addEventListener("click", function() {
    const allQuestions = document.querySelectorAll(".question-block");
    
    allQuestions.forEach((questionBlock) => {
        const options = questionBlock.querySelectorAll(".options li");
        
        options.forEach(option => {
            if (option.dataset.isCorrect === "true") {
                option.classList.add("correct");
                option.style.fontWeight = "bold";
            }
        });
    });
});