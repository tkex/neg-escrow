const translateStatus = (status) => {
  
    // Siehe Schema-Definition im Backend
    const statusTranslations = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'rejected': 'Abgelehnt',
      'cancelled': 'Abgebrochen',
      'accepted': 'Akzeptiert'
    };

    return statusTranslations[status] || status;
  };
  
  export default translateStatus;
  