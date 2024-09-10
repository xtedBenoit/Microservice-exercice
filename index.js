const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const users = {};
const exercices = {};
let nextId = 6564636261605901; 

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.json({ error: "Nom d'utilisateur requis" });
  }

  const userId = nextId++;
  users[userId] = { username, _id: userId, logs: [] };

  res.json({
    username,
    _id: userId
  });
});

// 4. GET pour obtenir la liste de tous les utilisateurs
app.get('/api/users', (req, res) => {
  const userList = Object.values(users).map(user => ({
    username: user.username,
    _id: user._id,
  }));

  res.json(userList);
});

// 7. POST pour ajouter un exercice à un utilisateur
app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  const user = users[userId];

  if (!user) {
    return res.json({ error: 'Utilisateur non trouvé' });
  }

  if(!description) {
       return res.json({ error : 'La description est requis' })
  }

  if(description && description.length > 20){
    return res.json({ error : 'La description est trop longue' })
  }

  const durationInt = parseInt(duration);
  if (!duration || isNaN(durationInt)) {
    return res.json({ error: 'Durée requise et doit être un nombre valide' });
  }
  
  // Si aucune date n'est fournie, utiliser la date actuelle
  const exerciseDate = date ? new Date(date) : new Date();

  const exercise = {
    description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString() 
  };

  // Ajouter l'exercice aux logs de l'utilisateur
  user.logs.push(exercise);

  res.json({
    _id: userId,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// 9. GET pour afficher les logs d'exercice d'un utilisateur
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users[userId];

  if (!user) {
    return res.json({ error: 'Utilisateur non trouvé' });
  }

  let logs = user.logs;

  // 16. Filtrer les logs avec les paramètres 'from', 'to' et 'limit'
  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    logs = logs.filter(exercise => new Date(exercise.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    logs = logs.filter(exercise => new Date(exercise.date) <= toDate);
  }

  if (limit) {
    logs = logs.slice(0, parseInt(limit));
  }

  res.json({
    _id: userId,
    username: user.username, 
    count: logs.length,
    log: logs
  });
});

// Démarrer le serveur
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
