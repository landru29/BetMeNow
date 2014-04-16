'use strict';

angular.module("wcb.i18n", [], ["$provide", function($provide) {
  $provide.constant("I18N.MESSAGES", {
    'errors.route.changeError':'Erreur lors du changement de route',
    'crud.user.save.success':"L'utilisateur avec l'ID '{{id}}' a été sauvé avec succès.",
    'crud.user.remove.success':"L'utilisateur avec l'ID '{{id}}' a été supprimé avec succès.",
    'crud.user.remove.error':"Une erreur est apparue lors de la suppression de l'utilisateur avec l'ID '{{id}}'.",
    'crud.user.save.error':"Une erreur est apparue lors de l'enregistrement de l'utilisateur...",
    'login.reason.notAuthorized':"Vous n'avez pas les droits nécessaires. Voulez vous vous connecter avec un autre compte ?",
    'login.reason.notAuthenticated':"Vous devez être connecté pour acceder à cette partie de l'application.",
    'login.error.invalidCredentials': "Erreur de connection. Merci de vérifier vos informations et réessayez.",
    'login.error.serverError': "Il y a un problème avec l'authentification: {{exception}}.",
    'login.info': "Merci de renseigner vos informations de connexion",
    'menu.title.teams.create': 'Créer une équipe',
    'menu.title.teams.list': 'Equipes',
    'menu.title.matches.create': 'Créer un match',
    'menu.title.matches.list': 'Matchs',
    'menu.title.pronostics.list': 'Pronostiques',
    'menu.signin': 'Connexion',
    'menu.signout': 'Déconnexion',
    'menu.register': 'Inscription',
    'form.register.fullname': 'Nom complet',
    'form.register.username': 'Nom d\'utilisateur',
    'form.register.password': 'Mot de passe',
    'form.register.password.repeat': 'Répeter le mot de passe',
    'form.register.signup': 'Inscription',
    'form.register.login': 'connexion',
    'form.register.infos': "Bonjour et bienvenue,<br/><br/>En vous inscrivant, vous pourrez réaliser des pronostiques sur les matches à venir et vous comparer aux autres utilisateurs de l'application.<br/><br/>Bons pronostiques.",
    'page.index.welcome': 'Bienvenue sur le site de pronostiques de la coupe du monde de foot du Brésil 2014'
  });
}]);