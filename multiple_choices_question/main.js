 
        // Load Quiz Data
        document.getElementById("quiz-title").innerText = jsonData.PR_TITLE;
        document.getElementById("quiz-heading").innerText = jsonData.PR_HEADING;

        const quizContainer = document.getElementById("quiz-container");

        jsonData.PR_QUESTIONS.forEach((questionData, index) => {
            const questionBlock = document.createElement("div");
            questionBlock.classList.add("question-block");

            // Question Text
            const questionTitle = document.createElement("p");
            questionTitle.classList.add("question");
            questionTitle.innerText = `${index + 1}. ${questionData.PR_QUESTION}`;
            questionBlock.appendChild(questionTitle);

            // Image (if available)
            if (questionData.PR_QUESTION_IMG) {
                const questionImage = document.createElement("img");
                questionImage.src = questionData.PR_QUESTION_IMG;
                questionImage.alt = "Question Image";
                questionImage.style.maxWidth = "100%";
                questionBlock.appendChild(questionImage);
            }

            // Options List
            const optionsList = document.createElement("ul");
            optionsList.classList.add("options");

            questionData.PR_OPTIONS.forEach(option => {
                const optionItem = document.createElement("li");

                // Create radio button
                const radioContainer = document.createElement("div");
                radioContainer.classList.add("radio-option");

                const radioButton = document.createElement("input");
                radioButton.type = "radio";
                radioButton.name = `question-${index}`;
                radioButton.value = option.PR_TEXT;

                // Option text
                const optionText = document.createElement("span");
                optionText.innerText = option.PR_TEXT;

                radioContainer.appendChild(radioButton);
                radioContainer.appendChild(optionText);
                optionItem.appendChild(radioContainer);

                // Store correct answer flag
                optionItem.dataset.isCorrect = option.IS_CORRECT;

                // Click on the option text selects the radio button
                optionItem.addEventListener("click", function () {
                    radioButton.checked = true;
                });

                optionsList.appendChild(optionItem);
            });

            questionBlock.appendChild(optionsList);
            quizContainer.appendChild(questionBlock);
        });

        // Handle Submit Button
        document.getElementById("submit-button").addEventListener("click", function () {
            let correctAnswers = 0;

            // Loop through each question to check answers
            const allQuestions = document.querySelectorAll(".question-block");
            allQuestions.forEach((questionBlock, index) => {
                const options = questionBlock.querySelectorAll(".options li input");

                options.forEach(option => {
                    if (option.checked) {
                        const optionItem = option.closest("li");
                        if (optionItem.dataset.isCorrect === "true") {
                            optionItem.classList.add("correct");
                            correctAnswers++;
                        } else {
                            optionItem.classList.add("incorrect");
                        }
                    }
                });
            });

            // Display Result
            document.getElementById("result-message").classList.remove("hidden");
            document.getElementById("correct-answer-count").innerText = `You got ${correctAnswers} out of ${jsonData.PR_QUESTIONS.length} correct!`;
        });