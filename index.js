const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connecté'))
.catch(() => console.log('Erreur de connexion à MongoDB'));

// Définition des schémas
const userSchema = mongoose.Schema({
    username: {
      type: String,
      required: true
    }
});

const User = mongoose.model('User', userSchema);

const exerciceSchema = mongoose.Schema({
     userId: {
         type: mongoose.Schema.Types.ObjectId, 
         ref:'User',
         required: true
     },
     description: {
        type: String,
        maxlength: 20,
        required: true
     },
     duration: {
        type: Number,
        required: true
     },
     date: {
        type: Date,
        default: Date.now
     }
});

const Exercice = mongoose.model('Exercice', exerciceSchema);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Création d'un utilisateur
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.json({ error: "Nom d'utilisateur requis" });
    }
  
    const user = new User({ username });
    await user.save();
    return res.json({
      username: user.username, 
      _id: user._id
    });
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Récupération de la liste des utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Ajout d'un exercice à un utilisateur
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
  
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'Utilisateur non trouvé' });
    }

    if (!description) {
      return res.json({ error: 'La description est requise' });
    }

    if (description.length > 20) {
      return res.json({ error: 'La description est trop longue' });
    }

    const durationInt = parseInt(duration);
    if (!duration || isNaN(durationInt)) {
      return res.json({ error: 'Durée requise et doit être un nombre valide' });
    }

    const exerciseDate = date ? new Date(date) : new Date();

    const exercice = new Exercice({
      userId,
      description,
      duration: durationInt,
      date: exerciseDate
    });

    await exercice.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercice.description,
      duration: exercice.duration,
      date: exercice.date.toDateString(),
    });
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Affichage des logs d'exercice d'un utilisateur
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'Utilisateur non trouvé' });
    }

    let exercises = await Exercice.find({ userId });

    // Appliquer les filtres 'from', 'to', et 'limit'
    const { from, to, limit } = req.query;

    if (from) {
      const fromDate = new Date(from);
      exercises = exercises.filter(exercise => exercise.date >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      exercises = exercises.filter(exercise => exercise.date <= toDate);
    }

    if (limit) {
      exercises = exercises.slice(0, parseInt(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString()
      }))
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Démarrage du serveur
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Votre application est en écoute sur le port ' + listener.address().port);
});
