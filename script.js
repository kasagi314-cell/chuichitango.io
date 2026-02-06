document.addEventListener('DOMContentLoaded', () => {
    // wordList is defined in words.js (global variable)
    let words = window.wordList || [];

    // Clean up data
    words = words.filter(w => w.english && w.english !== '英単語' && w.english !== 'English');

    if (words.length === 0) {
        alert('No words found! Please check the words.js file.');
        return;
    }

    // State Variables
    let currentMode = 'flashcard'; // 'flashcard' or 'memory'

    // Flashcard State
    let currentIndex = 0;

    // Memory Game State
    let memoryCards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let isLocked = false;
    const MEMORY_PAIR_COUNT = 15;

    // DOM Elements - Common
    const modeBtnFlashcard = document.getElementById('mode-flashcard');
    const modeBtnMemory = document.getElementById('mode-memory');
    const flashcardContainer = document.getElementById('flashcard-mode-container');
    const memoryContainer = document.getElementById('memory-mode-container');
    const flashcardProgress = document.getElementById('flashcard-progress');
    const progressText = document.getElementById('progress-text');

    // DOM Elements - Flashcard
    const card = document.getElementById('flashcard');
    const wordFront = document.getElementById('word-front');
    const wordBack = document.getElementById('word-back');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnShuffle = document.getElementById('btn-shuffle');
    const progressFill = document.getElementById('progress-fill');

    // DOM Elements - Memory
    const memoryGrid = document.getElementById('memory-grid');
    const memoryMatchesDisplay = document.getElementById('memory-matches');
    const btnMemoryReset = document.getElementById('btn-memory-reset');

    // Initialization
    updateCard(); // Start with flashcard mode ready

    // Mode Switching Logic
    modeBtnFlashcard.addEventListener('click', () => switchMode('flashcard'));
    modeBtnMemory.addEventListener('click', () => switchMode('memory'));

    function switchMode(mode) {
        if (currentMode === mode) return;
        currentMode = mode;

        if (mode === 'flashcard') {
            modeBtnFlashcard.classList.add('active');
            modeBtnMemory.classList.remove('active');
            flashcardContainer.classList.remove('hidden');
            memoryContainer.classList.add('hidden');
            flashcardProgress.classList.remove('hidden');
            progressText.classList.remove('hidden');
        } else {
            modeBtnFlashcard.classList.remove('active');
            modeBtnMemory.classList.add('active');
            flashcardContainer.classList.add('hidden');
            memoryContainer.classList.remove('hidden');
            flashcardProgress.classList.add('hidden');
            progressText.classList.add('hidden');

            // Init memory game if starting fresh or just resume?
            // Let's restart if grid is empty
            if (memoryGrid.children.length === 0) {
                initMemoryGame();
            }
        }
    }

    // --- Flashcard Logic ---

    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextCard();
    });

    btnPrev.addEventListener('click', () => {
        prevCard();
    });

    btnShuffle.addEventListener('click', () => {
        shuffleArray(words);
        currentIndex = 0;
        if (card.classList.contains('flipped')) {
            card.classList.remove('flipped');
            setTimeout(updateCard, 300);
        } else {
            updateCard();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (currentMode !== 'flashcard') return; // Only for flashcard mode

        if (e.key === 'ArrowRight' || e.key === ' ') {
            if (card.classList.contains('flipped')) {
                nextCard();
            } else {
                card.classList.add('flipped');
            }
        } else if (e.key === 'ArrowLeft') {
            prevCard();
        }
    });

    function updateCard() {
        const word = words[currentIndex];
        wordFront.textContent = word.english;
        wordBack.textContent = word.japanese || '---';

        const progress = ((currentIndex + 1) / words.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentIndex + 1} / ${words.length}`;
    }

    function nextCard() {
        if (currentIndex < words.length - 1) {
            animateTransition(() => {
                currentIndex++;
                updateCard();
            });
        } else {
            animateTransition(() => {
                currentIndex = 0;
                updateCard();
            });
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            animateTransition(() => {
                currentIndex--;
                updateCard();
            });
        }
    }

    function animateTransition(callback) {
        if (card.classList.contains('flipped')) {
            card.classList.remove('flipped');
            setTimeout(callback, 300);
        } else {
            callback();
        }
    }

    // --- Memory Game Logic ---

    btnMemoryReset.addEventListener('click', initMemoryGame);

    function initMemoryGame() {
        memoryGrid.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        isLocked = false;
        memoryMatchesDisplay.textContent = '0';

        // Select random pairs
        const gameWords = [];
        const indices = new Set();

        // Safety check if we have enough words
        const pairCount = Math.min(MEMORY_PAIR_COUNT, words.length);

        while (indices.size < pairCount) {
            indices.add(Math.floor(Math.random() * words.length));
        }

        indices.forEach(index => {
            gameWords.push(words[index]);
        });

        // Create card objects (2 per word: Eng and Jpn)
        // Each card needs: id (unique), pairId (to match), content, type (eng/jpn)
        let deck = [];
        gameWords.forEach((word, index) => {
            deck.push({
                id: `pair-${index}-en`,
                pairId: index,
                content: word.english,
                type: 'english'
            });
            deck.push({
                id: `pair-${index}-jp`,
                pairId: index,
                content: word.japanese,
                type: 'japanese'
            });
        });

        shuffleArray(deck);

        // Render Grid
        deck.forEach(cardData => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.pairId = cardData.pairId;
            cardEl.dataset.id = cardData.id;

            const innerEl = document.createElement('div');
            innerEl.className = 'memory-card-inner';

            const frontEl = document.createElement('div');
            frontEl.className = 'memory-front';
            frontEl.textContent = '?'; // Or an icon

            const backEl = document.createElement('div');
            backEl.className = 'memory-back';
            backEl.textContent = cardData.content;

            // Adjust font size based on length
            if (cardData.content.length > 10) {
                backEl.classList.add('long-text');
            }
            if (cardData.content.length > 20) {
                backEl.classList.add('very-long-text');
            }

            innerEl.appendChild(frontEl);
            innerEl.appendChild(backEl);
            cardEl.appendChild(innerEl);

            cardEl.addEventListener('click', () => flipMemoryCard(cardEl));

            memoryGrid.appendChild(cardEl);
        });
    }

    function flipMemoryCard(cardEl) {
        if (isLocked) return;
        if (cardEl.classList.contains('flipped')) return; // Already flipped
        if (cardEl.classList.contains('matched')) return; // Already matched

        cardEl.classList.add('flipped');
        flippedCards.push(cardEl);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        isLocked = true;
        const [card1, card2] = flippedCards;
        const match = card1.dataset.pairId === card2.dataset.pairId;

        if (match) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        const [card1, card2] = flippedCards;

        // Wait a small bit for the flip animation to finish before showing match state
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');

            matchedPairs++;
            memoryMatchesDisplay.textContent = matchedPairs;
            resetBoard();

            if (matchedPairs === MEMORY_PAIR_COUNT) {
                setTimeout(() => alert('Congratulations! You cleared the board!'), 500);
            }
        }, 300);
    }

    function unflipCards() {
        setTimeout(() => {
            flippedCards.forEach(card => card.classList.remove('flipped'));
            resetBoard();
        }, 1200); // 1.2s delay to see the mismatch
    }

    function resetBoard() {
        [isLocked, flippedCards] = [false, []];
    }


    // Utility
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
