<?php

function connectToDb(){
    try{
        $db = new PDO('mysql:host=localhost;dbname=duman;charset=utf8', 'duman','c67fp87iC758ZkE');
    }

    catch(Exception $e){
        die('Error : '.$e->getMessage());
    }
    return $db;
}

function sanitize($input){
    return filter_var($input, FILTER_SANITIZE_STRING);
};

if(isset($_POST['pseudo']) && isset($_POST['score'])){
    addScore(sanitize($_POST['pseudo']), sanitize($_POST['score']));
} else {
    getScore();
}

function getScore(){
    $pdo = connectToDb();
    try{
        $query = $pdo->query('SELECT * FROM `jeu` ORDER BY `score` DESC LIMIT 5');
        $result = $query->fetchAll();
    } catch (PDOException $ex) {
        die($ex->getMessage());
    }

    echo json_encode($result);
}

function addScore($pseudo, $score){
    $pdo = connectToDb();
    try{
        $req = "INSERT INTO `jeu` (`pseudo`, `score`) VALUES (:pseudo, :score)";
        $query = $pdo->prepare($req);
        $res = $query->execute([
            'pseudo'=>$pseudo,
            'score'=>$score
        ]);
    } catch (PDOException $ex) {
        die($ex->getMessage());
    }
    return $res;
}
