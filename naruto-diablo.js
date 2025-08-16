// Naruto Shippuden: Ninja Legends - Game Logic
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.enemies = [];
        this.particles = [];
        this.gameLog = document.getElementById('game-log');
        this.inventory = [];
        this.gameState = 'character-select';
        this.lastTime = 0;
        
        this.initializeInventory();
        this.bindEvents();
        this.gameLoop();
    }
    
    initializeInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.addEventListener('click', () => this.useItem(i));
            inventoryGrid.appendChild(slot);
            this.inventory.push(null);
        }
    }
    
    bindEvents() {
        // Character selection
        document.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const character = e.currentTarget.dataset.character;
                this.selectCharacter(character);
            });
        });
        
        // Canvas controls
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.handleCanvasClick(e);
            }
        });
        
        // Skill buttons
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.target.id;
                this.useSkill(skill);
            });
        });
    }
    
    selectCharacter(characterType) {
        const characters = {
            naruto: {
                name: 'Naruto Uzumaki',
                maxHealth: 150,
                maxChakra: 80,
                attack: 15,
                defense: 8,
                speed: 3,
                color: '#ff6b35',
                skills: ['rasengan', 'shadowClone', 'heal', 'windStyle']
            },
            sasuke: {
                name: 'Sasuke Uchiha',
                maxHealth: 120,
                maxChakra: 100,
                attack: 20,
                defense: 6,
                speed: 4,
                color: '#2c3e50',
                skills: ['chidori', 'fireball', 'sharingan', 'lightning']
            },
            sakura: {
                name: 'Sakura Haruno',
                maxHealth: 100,
                maxChakra: 120,
                attack: 12,
                defense: 10,
                speed: 3.5,
                color: '#e91e63',
                skills: ['heal', 'strengthBoost', 'medicalNinjutsu', 'punch']
            },
            kakashi: {
                name: 'Kakashi Hatake',
                maxHealth: 130,
                maxChakra: 90,
                attack: 18,
                defense: 12,
                speed: 3.8,
                color: '#95a5a6',
                skills: ['copyTechnique', 'lightning', 'chidori', 'kamui']
            }
        };
        
        const charData = characters[characterType];
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            charData
        );
        
        this.updateCharacterUI();
        this.gameState = 'playing';
        document.getElementById('character-select').style.display = 'none';
        this.addToLog(`${charData.name} enters the battlefield!`);
        this.spawnEnemies();
        
        // Add some starting items
        this.addItem('Kunai', 0);
        this.addItem('Shuriken', 1);
        this.addItem('Health Potion', 2);
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on enemy
        let targetEnemy = null;
        for (let enemy of this.enemies) {
            const dist = Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2);
            if (dist < enemy.size) {
                targetEnemy = enemy;
                break;
            }
        }
        
        if (targetEnemy) {
            this.player.attack(targetEnemy);
        } else {
            this.player.moveTo(x, y);
        }
    }
    
    useSkill(skillName) {
        const skillCosts = {
            rasengan: 20,
            shadowClone: 15,
            heal: 10,
            windStyle: 25,
            chidori: 25,
            fireball: 20,
            sharingan: 15,
            lightning: 18
        };
        
        const cost = skillCosts[skillName] || 10;
        
        if (this.player.chakra >= cost) {
            this.player.chakra -= cost;
            this.executeSkill(skillName);
            this.updateCharacterUI();
        } else {
            this.addToLog('Not enough chakra!');
        }
    }
    
    executeSkill(skillName) {
        switch(skillName) {
            case 'rasengan':
                this.addToLog('Naruto uses Rasengan!');
                this.damageNearbyEnemies(50, 80);
                break;
            case 'shadowClone':
                this.addToLog('Shadow Clone Jutsu!');
                this.player.attack += 5;
                setTimeout(() => { this.player.attack -= 5; }, 10000);
                break;
            case 'heal':
                const healAmount = 30;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
                this.addToLog(`Healed for ${healAmount} HP!`);
                this.showFloatingText(this.player.x, this.player.y, `+${healAmount}`, '#27ae60');
                break;
            case 'windStyle':
                this.addToLog('Wind Style: Rasenshuriken!');
                this.damageNearbyEnemies(70, 120);
                break;
        }
    }
    
    damageNearbyEnemies(damage, range) {
        for (let enemy of this.enemies) {
            const dist = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
            if (dist <= range) {
                enemy.takeDamage(damage);
                this.showFloatingText(enemy.x, enemy.y, `-${damage}`, '#e74c3c');
            }
        }
    }
    
    spawnEnemies() {
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.enemies.push(new Enemy(x, y));
        }
    }
    
    addItem(name, slot) {
        if (slot < this.inventory.length) {
            this.inventory[slot] = name;
            this.updateInventoryUI();
        }
    }
    
    useItem(slot) {
        const item = this.inventory[slot];
        if (item) {
            switch(item) {
                case 'Health Potion':
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                    this.addToLog('Used Health Potion!');
                    break;
                case 'Chakra Pill':
                    this.player.chakra = Math.min(this.player.maxChakra, this.player.chakra + 30);
                    this.addToLog('Used Chakra Pill!');
                    break;
            }
            this.inventory[slot] = null;
            this.updateInventoryUI();
            this.updateCharacterUI();
        }
    }
    
    updateInventoryUI() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            if (this.inventory[index]) {
                slot.textContent = this.inventory[index].charAt(0);
                slot.classList.add('has-item');
                slot.title = this.inventory[index];
            } else {
                slot.textContent = '';
                slot.classList.remove('has-item');
                slot.title = '';
            }
        });
    }
    
    updateCharacterUI() {
        if (!this.player) return;
        
        document.getElementById('character-name').textContent = this.player.name;
        document.getElementById('health-text').textContent = `${this.player.health}/${this.player.maxHealth}`;
        document.getElementById('chakra-text').textContent = `${this.player.chakra}/${this.player.maxChakra}`;
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('exp').textContent = this.player.exp;
        document.getElementById('exp-needed').textContent = this.player.expNeeded;
        document.getElementById('attack').textContent = this.player.attack;
        document.getElementById('defense').textContent = this.player.defense;
        
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const chakraPercent = (this.player.chakra / this.player.maxChakra) * 100;
        
        document.getElementById('health-fill').style.width = healthPercent + '%';
        document.getElementById('chakra-fill').style.width = chakraPercent + '%';
    }
    
    addToLog(message) {
        const p = document.createElement('p');
        p.textContent = message;
        this.gameLog.appendChild(p);
        this.gameLog.scrollTop = this.gameLog.scrollHeight;
        
        // Keep only last 50 messages
        while (this.gameLog.children.length > 50) {
            this.gameLog.removeChild(this.gameLog.firstChild);
        }
    }
    
    showFloatingText(x, y, text, color) {
        const textElement = document.createElement('div');
        textElement.textContent = text;
        textElement.className = color === '#27ae60' ? 'heal-text' : 'damage-text';
        textElement.style.left = x + 'px';
        textElement.style.top = y + 'px';
        document.body.appendChild(textElement);
        
        setTimeout(() => {
            document.body.removeChild(textElement);
        }, 1000);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player);
            
            if (enemy.health <= 0) {
                this.player.gainExp(20);
                this.addToLog(`Defeated ${enemy.name}!`);
                this.enemies.splice(i, 1);
                
                // Random item drop
                if (Math.random() < 0.3) {
                    const items = ['Health Potion', 'Chakra Pill', 'Kunai', 'Shuriken'];
                    const item = items[Math.floor(Math.random() * items.length)];
                    for (let j = 0; j < this.inventory.length; j++) {
                        if (!this.inventory[j]) {
                            this.addItem(item, j);
                            this.addToLog(`Found ${item}!`);
                            break;
                        }
                    }
                }
            }
        }
        
        // Spawn new enemies periodically
        if (this.enemies.length < 3 && Math.random() < 0.01) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.enemies.push(new Enemy(x, y));
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.updateCharacterUI();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.ctx.fillStyle = '#1abc9c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render particles
        this.particles.forEach(particle => particle.render(this.ctx));
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Player {
    constructor(x, y, characterData) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 15;
        this.name = characterData.name;
        this.maxHealth = characterData.maxHealth;
        this.health = this.maxHealth;
        this.maxChakra = characterData.maxChakra;
        this.chakra = this.maxChakra;
        this.attack = characterData.attack;
        this.defense = characterData.defense;
        this.speed = characterData.speed;
        this.color = characterData.color;
        this.level = 1;
        this.exp = 0;
        this.expNeeded = 100;
        this.isMoving = false;
    }
    
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
    }
    
    update(deltaTime) {
        // Movement
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                const moveSpeed = this.speed * (deltaTime / 16);
                this.x += (dx / distance) * moveSpeed;
                this.y += (dy / distance) * moveSpeed;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            }
        }
        
        // Regenerate chakra slowly
        if (this.chakra < this.maxChakra) {
            this.chakra = Math.min(this.maxChakra, this.chakra + 0.1);
        }
    }
    
    attack(target) {
        const distance = Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2);
        if (distance <= 50) {
            const damage = this.attack + Math.floor(Math.random() * 10);
            target.takeDamage(damage);
            game.showFloatingText(target.x, target.y, `-${damage}`, '#e74c3c');
            game.addToLog(`${this.name} attacks for ${damage} damage!`);
        }
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expNeeded) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.exp = 0;
        this.expNeeded = Math.floor(this.expNeeded * 1.5);
        
        // Stat increases
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.maxChakra += 10;
        this.chakra = this.maxChakra;
        this.attack += 3;
        this.defense += 2;
        
        game.addToLog(`Level up! Now level ${this.level}!`);
    }
    
    render(ctx) {
        // Draw player
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw health bar
        const barWidth = 30;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 10;
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Draw name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - this.size - 15);
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.attack = 8;
        this.speed = 1.5;
        this.color = '#8e44ad';
        this.name = this.getRandomEnemyName();
        this.attackCooldown = 0;
    }
    
    getRandomEnemyName() {
        const names = ['Rogue Ninja', 'Bandït', 'Missing-nin', 'Akatsuki Member', 'Sound Ninja'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    update(deltaTime, player) {
        if (!player) return;
        
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.size + player.size + 5) {
            const moveSpeed = this.speed * (deltaTime / 16);
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        } else {
            // Attack player
            if (this.attackCooldown <= 0) {
                this.attackPlayer(player);
                this.attackCooldown = 1000; // 1 second cooldown
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
    
    attackPlayer(player) {
        const damage = Math.max(1, this.attack - player.defense);
        player.health -= damage;
        game.showFloatingText(player.x, player.y, `-${damage}`, '#e74c3c');
        game.addToLog(`${this.name} attacks for ${damage} damage!`);
        
        if (player.health <= 0) {
            game.addToLog('Game Over! You have been defeated.');
            // Could implement respawn logic here
            player.health = 1;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    render(ctx) {
        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw health bar
        const barWidth = 24;
        const barHeight = 3;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 8;
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});