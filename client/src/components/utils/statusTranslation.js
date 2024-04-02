const translateStatus = (status) => {
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
  