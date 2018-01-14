var app = new PIXI.Application();

document.body.appendChild(app.view);

app.renderer.view.style.position = 'absolute';
app.renderer.view.style.left = '50%';
app.renderer.view.style.top = '50%';
app.renderer.view.style.transform = 'translate3d( -50%, -50%, 0 )';

var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    keyboard = keyboardJS,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle,
    Rectangle = PIXI.Rectangle,
    TextureCache = PIXI.TextureCache,
    TilingSprite = PIXI.TilingSprite;

loader
    .add('backgroundTile', 'img/backgroundTile.png')
    .add('player', 'img/playerShip1_blue.png')
    .add('playerLaser', 'img/Lasers/laserBlue01.png')
    .add('enemyLaser', 'img/Lasers/laserRed01.png')
    .add('enemyRed1', 'img/Enemies/enemyRed1.png')
    .add('enemyRed2', 'img/Enemies/enemyRed2.png')
    .add('enemyRed3', 'img/Enemies/enemyRed3.png')
    .add('meteorBig1', 'img/Meteors/meteorGrey_big1.png')
    .add('meteorBig2', 'img/Meteors/meteorGrey_big2.png')
    .add('meteorBig3', 'img/Meteors/meteorGrey_big3.png')
    .add('meteorMed1', 'img/Meteors/meteorGrey_med1.png')
    .add('meteorMed2', 'img/Meteors/meteorGrey_med2.png')
    .add('meteorSmall1', 'img/Meteors/meteorGrey_small1.png')
    .add('meteorSmall2', 'img/Meteors/meteorGrey_small2.png')
    .add('powerUpTimer', 'img/Power-ups/powerupBlue.png')
    .on('progress', progressHandler)
    .load(setup);

function progressHandler(){
    console.log('Loading...');
}

function setup(){
    console.log('Setting up...');

    app.renderer.resize(720, 960);
    app.renderer.backgroundColor = 0x000000;

    var background = new TilingSprite(resources.backgroundTile.texture, 1080, 1920);
    var player = new Sprite(resources.player.texture);
    var pseudo = '';

    do{
        pseudo = prompt("Pseudo: (5 caractères maximum)");
    } while(pseudo == null || pseudo == '' || pseudo.length > 5 );

    String.prototype.removeSpecialCharacters = function(){
        return this.replace(/[^\w\s]/gi, '');
    }

    pseudo = pseudo.removeSpecialCharacters();
    pseudo = pseudo.toUpperCase();

    // User interaction

    app.stage.buttonMode = true;
    app.stage.interactive = true;

    // Background settings //

    background.position.x = 0;
    background.position.y = 0;
    background.scale.x = 0.7;
    background.scale.y = 0.7;
    background.tilePosition.x = 0;
    background.tilePosition.y = 0;

    app.stage.addChild(background);

    // ########################################### //
    // GAME SETTINGS
    // ########################################### //

    const DEFAULT_TIMER = 60;
    const FIRE_RATE = 30;
    const LASER_SPEED = 5;

    const ENEMY_SPEED = 0.7;
    const ENEMY_SPAWN_TIMER = 350;
    const METEOR_SPEED = 0.7;
    const METEOR_ROTATION = 0.0025;
    const TIMERUP_SPEED = 1.5;

    var GAME_STATE = '';

    var gameTimer = 0;
    var enemyTimer = 0;
    var fireRateTimer = 0;
    var enemyFireRateTimer = 0;
    var playerScore = 0;

    // Score settings

    var scoreStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: ['#ffffff', '#dddddd']
    });

    var scoreText = new Text('Score: 0', scoreStyle)
    scoreText.x = 30;
    scoreText.y = 30;

    // Timer settings

    var style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: ['#ffffff', '#dddddd']
    });

    var timeleft = DEFAULT_TIMER;

    var timer = new Text(timeleft, style)
    timer.x = app.renderer.width - 100;
    timer.y = 30;

    function init(){
        // Player settings //

        player.x = app.renderer.width / 2;
        player.y = app.renderer.height / 2;

        player.scale.x = 0.5;
        player.scale.y = 0.5;

        player.anchor.x = 0.5;
        player.anchor.y = 0.5;

        app.stage.addChild(player);

        playerScore = 0;
        app.stage.addChild(scoreText);

        playtime = 0;
        timeleft = DEFAULT_TIMER;
        app.stage.addChild(timer);

    }


    /*  ###########################################

            GAME TICKER

        ########################################### */

    app.ticker.add(function(delta) {

        background.tilePosition.x -= 0.064;
        background.tilePosition.y += 1.024;

        player.x = app.renderer.plugins.interaction.mouse.global.x;
        player.y = app.renderer.plugins.interaction.mouse.global.y;

        if(GAME_STATE == 'running'){
            gameLogic(delta);
        } else if(GAME_STATE == '' || GAME_STATE == 'gameover'){
            app.renderer.plugins.interaction.on('mousedown', function(){
                if(GAME_STATE == 'gameover'){
                    gameOver('remove');
                    init();
                } else if (GAME_STATE == ''){
                    startScreen('remove');
                    init();
                }
                GAME_STATE = 'running';
            });
        }

        app.renderer.render(app.stage);
    });



    function gameLogic(delta){
        gameTimer += delta;
        enemyTimer += delta;
        fireRateTimer += delta;

        scoreText.setText('Score: ' + playerScore);

        if(player.x <= 30){ player.x = 30; }
        if(player.x >= app.renderer.width - 30){ player.x = app.renderer.width - 30 }
        // if(player.y <= app.renderer.height / 2.5){ player.y = app.renderer.height / 2.5 }
        if(player.y >= app.renderer.height - 30){ player.y = app.renderer.height - 30 }

        if(gameTimer > 60){
            updateTimer();
            gameTimer = 0;
        }



        // Spawn des ennemies
        enemySpawnTimer = Math.floor(Math.random() * 300) + 150;

        if(enemyTimer > ENEMY_SPAWN_TIMER){
            enemySpawn();
            meteorSpawn();
            enemyTimer = 0;
        }

        // Déplacement du laser
        for(let laser of lasers){
            laser.position.y -= LASER_SPEED;
        }

        // Pattern des ennemies
        for(let enemy of enemies){
            if(enemy.gameplay.type == 'enemy'){

                enemy.prop.position.y += ENEMY_SPEED;

                if(fireRateTimer > FIRE_RATE){
                    enemyLaserSpawn({
                        x: enemy.prop.position.x,
                        y: enemy.prop.position.y
                    });
                }

                if(enemy.prop.position.x < enemy.gameplay.xmin){
                    enemy.gameplay.dir = 1;
                } else if(enemy.prop.position.x > enemy.gameplay.xmax){
                    enemy.gameplay.dir = 0;
                }

                if(enemy.gameplay.dir == 0){
                    enemy.prop.position.x -= 1;
                }else{
                    enemy.prop.position.x += 1;

                }
            } else if(enemy.gameplay.type == 'meteor'){
                enemy.prop.position.y += METEOR_SPEED;

                if(enemy.gameplay.dir == 0){
                    enemy.prop.position.x -= enemy.gameplay.angle;
                    enemy.prop.rotation -= METEOR_ROTATION;
                }else{
                    enemy.prop.position.x += enemy.gameplay.angle;
                    enemy.prop.rotation += METEOR_ROTATION;

                }
            }

            if(enemy.gameplay.type == 'laser'){
                enemy.prop.position.y += LASER_SPEED;
            } else if(enemy.gameplay.type == 'powerUpTimer'){
                enemy.prop.position.y += TIMERUP_SPEED;
            }
        }

        collisionDetection();

        // Tirer
        if(fireRateTimer > FIRE_RATE){
            playerShoot({x: player.x, y: player.y});
            fireRateTimer = 0;
        }

        // Réajuster le timer
        if(playerScore < 0){ playerScore = 0; }
    }

    /*  ###########################################

            GAMEPLAY

        ########################################### */

    // Timer updating

    function updateTimer(add){
        if(!add){
            if(timeleft > 0){
                playtime += 1;
                timeleft -= 1;
                timer.setText(timeleft);
            } else{
                gameOver();
            }
        }else{
            timeleft += add;
            timer.setText(timeleft);
        }

    }

    // User shooting lasers //

    var lasers = [];

    function playerShoot(startPosition){
        var laser = new PIXI.Sprite(resources.playerLaser.texture);
        laser.position.x = startPosition.x - 3;
        laser.position.y = startPosition.y - 40;

        laser.scale.x = 0.5;
        laser.scale.y = 0.5;

        app.stage.addChild(laser);
        lasers.push(laser);

    }

    // Enemy spawning

    var enemies = [];

    function enemySpawn(){
        var spawnPos = Math.floor(Math.random() * (app.renderer.width - 120)) + 120,
            minRange = spawnPos - 60,
            maxRange = spawnPos + 60;

        var enemyTextures = [resources.enemyRed1.texture,
                            resources.enemyRed2.texture,
                            resources.enemyRed3.texture];

        var randomTexture = enemyTextures[Math.floor(Math.random() * enemyTextures.length)];

        var enemy = new PIXI.Sprite(randomTexture);

        var direction = Math.floor(Math.random() * 9) % 2;

        enemy.position.x = spawnPos;
        enemy.position.y = - 20;

        enemy.scale.x = 0.5;
        enemy.scale.y = 0.5;

        app.stage.addChild(enemy);
        enemies.push({
            prop: enemy,
            gameplay: {
                type: 'enemy',
                xmin: minRange,
                xmax: maxRange,
                dir: direction
            }
        });
    }

    function enemyLaserSpawn(startPosition){

        var texture = resources.enemyLaser.texture;

        var laser = new PIXI.Sprite(texture);

        laser.position.x = startPosition.x + 23;
        laser.position.y = startPosition.y + 60;

        laser.scale.x = 0.5;
        laser.scale.y = 0.5;
        laser.rotation += Math.PI * 2 * 0.5
        app.stage.addChild(laser);
        enemies.push({
            prop: laser,
            gameplay: {
                type: 'laser'
            }
        });
    }

    function meteorSpawn(){
        var spawnPos = Math.floor(Math.random() * (app.renderer.width + 120)) - 120;
        var spawnAngle = Math.random() * 1 + 0.0025;

        var meteorTextures = [
            resources.meteorBig1.texture,
            resources.meteorBig2.texture,
            resources.meteorBig3.texture,
            resources.meteorMed1.texture,
            resources.meteorMed2.texture,
            resources.meteorSmall1.texture,
            resources.meteorSmall2.texture,
        ];

        var randomTexture = meteorTextures[Math.floor(Math.random() * meteorTextures.length)]

        var meteor = new PIXI.Sprite(randomTexture);

        var direction = Math.floor(Math.random() * 9) % 2;

        meteor.position.x = spawnPos;
        meteor.position.y = - 20;

        meteor.pivot.x = meteor.width / 2;
        meteor.pivot.y = meteor.height / 2;

        meteor.scale.x = 0.5;
        meteor.scale.y = 0.5;

        app.stage.addChild(meteor);
        enemies.push({
            prop: meteor,
            gameplay: {
                type: 'meteor',
                dir: direction,
                angle: spawnAngle
            }
        });
    }

    function spawnLoot(startPosition){

        var texture = resources.powerUpTimer.texture;

        var loot = new PIXI.Sprite(texture);

        loot.position.x = startPosition.x + 5;
        loot.position.y = startPosition.y + 5;

        loot.scale.x = 0.5;
        loot.scale.y = 0.5;
        // loot.rotation += Math.PI * 2 * 0.5
        app.stage.addChild(loot);
        enemies.push({
            prop: loot,
            gameplay: {
                type: 'powerUpTimer'
            }
        });
    }

    function collisionDetection(){

        // Collision entre ennemies/meteors et l'extérieur du jeu

        for(var e = 0; e < enemies.length; e++){
            var _this = enemies[e];

            if(enemies[e].prop.position.y >= app.renderer.height + 50){
                if(_this.gameplay.type == 'enemy'){
                    console.log('Enemy ship out of bound')
                    playerScore -= 10;
                }
                enemies.splice(e, 1);
                app.stage.removeChild(_this.prop);

            }


            // Collision entre lasers du joueur et ennemis/meteors

            for(var l = 0; l < lasers.length; l++){

                var xdist = _this.prop.position.x - lasers[l].position.x + 20;
                if(xdist > -_this.prop.width / 2 && xdist < _this.prop.width / 2){
                    var ydist = _this.prop.position.y - lasers[l].position.y;

                    if(ydist > -_this.prop.height / 2 && ydist < _this.prop.height / 2) {
                        if(_this.gameplay.type == 'enemy' || _this.gameplay.type == 'meteor'){
                            console.log('Enemy or Meteor destroyed')
                            app.stage.removeChild(lasers[l]);
                            app.stage.removeChild(_this.prop);
                            lasers.splice(l, 1);
                            enemies.splice(e, 1);
                        }
                        if(_this.gameplay.type == 'enemy'){
                            playerScore += 5;
                            if(Math.floor(Math.random() * 100) <= 20) {
                                spawnLoot({
                                    x: _this.prop.position.x,
                                    y: _this.prop.position.y
                                })
                            }
                        }
                    }
                }


            }


            // Collision entre joueur et ennemis ou powerup

            var xdist = player.position.x - _this.prop.position.x + 0;
            if(xdist > -player.width / 2 && xdist < player.width / 2){
                var ydist = player.position.y - _this.prop.position.y;

                if(ydist > -player.height / 2 && ydist < player.height / 2) {
                    if(_this.gameplay.type == 'enemy' || _this.gameplay.type == 'meteor' || _this.gameplay.type == 'laser'){
                        console.log('Player destroyed')
                        app.stage.removeChild(player);
                        app.stage.removeChild(_this.prop);
                        enemies.splice(e, 1);
                        gameOver();
                    } else if(_this.gameplay.type == 'powerUpTimer'){
                        app.stage.removeChild(_this.prop);
                        enemies.splice(e, 1);
                        updateTimer(30);
                    }

                }
            }


        }
    }

    var titleText = new Text('Space Survivor', {
        fontFamily: 'Arial',
        fontSize: 80,
        fontWeight: 'bold',
        fill:['#4286f4', '#2d62b7']
    })

    var guideText = new Text('Utilisez la souris pour vous deplacer', {
        fontFamily: 'Arial',
        fontSize: 30,
        fontWeight: 'bold',
        fill:['#ffffff', '#dddddd']
    })

    var playText = new Text('Cliquez pour jouer', {
        fontFamily: 'Arial',
        fontSize: 50,
        fontWeight: 'bold',
        fill:['#ffffff', '#dddddd']
    })

    var gameOverText = new Text('Game Over', {
        fontFamily: 'Arial',
        fontSize: 80,
        fontWeight: 'bold',
        fill: ['#db3954', '#b72d44']
    })

    function sendScore(){
        if(playerScore >= (playtime * 5)){
            playerScore = 0;
        }
        $.ajax({
             url: 'server.php',
             type: 'POST',
             data: 'score=' + playerScore + '&pseudo=' + pseudo,
             success: function () {
                 getScorelist();
             },
             error: function () {
                 console.log("votre score n'a pas été envoyé");
             }
        });
    }

    var scorelist = [];

    function getScorelist(){
        $.ajax({
            url: 'server.php',
            type: 'GET',
            data: 'score=all',
            dataType: 'json',
            success: function (data) {
                scorelist = [];
                var score;
                do{
                    if(data[scorelist.length].score == 0){
                        score = 'Tricheur :D';
                    } else {
                        score = data[scorelist.length].score;
                    }
                    var scoreItem = new Text((scorelist.length + 1) + '. ' + data[scorelist.length].pseudo + ' - ' + score, {
                        fontFamily: 'Arial',
                        fontSize: 30,
                        fontWeight: 'bold',
                        fill:['#ffffff', '#dddddd']
                    });

                    scoreItem.x = 250;
                    scoreItem.y = 450 + (scorelist.length * 40);

                    app.stage.addChild(scoreItem);

                    scorelist.push(scoreItem)
                } while (scorelist.length < data.length)
            },
            error: function () {
                 console.log("Meilleurs scores non reçus");
            }
        });
    }

    if(GAME_STATE == ''){
        startScreen();
    }

    // Start screen

    function startScreen(action){

        titleText.x = 70;
        titleText.y = 200;

        guideText.x = 100;
        guideText.y = 400;

        playText.x = 140;
        playText.y = 600;

        if(action == null || action == 'add'){
            app.stage.addChild(titleText);
            app.stage.addChild(guideText);
            app.stage.addChild(playText);
        } else if(action == 'remove'){
            app.stage.removeChild(titleText);
            app.stage.removeChild(guideText);
            app.stage.removeChild(playText);
        }
    }

    // Game over

    function gameOver(action){

        for(var enemy of enemies){
            app.stage.removeChild(enemy.prop);
        }

        for(var laser of lasers){
            app.stage.removeChild(laser);
        }

        enemies = [];
        lasers = [];

        gameOverText.x = 150;
        gameOverText.y = 300;

        if(action == null || action == 'add'){
            GAME_STATE = 'gameover';
            if(playerScore != 0){
                sendScore();
            } else {
                getScorelist();
            }
            app.stage.addChild(gameOverText);

        } else if(action == 'remove'){
            app.stage.removeChild(gameOverText);
            console.log(scorelist)
            do{
                app.stage.removeChild(scorelist[0]);
                scorelist.splice(0, 1);
            } while(scorelist.length != 0)
        }
    }

    console.log('Setup!');
};
