import type { AppLocale } from './en'

const fr: AppLocale = {
  common: {
    loading: 'Chargement…',
    error: 'Une erreur est survenue.',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    back: 'Retour',
    search: 'Rechercher',
  },
  auth: {
    login: {
      heading: 'Bon retour.',
      sub: 'Connectez-vous à votre compte.',
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      submit: 'Se connecter →',
      submitting: 'Connexion…',
      error: {
        empty: 'Veuillez entrer votre e-mail et votre mot de passe.',
        failed: 'Échec de la connexion. Veuillez réessayer.',
      },
    },
    logout: 'Se déconnecter',
  },
  booking: {
    title: 'Mes réservations',
    create: 'Nouvelle réservation',
    delete: 'Annuler la réservation',
    empty: 'Aucune réservation trouvée.',
    fields: {
      room: 'Salle',
      date: 'Date',
      time: 'Heure',
      usage: 'Usage',
    },
  },
  room: {
    title: 'Salles',
    create: 'Ajouter une salle',
    edit: 'Modifier la salle',
    delete: 'Supprimer la salle',
    empty: 'Aucune salle trouvée.',
    fields: {
      name: 'Nom',
      floor: 'Étage',
      roomNumber: 'Numéro de salle',
    },
  },
  staff: {
    dashboard: 'Tableau de bord staff',
    bookings: 'Toutes les réservations',
    rooms: 'Gérer les salles',
  },
  user: {
    dashboard: 'Mon tableau de bord',
    bookings: 'Mes réservations',
  },
}

export default fr
