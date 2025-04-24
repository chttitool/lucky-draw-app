document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const setupSection = document.getElementById('setup-section');
    const drawingSection = document.getElementById('drawing-section');
    const resultsSection = document.getElementById('results-section');
    
    const prizesInput = document.getElementById('prizes-input');
    const participantsInput = document.getElementById('participants-input');
    const prizesFeedback = document.getElementById('prizes-feedback');
    const participantsFeedback = document.getElementById('participants-feedback');
    
    const startDrawingBtn = document.getElementById('start-drawing-btn');
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const currentPrize = document.getElementById('current-prize');
    const remainingCount = document.getElementById('remaining-count');
    const drawingName = document.getElementById('drawing-name');
    const winnerConfirmation = document.getElementById('winner-confirmation');
    const winnerName = document.getElementById('winner-name');
    const winnerPrize = document.getElementById('winner-prize');
    const winnerPresentBtn = document.getElementById('winner-present-btn');
    const winnerAbsentBtn = document.getElementById('winner-absent-btn');
    const winnersList = document.getElementById('winners-list');
    const currentPrizeWinners = document.getElementById('current-prize-winners');
    const currentPrizeAbsent = document.getElementById('current-prize-absent');
    
    // App State
    let prizes = [];
    let participants = [];
    let eligibleParticipants = [];
    let winners = {};
    let absentParticipants = [];
    let currentPrizeIndex = 0;
    let currentPrizeRemaining = 0;
    let isDrawing = false;
    let timer = null;
    let drawingSpeed = 30; // 抽獎動畫速度，越小越快 (ms)
    let drawingDuration = 1000; // 抽獎動畫時間 (ms)
    const originalNames = []; // 儲存原始參加者名單
    let currentPrizeAbsentWinners = []; // 當前獎項不在場的中獎者
    
    // Event Listeners
    startDrawingBtn.addEventListener('click', startDrawing);
    drawBtn.addEventListener('click', draw);
    resetBtn.addEventListener('click', reset);
    winnerPresentBtn.addEventListener('click', () => handleWinnerPresence(true));
    winnerAbsentBtn.addEventListener('click', () => handleWinnerPresence(false));
    
    // Input validation
    prizesInput.addEventListener('input', validatePrizes);
    participantsInput.addEventListener('input', validateParticipants);
    
    // Functions
    function validatePrizes() {
        const prizeText = prizesInput.value.trim();
        if (!prizeText) {
            setPrizesInvalid('請輸入獎項');
            return false;
        }
        
        const lines = prizeText.split('\n').filter(line => line.trim() !== '');
        const prizeRegex = /^(.+?):(\d+)$/;
        const parsedPrizes = [];
        let isValid = true;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(prizeRegex);
            
            if (!match) {
                setPrizesInvalid(`第 ${i + 1} 行格式錯誤，請使用 "獎項名稱:數量" 格式`);
                isValid = false;
                break;
            }
            
            const name = match[1].trim();
            const quantity = parseInt(match[2]);
            
            if (quantity <= 0) {
                setPrizesInvalid(`第 ${i + 1} 行獎項數量必須大於 0`);
                isValid = false;
                break;
            }
            
            parsedPrizes.push({ name, quantity, remaining: quantity });
        }
        
        if (isValid) {
            setPrizesValid();
            return true;
        }
        
        return false;
    }
    
    function validateParticipants() {
        const participantText = participantsInput.value.trim();
        if (!participantText) {
            setParticipantsInvalid('請輸入參加者名單');
            return false;
        }
        
        const lines = participantText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            setParticipantsInvalid('請輸入至少一位參加者');
            return false;
        }
        
        // 檢查是否有重複的名字
        const uniqueNames = new Set(lines.map(name => name.trim()));
        if (uniqueNames.size !== lines.length) {
            setParticipantsInvalid('參加者名單中有重複的名字');
            return false;
        }
        
        setParticipantsValid();
        return true;
    }
    
    function setPrizesInvalid(message) {
        prizesInput.classList.add('is-invalid');
        prizesFeedback.textContent = message;
    }
    
    function setPrizesValid() {
        prizesInput.classList.remove('is-invalid');
    }
    
    function setParticipantsInvalid(message) {
        participantsInput.classList.add('is-invalid');
        participantsFeedback.textContent = message;
    }
    
    function setParticipantsValid() {
        participantsInput.classList.remove('is-invalid');
    }
    
    function startDrawing() {
        if (!validatePrizes() || !validateParticipants()) {
            return;
        }
        
        // Parse prizes
        const prizeText = prizesInput.value.trim();
        const prizeLines = prizeText.split('\n').filter(line => line.trim() !== '');
        prizes = [];
        
        for (const line of prizeLines) {
            const [name, quantity] = line.split(':');
            prizes.push({
                name: name.trim(),
                quantity: parseInt(quantity),
                remaining: parseInt(quantity)
            });
        }
        
        // Parse participants
        const participantText = participantsInput.value.trim();
        const participantLines = participantText.split('\n').filter(line => line.trim() !== '');
        participants = participantLines.map(name => name.trim());
        originalNames.length = 0; // 清空原始名單
        originalNames.push(...participants); // 儲存原始名單
        
        // Reset state
        eligibleParticipants = [...participants];
        winners = {};
        absentParticipants = [];
        currentPrizeIndex = 0;
        currentPrizeAbsentWinners = [];
        
        // Clear winner lists
        currentPrizeWinners.innerHTML = '';
        currentPrizeAbsent.innerHTML = '';
        
        // Setup first prize
        setCurrentPrize();
        
        // Show drawing section with animation
        setupSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            setupSection.classList.add('d-none');
            drawingSection.classList.remove('d-none');
            drawingSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    function setCurrentPrize() {
        const prize = prizes[currentPrizeIndex];
        currentPrize.textContent = prize.name;
        currentPrizeRemaining = prize.remaining;
        remainingCount.textContent = currentPrizeRemaining;
    }
    
    function draw() {
        if (isDrawing) return;
        
        if (eligibleParticipants.length === 0) {
            alert('沒有足夠的參加者進行抽獎');
            return;
        }
        
        isDrawing = true;
        drawBtn.disabled = true;
        winnerConfirmation.classList.add('d-none');
        
        // Start animation
        let count = 0;
        const maxIterations = drawingDuration / drawingSpeed;
        
        timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
            drawingName.textContent = eligibleParticipants[randomIndex];
            drawingName.classList.add('name-animation');
            
            count++;
            if (count >= maxIterations) {
                clearInterval(timer);
                selectWinner();
            }
        }, drawingSpeed);
    }
    
    function selectWinner() {
        // Get random winner
        const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
        const winner = eligibleParticipants[randomIndex];
        
        // Remove winner from eligible list temporarily (pending confirmation)
        eligibleParticipants.splice(randomIndex, 1);
        
        // Display winner
        drawingName.textContent = winner;
        drawingName.classList.add('draw-animation');
        
        // Show confirmation buttons
        setTimeout(() => {
            const prize = prizes[currentPrizeIndex];
            winnerName.textContent = winner;
            winnerPrize.textContent = prize.name;
            winnerConfirmation.classList.remove('d-none');
            winnerConfirmation.classList.add('winner-appear');
            isDrawing = false;
        }, 500);
    }
    
    function handleWinnerPresence(isPresent) {
        const winner = winnerName.textContent;
        const prize = prizes[currentPrizeIndex];
        
        if (isPresent) {
            // Add to winners list
            if (!winners[prize.name]) {
                winners[prize.name] = [];
            }
            winners[prize.name].push(winner);
            
            // Decrement remaining count
            prize.remaining--;
            currentPrizeRemaining = prize.remaining;
            remainingCount.textContent = currentPrizeRemaining;
            
            // Update UI to show winner is present in the current prize section
            const winnerItem = document.createElement('div');
            winnerItem.classList.add('winner-item', 'animate__animated', 'animate__fadeIn');
            winnerItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeWinners.appendChild(winnerItem);
        } else {
            // Add to absent list
            absentParticipants.push(winner);
            
            // Add to current prize absent winners list
            currentPrizeAbsentWinners.push(winner);
            
            // Update UI to show winner is absent in the current prize section
            const absentItem = document.createElement('div');
            absentItem.classList.add('prize-item', 'text-muted', 'animate__animated', 'animate__fadeIn');
            absentItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeAbsent.appendChild(absentItem);
            
            // Remove from all participants for future drawings
            const index = participants.indexOf(winner);
            if (index !== -1) {
                participants.splice(index, 1);
            }
        }
        
        // Reset UI for next draw
        winnerConfirmation.classList.add('d-none');
        drawBtn.disabled = false;
        drawingName.classList.remove('draw-animation');
        drawingName.textContent = '點擊抽獎按鈕';
        
        // Check if we need to move to the next prize or finish
        checkDrawingProgress();
    }
    
    function checkDrawingProgress() {
        const currentPrize = prizes[currentPrizeIndex];
        
        // If current prize is done
        if (currentPrize.remaining <= 0) {
            currentPrizeIndex++;
            
            // Check if all prizes are done
            if (currentPrizeIndex >= prizes.length) {
                finishDrawing();
                return;
            }
            
            // Move to next prize
            setCurrentPrize();
            
            // Reset eligible participants for the next prize
            eligibleParticipants = [...participants];
            
            // Clear current prize winners and absent lists for the new prize
            currentPrizeWinners.innerHTML = '';
            currentPrizeAbsent.innerHTML = '';
            currentPrizeAbsentWinners = [];
        }
    }
    
    function finishDrawing() {
        // Display final results
        drawingSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            drawingSection.classList.add('d-none');
            displayFinalResults();
            resultsSection.classList.remove('d-none');
            resultsSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    function displayFinalResults() {
        winnersList.innerHTML = '';
        
        // Display winners by prize category
        prizes.forEach(prize => {
            const prizeWinners = winners[prize.name] || [];
            
            if (prizeWinners.length > 0) {
                const prizeHeader = document.createElement('h4');
                prizeHeader.className = 'mt-3 mb-2';
                prizeHeader.textContent = prize.name;
                winnersList.appendChild(prizeHeader);
                
                prizeWinners.forEach(winner => {
                    const winnerItem = document.createElement('div');
                    winnerItem.className = 'winner-item';
                    winnerItem.innerHTML = `<strong>${winner}</strong>`;
                    winnersList.appendChild(winnerItem);
                });
            }
        });
        
        // Display absent participants if any
        if (absentParticipants.length > 0) {
            const absentHeader = document.createElement('h4');
            absentHeader.className = 'mt-4 mb-2 text-muted';
            absentHeader.textContent = '未在場參加者';
            winnersList.appendChild(absentHeader);
            
            absentParticipants.forEach(absent => {
                const absentItem = document.createElement('div');
                absentItem.className = 'prize-item text-muted';
                absentItem.innerHTML = `<strong>${absent}</strong>`;
                winnersList.appendChild(absentItem);
            });
        }
    }
    
    function reset() {
        // Clear inputs
        prizesInput.value = '';
        participantsInput.value = '';
        
        // Reset state
        prizes = [];
        participants = [];
        eligibleParticipants = [];
        winners = {};
        absentParticipants = [];
        currentPrizeIndex = 0;
        currentPrizeAbsentWinners = [];
        
        // Reset UI
        winnersList.innerHTML = '';
        currentPrizeWinners.innerHTML = '';
        currentPrizeAbsent.innerHTML = '';
        drawingName.textContent = '準備開始...';
        setPrizesValid();
        setParticipantsValid();
        
        // Show setup section
        resultsSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            resultsSection.classList.add('d-none');
            setupSection.classList.remove('d-none', 'animate__fadeOutUp');
            setupSection.classList.add('animate__fadeInUp');
        }, 500);
    }
});