// Состояние игры
let gameState = {
    phase: 'selecting', // 'selecting', 'reveal', 'result'
    playerHealth: 10,
    enemyHealth: 10,
    playerChoice: null,
    playerBuff: null,
    playerActiveBuffs: [], // Массив активных баффов с длительностью
    enemyChoice: null,
    enemyActiveBuffs: [], // Массив активных баффов врага с длительностью
    blockedChoices: [],
    round: 1
  };
  
  // Данные игры
  const choices = ['rock', 'paper', 'scissors'];
  const choiceEmojis = { rock: '✊', paper: '✋', scissors: '✌️' };
  const choiceNames = { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' };
  
  const buffs = {
    block: { 
        name: 'Блок', 
        description: 'Блокирует один случайный выбор противника в следующем раунде. Враг не сможет использовать заблокированное действие.',
        duration: 1
    },
    tie_damage: { 
        name: 'Ничья+', 
        description: 'При ничейном результате вы наносите 1 урон противнику. Превращает ничью в ваше преимущество.',
        duration: 2
    },
    chaos: { 
        name: 'Хаос', 
        description: 'Рандомизирует выборы обеих сторон. Никто не знает, что получится - полная случайность!',
        duration: 1
    },
    double: { 
        name: 'x2', 
        description: 'При победе наносите двойной урон (2 вместо 1). Мощная атака для решающего удара.',
        duration: 3
    },
    counter: { 
        name: 'Контр', 
        description: 'При поражении наносите 1 урон противнику. Даже проигрывая, вы не остаетесь без ответа.',
        duration: 2
    },
    shield: { 
        name: 'Щит', 
        description: 'Уменьшает получаемый урон на 1 (минимум 0). Надежная защита от атак противника.',
        duration: 3
    },
    rage: { 
        name: 'Ярость', 
        description: 'Увеличивает наносимый урон на 1. Ваши атаки становятся более разрушительными.',
        duration: 2
    }
  };
  
  // Элементы DOM
  const elements = {
    roundNumber: document.getElementById('round-number'),
    playerHealth: document.getElementById('player-health'),
    enemyHealth: document.getElementById('enemy-health'),
    playerChoice: document.getElementById('player-choice'),
    enemyChoice: document.getElementById('enemy-choice'),
    resultSection: document.getElementById('result-section'),
    resultText: document.getElementById('result-text'),
    resultDetails: document.getElementById('result-details'),
    gameInterface: document.getElementById('game-interface'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    gameOver: document.getElementById('game-over'),
    gameOverTitle: document.getElementById('game-over-title'),
    makeMoveBtn: document.getElementById('make-move-btn'),
    blockedChoices: document.getElementById('blocked-choices'),
    buffInfoSection: document.getElementById('buff-info-section'),
    buffInfoTitle: document.getElementById('buff-info-title'),
    buffInfoDescription: document.getElementById('buff-info-description')
  };
  
  // Функция для добавления баффа
  function addBuff(target, buffType) {
    const buff = {
        type: buffType,
        duration: buffs[buffType].duration
    };
    
    if (target === 'player') {
        // Проверяем, есть ли уже такой бафф
        const existingBuff = gameState.playerActiveBuffs.find(b => b.type === buffType);
        if (existingBuff) {
            existingBuff.duration = buffs[buffType].duration; // Обновляем длительность
        } else {
            gameState.playerActiveBuffs.push(buff);
        }
    } else {
        const existingBuff = gameState.enemyActiveBuffs.find(b => b.type === buffType);
        if (existingBuff) {
            existingBuff.duration = buffs[buffType].duration;
        } else {
            gameState.enemyActiveBuffs.push(buff);
        }
    }
  }
  
  // Функция для уменьшения длительности баффов
  function decreaseBuffDuration() {
    gameState.playerActiveBuffs = gameState.playerActiveBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
    
    gameState.enemyActiveBuffs = gameState.enemyActiveBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
  }
  
  // Функция для проверки наличия баффа
  function hasBuff(target, buffType) {
    const buffs = target === 'player' ? gameState.playerActiveBuffs : gameState.enemyActiveBuffs;
    return buffs.some(buff => buff.type === buffType);
  }
  
  // Функция для отображения активных баффов
  function updateActiveBuffsDisplay() {
    const playerBuffsContainer = document.getElementById('player-active-buffs');
    const enemyBuffsContainer = document.getElementById('enemy-active-buffs');
    
    if (!playerBuffsContainer || !enemyBuffsContainer) return;
    
    // Очищаем контейнеры
    playerBuffsContainer.innerHTML = '';
    enemyBuffsContainer.innerHTML = '';
    
    // Отображаем баффы игрока
    gameState.playerActiveBuffs.forEach(buff => {
        const buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.innerHTML = `
            <span class="buff-name">${buffs[buff.type].name}</span>
            <span class="buff-duration">${buff.duration}</span>
        `;
        playerBuffsContainer.appendChild(buffElement);
    });
    
    // Отображаем баффы врага
    gameState.enemyActiveBuffs.forEach(buff => {
        const buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.innerHTML = `
            <span class="buff-name">${buffs[buff.type].name}</span>
            <span class="buff-duration">${buff.duration}</span>
        `;
        enemyBuffsContainer.appendChild(buffElement);
    });
  }
  
  // Инициализация
  function init() {
    updateHealthBars();
    updateRoundNumber();
    setupEventListeners();
    updateBlockedChoices();
    updateActiveBuffsDisplay();
    updateDisplay();
    clearBuffInfo();
  }
  
  // Обновление полосок здоровья
  function updateHealthBars() {
    // Здоровье игрока
    elements.playerHealth.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const healthPoint = document.createElement('div');
        healthPoint.className = `health-point ${i < gameState.playerHealth ? 'health-full' : 'health-empty'}`;
        elements.playerHealth.appendChild(healthPoint);
    }
  
    // Здоровье врага
    elements.enemyHealth.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const healthPoint = document.createElement('div');
        healthPoint.className = `health-point ${i < gameState.enemyHealth ? 'health-full' : 'health-empty'}`;
        elements.enemyHealth.appendChild(healthPoint);
    }
  }
  
  // Обновление номера раунда
  function updateRoundNumber() {
    elements.roundNumber.textContent = gameState.round;
  }
  
  // Показать информацию о баффе
  function showBuffInfo(buffType) {
    const buff = buffs[buffType];
    elements.buffInfoTitle.textContent = `${buff.name} (${buff.duration} ходов)`;
    elements.buffInfoDescription.textContent = buff.description;
  }
  
  // Очистить информацию о баффе
  function clearBuffInfo() {
    elements.buffInfoTitle.textContent = '';
    elements.buffInfoDescription.textContent = '';
  }
  
  // Настройка слушателей событий
  function setupEventListeners() {
    // Выбор действий
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const choice = e.target.dataset.choice;
            if (gameState.blockedChoices.includes(choice)) return;
            
            // Убираем выделение с других кнопок
            document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
            
            if (gameState.playerChoice === choice) {
                gameState.playerChoice = null;
            } else {
                gameState.playerChoice = choice;
                e.target.classList.add('selected');
            }
            updateMakeMoveButton();
        });
    });
  
    // Выбор баффов
    document.querySelectorAll('.buff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const buffType = e.target.dataset.buff;
            
            // Убираем выделение с других кнопок баффов
            document.querySelectorAll('.buff-btn').forEach(b => b.classList.remove('selected'));
            
            if (gameState.playerBuff === buffType) {
                // Если уже выбран этот бафф, отменяем выбор
                gameState.playerBuff = null;
                clearBuffInfo();
            } else {
                // Выбираем новый бафф
                gameState.playerBuff = buffType;
                e.target.classList.add('selected');
                showBuffInfo(buffType);
            }
            
            updateMakeMoveButton();
        });
    });
  
    // Кнопка хода
    elements.makeMoveBtn.addEventListener('click', makeMove);
  
    // Кнопка следующего раунда
    elements.nextRoundBtn.addEventListener('click', nextRound);
  
    // Кнопка новой игры
    document.getElementById('new-game-btn').addEventListener('click', newGame);
  }
  
  // Обновление кнопки хода
  function updateMakeMoveButton() {
    const canMove = gameState.playerChoice;
    elements.makeMoveBtn.disabled = !canMove;
  }
  
  // Сделать ход
  function makeMove() {
    // Применяем выбранный бафф если есть
    if (gameState.playerBuff) {
        addBuff('player', gameState.playerBuff);
        gameState.playerBuff = null;
    }
    
    gameState.phase = 'reveal';
    generateEnemyMove();
    updateDisplay();
    
    // Убираем задержку и сразу показываем результат
    setTimeout(() => {
        calculateResult();
    }, 500);
  }
  
  // Генерация хода врага
  function generateEnemyMove() {
    // Генерируем случайный выбор для врага
    gameState.enemyChoice = choices[Math.floor(Math.random() * choices.length)];
    
    // ОТКЛЮЧИЛИ: Генерация случайного баффа для врага
    // const randomBuff = Object.keys(buffs)[Math.floor(Math.random() * Object.keys(buffs).length)];
    // addBuff('enemy', randomBuff);
  }
  
  // Определение победителя
  function getWinner(choice1, choice2) {
    if (choice1 === choice2) return 'tie';
    if (
        (choice1 === 'rock' && choice2 === 'scissors') ||
        (choice1 === 'paper' && choice2 === 'rock') ||
        (choice1 === 'scissors' && choice2 === 'paper')
    ) {
        return 'player';
    }
    return 'enemy';
  }
  
  // Расчет результата
  function calculateResult() {
    let finalPlayerChoice = gameState.playerChoice;
    let finalEnemyChoice = gameState.enemyChoice;
    let playerDamage = 0;
    let enemyDamage = 0;
    let resultText = '';
  
    // Применяем блок игрока - блокируем врага
    if (hasBuff('player', 'block')) {
        const blockedChoice = choices[Math.floor(Math.random() * choices.length)];
        if (finalEnemyChoice === blockedChoice) {
            // Заставляем врага выбрать другой вариант
            const availableChoices = choices.filter(choice => choice !== blockedChoice);
            finalEnemyChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
            resultText += `Блок заблокировал ${choiceNames[blockedChoice]} у врага! `;
        }
    }
  
    // УБРАЛИ: Применяем блок врага - теперь у врага нет баффов
    
    // Применяем хаос
    if (hasBuff('player', 'chaos')) {
        finalPlayerChoice = choices[Math.floor(Math.random() * choices.length)];
        finalEnemyChoice = choices[Math.floor(Math.random() * choices.length)];
        resultText += 'Хаос изменил выборы! ';
    }
  
    const winner = getWinner(finalPlayerChoice, finalEnemyChoice);
    
    if (winner === 'tie') {
        resultText += 'Ничья! ';
        if (hasBuff('player', 'tie_damage')) {
            enemyDamage += 1;
            resultText += 'Ничья+ наносит урон врагу! ';
        }
        // УБРАЛИ: Ничья+ у врага
    } else if (winner === 'player') {
        resultText += 'Вы победили! ';
        enemyDamage += 1;
        if (hasBuff('player', 'double')) {
            enemyDamage += 1;
            resultText += 'Двойной урон! ';
        }
        // УБРАЛИ: Контратака врага
    } else {
        resultText += 'Враг победил! ';
        playerDamage += 1;
        // УБРАЛИ: Двойной урон врага
        if (hasBuff('player', 'counter')) {
            enemyDamage += 1;
            resultText += 'Ваша контратака! ';
        }
    }
  
    // Применяем щиты
    if (hasBuff('player', 'shield') && playerDamage > 0) {
        playerDamage = Math.max(0, playerDamage - 1);
        resultText += 'Щит защитил вас! ';
    }
    // УБРАЛИ: Щит врага
  
    // Применяем ярость
    if (hasBuff('player', 'rage')) {
        enemyDamage += 1;
        resultText += 'Ярость увеличивает урон! ';
    }
    // УБРАЛИ: Ярость врага
  
    // Применяем урон
    gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
  
    // Обновляем интерфейс
    elements.resultText.textContent = resultText;
    
    const playerBuffsText = gameState.playerActiveBuffs.map(b => buffs[b.type].name).join(', ') || 'Без усилений';
    // ИЗМЕНИЛИ: Враг всегда без усилений
    const enemyBuffsText = 'Без усилений';
    
    elements.resultDetails.textContent = `Вы: ${choiceNames[finalPlayerChoice]} + ${playerBuffsText} | Враг: ${choiceNames[finalEnemyChoice]} + ${enemyBuffsText}`;
    
    gameState.phase = 'result';
    updateDisplay();
    updateHealthBars();
  
    // Проверяем конец игры
    if (gameState.playerHealth <= 0 || gameState.enemyHealth <= 0) {
        showGameOver();
    }
  }
  
  // Показать конец игры
  function showGameOver() {
    elements.gameOverTitle.textContent = gameState.playerHealth <= 0 ? 'ПОРАЖЕНИЕ' : 'ПОБЕДА!';
    elements.gameOver.classList.remove('hidden');
    elements.gameInterface.classList.add('hidden');
    elements.nextRoundBtn.classList.add('hidden');
  }
  
  // Следующий раунд
  function nextRound() {
    gameState.round++;
    gameState.phase = 'selecting';
    gameState.playerChoice = null;
    gameState.playerBuff = null;
    gameState.enemyChoice = null;
    gameState.blockedChoices = [];
    
    // Уменьшаем длительность баффов
    decreaseBuffDuration();
    
    updateRoundNumber();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    clearBuffInfo();
    updateBlockedChoices();
  }
  
  // Новая игра
  function newGame() {
    gameState = {
        phase: 'selecting',
        playerHealth: 10,
        enemyHealth: 10,
        playerChoice: null,
        playerBuff: null,
        playerActiveBuffs: [],
        enemyChoice: null,
        enemyActiveBuffs: [],
        blockedChoices: [],
        round: 1
    };
    
    updateRoundNumber();
    updateHealthBars();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    clearBuffInfo();
    updateBlockedChoices();
    elements.gameOver.classList.add('hidden');
  }
  
  // Обновление отображения
  function updateDisplay() {
    // Обновляем выборы
    elements.playerChoice.textContent = gameState.phase === 'selecting' ? '?' : 
                                     gameState.phase === 'reveal' ? '...' : 
                                     choiceEmojis[gameState.playerChoice];
    
    elements.enemyChoice.textContent = gameState.phase === 'selecting' ? '?' : 
                                     gameState.phase === 'reveal' ? '...' : 
                                     choiceEmojis[gameState.enemyChoice];
  
    // Показываем/скрываем элементы
    if (gameState.phase === 'result') {
        elements.resultSection.classList.remove('hidden');
        elements.gameInterface.classList.add('hidden');
        if (gameState.playerHealth > 0 && gameState.enemyHealth > 0) {
            elements.nextRoundBtn.classList.remove('hidden');
        }
    } else {
        elements.resultSection.classList.add('hidden');
        elements.gameInterface.classList.remove('hidden');
        elements.nextRoundBtn.classList.add('hidden');
    }
    
    // Обновляем отображение активных баффов
    updateActiveBuffsDisplay();
  }
  
  // Обновление заблокированных выборов
  function updateBlockedChoices() {
    // Сбрасываем все блокировки
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('blocked');
    });
  
    // Применяем текущие блокировки
    gameState.blockedChoices.forEach(choice => {
        const btn = document.querySelector(`[data-choice="${choice}"]`);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('blocked');
        }
    });
  
    // Показываем информацию о блокировках
    if (gameState.blockedChoices.length > 0) {
        elements.blockedChoices.textContent = `Заблокировано: ${gameState.blockedChoices.map(c => choiceNames[c]).join(', ')}`;
        elements.blockedChoices.classList.remove('hidden');
    } else {
        elements.blockedChoices.classList.add('hidden');
    }
  }
  
  // Очистка выделений
  function clearSelections() {
    document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.buff-btn').forEach(btn => btn.classList.remove('selected'));
    updateMakeMoveButton();
  }
  
  // Запуск игры
  init();