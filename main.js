// Упрощенная система баффов - теперь это просто объекты с числовыми модификаторами
const buffDefinitions = {
    block: {
      name: 'Блок',
      description: 'Блокирует один случайный выбор противника в следующем раунде.',
      duration: 1,
      blocksEnemyChoice: true
    },
    tie_damage: {
      name: 'Ничья+',
      description: 'При ничейном результате вы наносите 1 урон противнику.',
      duration: 2,
      tieDamageToEnemy: 1
    },
    chaos: {
      name: 'Хаос',
      description: 'Рандомизирует выборы обеих сторон.',
      duration: 1,
      randomizesChoices: true
    },
    double: {
      name: 'x2',
      description: 'При победе наносите двойной урон (2 вместо 1).',
      duration: 3,
      winDamageMultiplier: 2
    },
    counter: {
      name: 'Контр',
      description: 'При поражении наносите 1 урон противнику.',
      duration: 2,
      loseDamageToEnemy: 1
    },
    shield: {
      name: 'Щит',
      description: 'Уменьшает получаемый урон на 1 (минимум 0).',
      duration: 3,
      damageReduction: 1
    },
    rage: {
      name: 'Ярость',
      description: 'Увеличивает наносимый урон на 1.',
      duration: 2,
      damageBonus: 1
    }
  };
  
  // Состояние игры
  let gameState = {
    phase: 'selecting', // 'selecting', 'reveal', 'result'
    playerHealth: 10,
    enemyHealth: 10,
    playerChoice: null,
    playerBuff: null,
    playerActiveBuffs: [], // Массив объектов { type, name, duration, ...properties }
    enemyChoice: null,
    blockedChoices: [],
    round: 1,
    choiceNames: { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' }
  };
  
  // Данные игры
  const choices = ['rock', 'paper', 'scissors'];
  const choiceEmojis = { rock: '✊', paper: '✋', scissors: '✌️' };
  
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
  
  // Функция для добавления баффа игроку
  function addBuffToPlayer(buffType) {
    const buffDef = buffDefinitions[buffType];
    if (!buffDef) return;
    
    // Проверяем, есть ли уже такой бафф
    const existingBuffIndex = gameState.playerActiveBuffs.findIndex(b => b.type === buffType);
    if (existingBuffIndex >= 0) {
      // Обновляем длительность существующего баффа
      gameState.playerActiveBuffs[existingBuffIndex].duration = buffDef.duration;
    } else {
      // Добавляем новый бафф
      gameState.playerActiveBuffs.push({
        type: buffType,
        name: buffDef.name,
        duration: buffDef.duration,
        ...buffDef // Копируем все свойства из определения
      });
    }
  }
  
  // Функция для уменьшения длительности баффов
  function decreaseBuffDuration() {
    gameState.playerActiveBuffs = gameState.playerActiveBuffs.filter(buff => {
      buff.duration--;
      return buff.duration > 0;
    });
  }
  
  // Функция для получения суммы определенного модификатора из всех активных баффов
  function getBuffModifier(property) {
    return gameState.playerActiveBuffs.reduce((sum, buff) => {
      return sum + (buff[property] || 0);
    }, 0);
  }
  
  // Функция для проверки наличия баффа с определенным свойством
  function hasBuffWithProperty(property) {
    return gameState.playerActiveBuffs.some(buff => buff[property]);
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
    const buff = buffDefinitions[buffType];
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
      addBuffToPlayer(gameState.playerBuff);
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
    let resultMessages = [];
  
    // Применяем специальные эффекты баффов
    
    // 1. Блокировка выбора врага
    if (hasBuffWithProperty('blocksEnemyChoice')) {
      const blockedChoice = choices[Math.floor(Math.random() * choices.length)];
      if (finalEnemyChoice === blockedChoice) {
        const availableChoices = choices.filter(choice => choice !== blockedChoice);
        finalEnemyChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
        resultMessages.push(`Блок заблокировал ${gameState.choiceNames[blockedChoice]}!`);
      }
    }
    
    // 2. Рандомизация выборов
    if (hasBuffWithProperty('randomizesChoices')) {
      finalPlayerChoice = choices[Math.floor(Math.random() * choices.length)];
      finalEnemyChoice = choices[Math.floor(Math.random() * choices.length)];
      resultMessages.push('Хаос изменил выборы!');
    }
  
    const winner = getWinner(finalPlayerChoice, finalEnemyChoice);
    
    // Базовый урон в зависимости от результата
    if (winner === 'tie') {
      resultMessages.push('Ничья!');
      enemyDamage += getBuffModifier('tieDamageToEnemy');
      if (getBuffModifier('tieDamageToEnemy') > 0) {
        resultMessages.push('Ничья+ наносит урон!');
      }
    } else if (winner === 'player') {
      resultMessages.push('Вы победили!');
      
      // Базовый урон при победе
      let winDamage = 1;
      
      // Применяем множитель урона при победе
      const winMultiplier = getBuffModifier('winDamageMultiplier');
      if (winMultiplier > 0) {
        winDamage = winMultiplier;
        resultMessages.push('Двойной урон!');
      }
      
      // Добавляем бонус к урону
      winDamage += getBuffModifier('damageBonus');
      if (getBuffModifier('damageBonus') > 0) {
        resultMessages.push('Ярость увеличивает урон!');
      }
      
      enemyDamage += winDamage;
    } else {
      resultMessages.push('Враг победил!');
      playerDamage += 1;
      
      // Контратака при поражении
      enemyDamage += getBuffModifier('loseDamageToEnemy');
      if (getBuffModifier('loseDamageToEnemy') > 0) {
        resultMessages.push('Контратака!');
      }
    }
  
    // Применяем защиту от урона
    if (playerDamage > 0) {
      const reduction = getBuffModifier('damageReduction');
      if (reduction > 0) {
        playerDamage = Math.max(0, playerDamage - reduction);
        resultMessages.push('Щит защитил!');
      }
    }
  
    // Применяем урон (минимум 0)
    playerDamage = Math.max(0, playerDamage);
    enemyDamage = Math.max(0, enemyDamage);
    
    gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
  
    // Обновляем интерфейс
    elements.resultText.textContent = resultMessages.join(' ');
    
    const playerBuffsText = gameState.playerActiveBuffs.map(b => b.name).join(', ') || 'Без усилений';
    
    elements.resultDetails.textContent = `Вы: ${gameState.choiceNames[finalPlayerChoice]} + ${playerBuffsText} | Враг: ${gameState.choiceNames[finalEnemyChoice]}`;
    
    gameState.phase = 'result';
    updateDisplay();
    updateHealthBars();
  
    // Проверяем конец игры
    if (gameState.playerHealth <= 0 || gameState.enemyHealth <= 0) {
      showGameOver();
    }
  }
  
  // Отображение активных баффов
  function updateActiveBuffsDisplay() {
    const playerBuffsContainer = document.getElementById('player-active-buffs');
    
    if (!playerBuffsContainer) return;
    
    // Очищаем контейнер
    playerBuffsContainer.innerHTML = '';
    
    // Отображаем баффы игрока
    gameState.playerActiveBuffs.forEach(buff => {
      const buffElement = document.createElement('div');
      buffElement.className = 'active-buff';
      buffElement.innerHTML = `
        <span class="buff-name">${buff.name}</span>
        <span class="buff-duration">${buff.duration}</span>
      `;
      playerBuffsContainer.appendChild(buffElement);
    });
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
      blockedChoices: [],
      round: 1,
      choiceNames: { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' }
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
      elements.blockedChoices.textContent = `Заблокировано: ${gameState.blockedChoices.map(c => gameState.choiceNames[c]).join(', ')}`;
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